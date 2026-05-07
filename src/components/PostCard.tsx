// ─────────────────────────────────────────────────────────────────────────────
// components/PostCard.tsx — One feed post card
// ─────────────────────────────────────────────────────────────────────────────

import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { activeTheme } from '../lib/theme'
import { WX_EMOJI } from '../constants'
import type { FeedItem } from '../types'

interface Props {
  post:    FeedItem
  onPress: () => void
}

export default function PostCard({ post, onPress }: Props) {
  const t       = activeTheme()
  const author  = post.author
  const initials = author?.initials ?? '?'
  const showStars = (post.rating ?? 0) > 0

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={s.header}>
        <View style={[s.avatar, { backgroundColor: t.light, borderColor: t.border }]}>
          {author?.avatarUrl
            ? <Image source={{ uri: author.avatarUrl }} style={s.avatarImg} />
            : <Text style={[s.avatarText, { color: t.primary }]}>{initials}</Text>}
        </View>
        <View style={s.flex1}>
          <Text style={[s.author, { color: t.text }]} numberOfLines={1}>
            {author?.name ?? 'Unknown traveller'}
          </Text>
          <Text style={[s.sub, { color: t.muted }]} numberOfLines={1}>
            {author?.shipName ? `${author.shipName} · ` : ''}Day {post.dayNumber}
            {post.resolvedPort ? ` · ${post.resolvedPort}` : ''}
          </Text>
        </View>
        {post.date && <Text style={[s.date, { color: t.muted }]}>{post.date}</Text>}
      </View>

      {post.photo?.dataUrl
        ? <Image source={{ uri: post.photo.dataUrl }} style={s.photo} />
        : null}

      {!!(post.highlights || post.bestMoment) && (
        <Text style={[s.body, { color: t.text }]} numberOfLines={4}>
          {post.highlights || post.bestMoment}
        </Text>
      )}

      <View style={s.footer}>
        {post.weather?.length > 0 && (
          <Text style={[s.metaChip, { color: t.muted }]}>
            {post.weather.map((w) => WX_EMOJI[w] ?? '').join(' ')}
          </Text>
        )}
        {showStars && (
          <Text style={[s.metaChip, { color: t.accent }]}>
            {'★'.repeat(post.rating)}{'☆'.repeat(5 - post.rating)}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card:       { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  flex1:      { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  avatarImg:  { width: '100%', height: '100%' },
  avatarText: { fontWeight: '700' },
  author:     { fontSize: 15, fontWeight: '600' },
  sub:        { fontSize: 12, marginTop: 1 },
  date:       { fontSize: 12 },
  photo:      { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#EEE' },
  body:       { fontSize: 14, lineHeight: 20 },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaChip:   { fontSize: 13 },
})
