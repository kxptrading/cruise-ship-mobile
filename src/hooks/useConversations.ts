import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ConvMember {
  userId: string
  name:   string
  avatar: string
}

export interface Conversation {
  id:           string
  type:         'direct' | 'group'
  displayName:  string
  lastMsg:      { body: string; createdAt: string; fromMe: boolean } | null
  unread:       number
  otherMembers: ConvMember[]
  myLastReadAt: string | null
}

export interface Friend {
  userId: string
  name:   string
  avatar: string
}

interface Options { userId: string | null }

export function useConversations({ userId }: Options) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends,       setFriends]       = useState<Friend[]>([])
  const [loaded,        setLoaded]        = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoaded(true); return }

    // ── 1. My memberships ─────────────────────────────────────────────────
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    const convIds = (memberships ?? []).map(m => m.conversation_id)
    const myReadMap = new Map((memberships ?? []).map(m => [m.conversation_id, m.last_read_at as string | null]))

    // ── 2. Parallel: conversations + all members + recent messages ─────────
    const [convsRes, membersRes, msgsRes, friendsRes] = await Promise.all([
      convIds.length
        ? supabase.from('conversations').select('*').in('id', convIds)
        : Promise.resolve({ data: [] }),
      convIds.length
        ? supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds)
        : Promise.resolve({ data: [] }),
      convIds.length
        ? supabase.from('messages').select('id, conversation_id, user_id, body, created_at')
            .in('conversation_id', convIds).order('created_at', { ascending: false }).limit(300)
        : Promise.resolve({ data: [] }),
      supabase.from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted'),
    ])

    // ── 3. Profiles for all involved users ───────────────────────────────
    const memberUserIds  = [...new Set((membersRes.data ?? []).map((m: any) => m.user_id))]
    const rawFriends     = (friendsRes.data ?? []) as { from_user_id: string; to_user_id: string }[]
    const friendUserIds  = rawFriends.map(f => f.from_user_id === userId ? f.to_user_id : f.from_user_id)
    const allUserIds     = [...new Set([...memberUserIds, ...friendUserIds])]

    const { data: profilesData } = allUserIds.length
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url, email').in('user_id', allUserIds)
      : { data: [] }

    const profileMap = new Map((profilesData ?? []).map((p: any) => [p.user_id, p]))

    // ── 4. Build friends list ────────────────────────────────────────────
    const builtFriends: Friend[] = friendUserIds.map(id => {
      const p = profileMap.get(id) as any
      return { userId: id, name: p?.display_name || p?.email?.split('@')[0] || 'User', avatar: p?.avatar_url || '' }
    })
    setFriends(builtFriends)

    // ── 5. Build conversations ───────────────────────────────────────────
    const msgs    = (msgsRes.data   ?? []) as any[]
    const members = (membersRes.data ?? []) as any[]

    const lastMsgMap = new Map<string, any>()
    for (const msg of msgs) {
      if (!lastMsgMap.has(msg.conversation_id)) lastMsgMap.set(msg.conversation_id, msg)
    }

    const membersMap = new Map<string, any[]>()
    for (const m of members) {
      if (!membersMap.has(m.conversation_id)) membersMap.set(m.conversation_id, [])
      membersMap.get(m.conversation_id)!.push(m)
    }

    const built: Conversation[] = (convsRes.data ?? []).map((conv: any) => {
      const lastMsg    = lastMsgMap.get(conv.id)
      const myLastRead = myReadMap.get(conv.id) ?? null

      const unread = msgs.filter(m =>
        m.conversation_id === conv.id &&
        m.user_id !== userId &&
        (!myLastRead || m.created_at > myLastRead)
      ).length

      const convMembers = (membersMap.get(conv.id) ?? []).filter((m: any) => m.user_id !== userId)
      const otherMembers: ConvMember[] = convMembers.map((m: any) => {
        const p = profileMap.get(m.user_id) as any
        return { userId: m.user_id, name: p?.display_name || p?.email?.split('@')[0] || 'User', avatar: p?.avatar_url || '' }
      })

      const displayName = conv.type === 'group'
        ? (conv.name || 'Group Chat')
        : (otherMembers[0]?.name || 'Unknown')

      return {
        id: conv.id,
        type: conv.type as 'direct' | 'group',
        displayName,
        lastMsg: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.created_at, fromMe: lastMsg.user_id === userId } : null,
        unread,
        otherMembers,
        myLastReadAt: myLastRead,
      }
    }).sort((a, b) => {
      const ta = a.lastMsg?.createdAt ?? ''
      const tb = b.lastMsg?.createdAt ?? ''
      return tb.localeCompare(ta)
    })

    setConversations(built)
    setLoaded(true)
  }, [userId])

  useEffect(() => { load() }, [load])

  // ── Start or open a direct conversation ─────────────────────────────────
  const startDirect = useCallback(async (friendId: string): Promise<string | null> => {
    if (!userId) return null

    // Get my conversation IDs
    const { data: myMems } = await supabase
      .from('conversation_members').select('conversation_id').eq('user_id', userId)
    const myIds = (myMems ?? []).map((m: any) => m.conversation_id)

    if (myIds.length) {
      // Check if friend shares any of them and it's a direct conversation
      const { data: shared } = await supabase
        .from('conversation_members').select('conversation_id')
        .eq('user_id', friendId).in('conversation_id', myIds)
      for (const s of shared ?? []) {
        const { data: conv } = await supabase
          .from('conversations').select('id, type').eq('id', s.conversation_id).single()
        if (conv?.type === 'direct') return conv.id
      }
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from('conversations').insert({ type: 'direct', created_by: userId }).select().single()
    if (error || !conv) return null

    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: friendId },
    ])

    await load()
    return conv.id
  }, [userId, load])

  return { conversations, friends, loaded, refresh: load, startDirect }
}
