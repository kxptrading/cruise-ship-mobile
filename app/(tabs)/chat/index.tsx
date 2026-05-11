import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../../src/lib/auth'
import { useConversations } from '../../../src/hooks/useConversations'
import type { Conversation, Friend } from '../../../src/hooks/useConversations'
import { TopNav } from '../../../src/components/TopNav'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'
import { FluentEmoji } from '../../../src/components/FluentEmoji'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  if (!iso) return ''
  const d   = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = 48 }: { name: string; url?: string; size?: number }) {
  const t = activeTheme()
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.primary + '22', borderColor: t.border }]}>
      {url
        ? <Image source={{ uri: url }} style={av.img} />
        : <Text style={[av.initials, { color: t.primary, fontSize: size * 0.35 }]}>{initials(name)}</Text>}
    </View>
  )
}
const av = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  img:      { width: '100%', height: '100%' },
  initials: { fontFamily: F_BOLD },
})

// ── Conversation row ──────────────────────────────────────────────────────────

function ConvRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const t       = activeTheme()
  const other   = conv.otherMembers[0]
  const preview = conv.lastMsg
    ? (conv.lastMsg.fromMe ? `You: ${conv.lastMsg.body}` : conv.lastMsg.body)
    : 'No messages yet'

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [cr.row, { backgroundColor: pressed ? t.light : t.surface, borderBottomColor: t.border }]}>
      {conv.type === 'group'
        ? <View style={[cr.groupIcon, { backgroundColor: t.primary + '18' }]}>
            <Text style={cr.groupEmoji}>👥</Text>
          </View>
        : <Avatar name={other?.name ?? conv.displayName} url={other?.avatar} />}

      <View style={cr.body}>
        <View style={cr.topRow}>
          <Text style={[cr.name, { color: t.text }]} numberOfLines={1}>{conv.displayName}</Text>
          {conv.lastMsg && <Text style={[cr.time, { color: t.muted }]}>{fmtTime(conv.lastMsg.createdAt)}</Text>}
        </View>
        <View style={cr.bottomRow}>
          <Text style={[cr.preview, { color: t.muted }]} numberOfLines={1}>{preview}</Text>
          {conv.unread > 0 && (
            <View style={[cr.badge, { backgroundColor: t.primary }]}>
              <Text style={cr.badgeText}>{conv.unread > 99 ? '99+' : conv.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}
const cr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  groupIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  groupEmoji:{ fontSize: 22 },
  body:      { flex: 1, gap: 4 },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:      { fontSize: 15, fontFamily: F_SEMI, flex: 1 },
  time:      { fontSize: 11, fontFamily: F_BODY, marginLeft: 8 },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  preview:   { fontSize: 13, fontFamily: F_BODY, flex: 1 },
  badge:     { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: F_BOLD },
})

// ── New chat modal ────────────────────────────────────────────────────────────

function NewChatModal({ friends, visible, onClose, onSelect }: {
  friends: Friend[]; visible: boolean; onClose: () => void; onSelect: (id: string) => void
}) {
  const t = activeTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={nm.overlay} onPress={onClose}>
        <Pressable style={[nm.sheet, { backgroundColor: t.surface }]} onPress={e => e.stopPropagation()}>
          <View style={[nm.handle, { backgroundColor: t.border }]} />
          <Text style={[nm.title, { color: t.text }]}>New Message</Text>

          {friends.length === 0 ? (
            <View style={nm.empty}>
              <FluentEmoji name="people_hugging" size={64} />
              <Text style={[nm.emptyText, { color: t.muted }]}>No friends yet. Add friends on the web app to start chatting.</Text>
            </View>
          ) : (
            friends.map(f => (
              <Pressable key={f.userId} onPress={() => onSelect(f.userId)} style={[nm.row, { borderBottomColor: t.border }]}>
                <Avatar name={f.name} url={f.avatar} size={42} />
                <Text style={[nm.friendName, { color: t.text }]}>{f.name}</Text>
              </Pressable>
            ))
          )}
          <View style={{ height: 32 }} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}
const nm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '70%' },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 20, fontFamily: F_DISPLAY, marginBottom: 12 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  friendName: { fontSize: 15, fontFamily: F_SEMI },
  empty:      { alignItems: 'center', gap: 12, paddingVertical: 32 },
  emptyText:  { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 20 },
})

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ChatList() {
  const t      = activeTheme()
  const router = useRouter()
  const { session } = useAuth()
  const userId  = session?.user?.id ?? null

  const { conversations, friends, loaded, refresh, startDirect } = useConversations({ userId })

  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  const openConv = (id: string) => router.push(`/(tabs)/chat/${id}`)

  const handleSelectFriend = async (friendId: string) => {
    setShowNew(false)
    setCreating(true)
    const id = await startDirect(friendId)
    setCreating(false)
    if (id) openConv(id)
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  return (
    <>
      <StatusBar style="dark" />
      <TopNav />

      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        {/* Header row */}
        <View style={[s.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <View>
            <Text style={[s.heading, { color: t.text }]}>Messages</Text>
            {totalUnread > 0 && (
              <Text style={[s.subhead, { color: t.primary }]}>{totalUnread} unread</Text>
            )}
          </View>
          <Pressable
            onPress={() => setShowNew(true)}
            style={[s.newBtn, { backgroundColor: t.primary }]}
            hitSlop={8}
          >
            <Text style={s.newBtnText}>＋ New</Text>
          </Pressable>
        </View>

        {!loaded || creating ? (
          <View style={s.loader}><ActivityIndicator color={t.primary} /></View>
        ) : conversations.length === 0 ? (
          <View style={s.empty}>
            <FluentEmoji name="speech_balloon" size={80} />
            <Text style={[s.emptyTitle, { color: t.text }]}>No messages yet</Text>
            <Text style={[s.emptySub, { color: t.muted }]}>Start a conversation with a fellow traveller.</Text>
            <Pressable onPress={() => setShowNew(true)} style={[s.emptyBtn, { backgroundColor: t.primary }]}>
              <Text style={s.emptyBtnText}>＋ New Message</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={c => c.id}
            renderItem={({ item }) => <ConvRow conv={item} onPress={() => openConv(item.id)} />}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={t.primary} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <NewChatModal
        friends={friends}
        visible={showNew}
        onClose={() => setShowNew(false)}
        onSelect={handleSelectFriend}
      />
    </>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  heading:      { fontSize: 22, fontFamily: F_DISPLAY },
  subhead:      { fontSize: 12, fontFamily: F_SEMI, marginTop: 1 },
  newBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText:   { color: '#FFFFFF', fontFamily: F_BOLD, fontSize: 13 },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  emptyTitle:   { fontSize: 26, fontFamily: F_DISPLAY },
  emptySub:     { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 20 },
  emptyBtn:     { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#FFFFFF', fontFamily: F_BOLD, fontSize: 16 },
})
