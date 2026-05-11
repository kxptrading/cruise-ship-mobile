import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../../src/lib/auth'
import { useMessages } from '../../../src/hooks/useMessages'
import { supabase } from '../../../src/lib/supabase'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'
import type { ChatMessage } from '../../../src/hooks/useMessages'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateLabel(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

interface MemberProfile { userId: string; name: string; avatar: string }

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, url }: { name: string; url?: string }) {
  const t = activeTheme()
  return (
    <View style={[av.wrap, { backgroundColor: t.primary + '22', borderColor: t.border }]}>
      {url
        ? <Image source={{ uri: url }} style={av.img} />
        : <Text style={[av.initials, { color: t.primary }]}>{initials(name)}</Text>}
    </View>
  )
}
const av = StyleSheet.create({
  wrap:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  img:      { width: '100%', height: '100%' },
  initials: { fontSize: 11, fontFamily: F_BOLD },
})

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg, isMe, senderName, showSender, memberMap }: {
  msg: ChatMessage; isMe: boolean; senderName: string
  showSender: boolean; memberMap: Map<string, MemberProfile>
}) {
  const t = activeTheme()
  const sender = memberMap.get(msg.user_id)

  return (
    <View style={[b.row, isMe && b.rowMe]}>
      {!isMe && (
        <View style={b.avatarSlot}>
          {showSender && <Avatar name={senderName} url={sender?.avatar} />}
        </View>
      )}

      <View style={[b.col, isMe && b.colMe]}>
        {showSender && !isMe && (
          <Text style={[b.senderName, { color: t.primary }]}>{senderName}</Text>
        )}
        <View style={[
          b.bubble,
          isMe
            ? [b.bubbleMe, { backgroundColor: t.primary }]
            : [b.bubbleThem, { backgroundColor: t.surface, borderColor: t.border }],
          msg.isTemp && { opacity: 0.65 },
        ]}>
          <Text style={[b.bodyText, { color: isMe ? '#FFFFFF' : t.text }]}>{msg.body}</Text>
        </View>
        <Text style={[b.timestamp, { color: t.muted }, isMe && b.timestampMe]}>
          {fmtTime(msg.created_at)}
        </Text>
      </View>

      {isMe && <View style={b.avatarSlot} />}
    </View>
  )
}
const b = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2, paddingHorizontal: 12 },
  rowMe:        { flexDirection: 'row-reverse' },
  avatarSlot:   { width: 32 },
  col:          { maxWidth: '72%', gap: 2 },
  colMe:        { alignItems: 'flex-end' },
  senderName:   { fontSize: 11, fontFamily: F_BOLD, marginBottom: 2, marginLeft: 2 },
  bubble:       { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe:     { borderBottomRightRadius: 4 },
  bubbleThem:   { borderBottomLeftRadius: 4, borderWidth: 1 },
  bodyText:     { fontSize: 15, fontFamily: F_BODY, lineHeight: 21 },
  timestamp:    { fontSize: 10, fontFamily: F_BODY, color: '#999', marginLeft: 2 },
  timestampMe:  { marginRight: 2, marginLeft: 0 },
})

// ── Date separator ────────────────────────────────────────────────────────────

function DateSep({ label }: { label: string }) {
  const t = activeTheme()
  return (
    <View style={ds.wrap}>
      <View style={[ds.line, { backgroundColor: t.border }]} />
      <Text style={[ds.label, { color: t.muted, backgroundColor: t.bg }]}>{label}</Text>
      <View style={[ds.line, { backgroundColor: t.border }]} />
    </View>
  )
}
const ds = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 16 },
  line:  { flex: 1, height: 1 },
  label: { fontSize: 11, fontFamily: F_SEMI, paddingHorizontal: 10 },
})

// ── Input bar ─────────────────────────────────────────────────────────────────

