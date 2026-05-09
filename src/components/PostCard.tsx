import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { activeTheme } from '../lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../lib/fonts'
import { FluentEmoji } from './FluentEmoji'
import type { EmojiKey } from './FluentEmoji'
import type { FeedItem } from '../types'

// ── Weather emoji mapping ──────────────────────────────────────────────────

const WX_KEY: Record<string, EmojiKey> = {
  Sunny:  'sun',
  Cloudy: 'cloud',
  Rainy:  'cloud_with_rain',
  Windy:  'wind_face',
  Hot:    'fire',
  Mild:   'sun_behind_small_cloud',
  Cool:   'snowflake',
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  post:    FeedItem
  onPress: () => void
}

export default function PostCard({ post, onPress }: Props) {
  const t        = activeTheme()
  const author   = post.author
  const initials = author?.initials ?? '?'
  const hasPhoto = !!post.photo?.dataUrl
  const hasBody  = !!(post.highlights || post.bestMoment)
  const hasWeather = (post.weather?.length ?? 0) > 0
  const showStars  = (post.rating ?? 0) > 0

  // Context line: ship · port
  const contextParts = [author?.shipName, post.resolvedPort].filter(Boolean)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: t.surface, opacity: pressed ? 0.94 : 1 },
      ]}
    >
      {/* ── Author header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Avatar */}
        <View style={[s.avatarRing, { borderColor: t.primaryLt }]}>
          <View style={[s.avatar, { backgroundColor: t.primary + '22' }]}>
            {!!author?.avatarUrl
              ? <Image source={{ uri: author.avatarUrl }} style={s.avatarImg} />
              : <Text style={[s.avatarText, { color: t.primary }]}>{initials}</Text>}
          </View>
        </View>

        <View style={s.flex1}>
          <Text style={[s.authorName, { color: t.text }]} numberOfLines={1}>
            {author?.name ?? 'Traveller'}
          </Text>
          {contextParts.length > 0 && (
            <Text style={[s.authorSub, { color: t.muted }]} numberOfLines={1}>
              {contextParts.join(' · ')}
            </Text>
          )}
        </View>

        <View style={s.headerRight}>
          {!!post.date && (
            <Text style={[s.dateLabel, { color: t.muted }]}>{fmtDate(post.date)}</Text>
          )}
          <View style={[s.dayPill, { backgroundColor: t.primary + '15' }]}>
            <Text style={[s.dayPillText, { color: t.primary }]}>Day {post.dayNumber}</Text>
          </View>
        </View>
      </View>

      {/* ── Photo — full bleed within card via negative margins ────────── */}
      {hasPhoto && (
        <View style={s.photoWrap}>
          <Image
            source={{ uri: post.photo!.dataUrl }}
            style={s.photo}
            resizeMode="cover"
          />
        </View>
      )}

      {/* ── Body text ─────────────────────────────────────────────────── */}
      {hasBody && (
        <View style={[s.bodyWrap, hasPhoto && s.bodyAfterPhoto]}>
          {!hasPhoto && (
            <View style={[s.accentBar, { backgroundColor: t.primary }]} />
          )}
          <Text style={[s.bodyText, { color: t.text }]} numberOfLines={hasPhoto ? 3 : 5}>
            {post.highlights || post.bestMoment}
          </Text>
        </View>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      {(hasWeather || showStars) && (
        <View style={s.footer}>
          {/* Weather Fluent Emoji */}
          {hasWeather && (
            <View style={s.weatherRow}>
              {post.weather!.map(w => WX_KEY[w] ? (
                <FluentEmoji key={w} name={WX_KEY[w]} size={22} />
              ) : null)}
            </View>
          )}

          <View style={s.footerRight}>
            {/* Star rating */}
            {showStars && (
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <FluentEmoji
                    key={n}
                    name="star"
                    size={15}
                    opacity={n <= post.rating ? 1 : 0.18}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const CARD_PADDING = 16

const s = StyleSheet.create({
  card: {
    borderRadius:  22,
    overflow:      'hidden',
    // Shadow replaces border
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  12,
    elevation:     3,
  },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: CARD_PADDING },
  avatarRing:  { width: 50, height: 50, borderRadius: 25, borderWidth: 2, padding: 2, alignItems: 'center', justifyContent: 'center' },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:   { width: '100%', height: '100%' },
  avatarText:  { fontSize: 16, fontFamily: F_BOLD },
  flex1:       { flex: 1, minWidth: 0 },
  authorName:  { fontSize: 15, fontFamily: F_SEMI, lineHeight: 20 },
  authorSub:   { fontSize: 12, fontFamily: F_BODY, marginTop: 1 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  dateLabel:   { fontSize: 11, fontFamily: F_BODY },
  dayPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dayPillText: { fontSize: 11, fontFamily: F_BOLD },

  // Photo — negative margins to bleed to card edges
  photoWrap:   { marginHorizontal: 0, marginTop: 0 },
  photo:       { width: '100%', height: 260 },

  // Body
  bodyWrap:       { flexDirection: 'row', gap: 10, paddingHorizontal: CARD_PADDING, paddingTop: CARD_PADDING, paddingBottom: 4 },
  bodyAfterPhoto: { paddingTop: CARD_PADDING },
  accentBar:      { width: 3, borderRadius: 2, alignSelf: 'stretch' },
  bodyText:       { flex: 1, fontSize: 15, fontFamily: F_BODY, lineHeight: 23, letterSpacing: 0.1 },

  // Footer
  footer:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: CARD_PADDING, paddingVertical: 12, gap: 8 },
  weatherRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 },
  starsRow:    { flexDirection: 'row', gap: 1 },
})
