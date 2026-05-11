import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id:              string
  conversation_id: string
  user_id:         string
  body:            string
  created_at:      string
  isTemp?:         boolean
}

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

interface Options { conversationId: string | null; userId: string | null }

export function useMessages({ conversationId, userId }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loaded,   setLoaded]   = useState(false)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    setLoaded(false)
    supabase.from('messages').select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as ChatMessage[])
        if (!cancelled) setLoaded(true)
      })
    return () => { cancelled = true }
  }, [conversationId])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            // Replace matching temp message (same user + body within a few seconds)
            const tempIdx = prev.findIndex(m =>
              m.isTemp && m.user_id === msg.user_id && m.body === msg.body
            )
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = { ...msg, isTemp: false }
              return next
            }
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // ── Mark as read ──────────────────────────────────────────────────────────
  const markRead = useCallback(async () => {
    if (!conversationId || !userId) return
    await supabase.from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
  }, [conversationId, userId])

  // ── Send message (optimistic) ─────────────────────────────────────────────
  const sendMessage = useCallback(async (body: string) => {
    if (!conversationId || !userId || !body.trim()) return

    const tempId  = newId()
    const tempMsg: ChatMessage = {
      id:              tempId,
      conversation_id: conversationId,
      user_id:         userId,
      body:            body.trim(),
      created_at:      new Date().toISOString(),
      isTemp:          true,
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: userId, body: body.trim() })
      .select()
      .single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data as ChatMessage, isTemp: false } : m))
    } else {
      console.warn('send message error', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }, [conversationId, userId])

  return { messages, loaded, sendMessage, markRead }
}