function InputBar({ onSend, placeholder }: { onSend: (text: string) => void; placeholder: string }) {
  const t   = activeTheme()
  const [text, setText] = useState('')
  const canSend = text.trim().length > 0

  const handleSend = () => {
    if (!canSend) return
    onSend(text)
    setText('')
  }

  return (
    <View style={[ib.bar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        style={[ib.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
        multiline
        maxLength={2000}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[ib.sendBtn, { backgroundColor: canSend ? t.primary : t.border }]}
      >
        <Text style={ib.sendIcon}>↑</Text>
      </Pressable>
    </View>
  )
}
const ib = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input:   { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: F_BODY, maxHeight: 120, lineHeight: 20 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIcon:{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
})

// ── Main screen ───────────────────────────────────────────────────────────────

type ListItem = ChatMessage | { type: 'sep'; label: string; key: string }

export default function MessageThread() {
  const t      = activeTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const userId  = session?.user?.id ?? null

  const { messages, loaded, sendMessage, markRead } = useMessages({ conversationId: id ?? null, userId })

  // ── Conversation metadata ─────────────────────────────────────────────────
  const [convName,  setConvName]  = useState('Message')
  const [memberMap, setMemberMap] = useState<Map<string, MemberProfile>>(new Map())

  useEffect(() => {
    if (!id || !userId) return
    ;(async () => {
      const [convRes, memRes] = await Promise.all([
        supabase.from('conversations').select('type, name').eq('id', id).single(),
        supabase.from('conversation_members').select('user_id').eq('conversation_id', id),
      ])
      const memberIds = (memRes.data ?? []).map((m: any) => m.user_id)
      const { data: profiles } = memberIds.length
        ? await supabase.from('profiles').select('user_id, display_name, avatar_url, email').in('user_id', memberIds)
        : { data: [] }

      const map = new Map<string, MemberProfile>()
      for (const p of profiles ?? []) {
        map.set(p.user_id, {
          userId: p.user_id,
          name:   p.display_name || p.email?.split('@')[0] || 'User',
          avatar: p.avatar_url || '',
        })
      }
      setMemberMap(map)

      const otherIds = memberIds.filter((mid: string) => mid !== userId)
      if (convRes.data?.type === 'group') {
        setConvName(convRes.data.name || 'Group Chat')
      } else if (otherIds[0]) {
        setConvName(map.get(otherIds[0])?.name ?? 'Message')
      }
    })()
  }, [id, userId])

  // Mark as read when screen opens
  useEffect(() => { markRead() }, [markRead])

  // Scroll to bottom on new messages
  const listRef = useRef<FlatList>(null)
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  // Build list items with date separators
  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = []
    let lastDay = ''
    for (const msg of messages) {
      const day = msg.created_at.slice(0, 10)
      if (day !== lastDay) {
        items.push({ type: 'sep', label: fmtDateLabel(msg.created_at), key: `sep-${day}` })
        lastDay = day
      }
      items.push(msg)
    }
    return items
  }, [messages])

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if ('type' in item && item.type === 'sep') {
      return <DateSep label={item.label} />
    }
    const msg   = item as ChatMessage
    const isMe  = msg.user_id === userId
    const sender = memberMap.get(msg.user_id)
    const senderName = sender?.name ?? 'User'

    // Show sender name only when it changes in group chats or at first message
    const prevItem = listItems[index - 1]
    const prevMsg  = prevItem && !('type' in prevItem) ? prevItem as ChatMessage : null
    const showSender = !isMe && (!prevMsg || prevMsg.user_id !== msg.user_id)

    return <Bubble msg={msg} isMe={isMe} senderName={senderName} showSender={showSender} memberMap={memberMap} />
  }, [userId, memberMap, listItems])

  return (
    <>
      <StatusBar style="light" />
      <Stack.Screen options={{ title: convName }} />

      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          {!loaded ? (
            <View style={s.loader}><ActivityIndicator color={t.primary} /></View>
          ) : (
            <FlatList
              ref={listRef}
              data={listItems}
              keyExtractor={item => ('type' in item ? item.key : item.id)}
              renderItem={renderItem}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <InputBar onSend={sendMessage} placeholder={`Message ${convName}…`} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  flex1:  { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { paddingVertical: 12 },
})
