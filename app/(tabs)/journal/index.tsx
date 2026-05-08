import { useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../../src/lib/auth'
import { useVoyage } from '../../../src/hooks/useVoyage'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function voyageProgress(departureDate: string, totalNights: number) {
  if (!departureDate || !totalNights) return { day: null, pct: 0, daysLeft: null }
  const start  = new Date(departureDate)
  const today  = new Date()
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
  const day    = Math.max(1, Math.min(elapsed + 1, totalNights))
  const pct    = Math.min(1, elapsed / totalNights)
  const daysLeft = Math.max(0, totalNights - elapsed)
  return { day, pct, daysLeft }
}

// ── Section definitions ───────────────────────────────────────────────────────

interface Section {
  key:   string
  emoji: string
  label: string
  sub:   string
  color: string
  href:  string
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function JournalHub() {
  const t      = activeTheme()
  const router = useRouter()
  const { userId } = useAuth()
  const { voyage, dailyLogs, loaded } = useVoyage({ userId })

  const totalNights = parseInt(voyage?.totalNights ?? '0') || 0
  const daysLogged  = dailyLogs.filter(d => d.highlights || d.bestMoment).length
  const { day: currentDay, pct, daysLeft } = useMemo(
    () => voyageProgress(voyage?.departureDate ?? '', totalNights),
    [voyage?.departureDate, totalNights],
  )

  const companions = useMemo(() => {
    if (!voyage) return []
    return [voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4]
      .filter(Boolean) as string[]
  }, [voyage])

  const sections: Section[] = [
    {
      key:   'daily',
      emoji: '📅',
      label: 'Daily Log',
      sub:   totalNights ? `${daysLogged} of ${totalNights} days written` : 'Day-by-day entries',
      color: t.primary,
      href:  '/(tabs)/journal/daily',
    },
    {
      key:   'highlights',
      emoji: '🏆',
      label: 'Highlights',
      sub:   'Your best moments',
      color: '#F43F5E',
      href:  '/(tabs)/journal/highlights',
    },
    {
      key:   'food',
      emoji: '🍴',
      label: 'Food Log',
      sub:   'Meals & drinks',
      color: '#F97316',
      href:  '/(tabs)/journal/food',
    },
    {
      key:   'entertainment',
      emoji: '🎭',
      label: 'Entertainment',
      sub:   'Shows & events',
      color: '#8B5CF6',
      href:  '/(tabs)/journal/entertainment',
    },
    {
      key:   'notes',
      emoji: '📝',
      label: 'Notes',
      sub:   'General notes',
      color: '#F59E0B',
      href:  '/(tabs)/journal/notes',
    },
    {
      key:   'itinerary',
      emoji: '🗺️',
      label: 'Itinerary',
      sub:   'Port schedule',
      color: '#10B981',
      href:  '/(tabs)/journal/daily',
    },
  ]

  if (!loaded) {
    return (
      <View style={[s.fill, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[s.fill, { backgroundColor: t.primaryDk }]} edges={['top']}>
        <ScrollView
          style={{ backgroundColor: t.bg }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Voyage Hero ───────────────────────────────────────────────── */}
          <View style={[s.hero, { backgroundColor: t.primaryDk }]}>

            {voyage ? (
              <>
                {!!voyage.cruiseLine && (
                  <Text style={[s.heroLine, { color: t.accent }]}>
                    {voyage.cruiseLine.toUpperCase()}
                  </Text>
                )}

                <Text style={[s.heroShip, { color: '#FFFFFF' }]}>
                  {voyage.shipName || 'Your Voyage'}
                </Text>

                <Text style={[s.heroRoute, { color: 'rgba(255,255,255,0.75)' }]}>
                  {[voyage.departurePort, fmtDate(voyage.departureDate), fmtDate(voyage.returnDate)]
                    .filter(Boolean).join('  ·  ')}
                </Text>

                {companions.length > 0 && (
                  <View style={s.pillRow}>
                    {companions.map((name) => (
                      <View key={name} style={s.pill}>
                        <Text style={s.pillText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {totalNights > 0 && (
                  <View style={s.progressWrap}>
                    <View style={s.progressLabels}>
                      <Text style={[s.progressDay, { color: t.accent }]}>
                        {currentDay != null ? `Day ${currentDay} of ${totalNights}` : `${totalNights} nights`}
                      </Text>
                      {daysLeft != null && (
                        <Text style={[s.progressRight, { color: 'rgba(255,255,255,0.55)' }]}>
                          {daysLeft === 0 ? 'Voyage complete' : `${daysLeft} days left`}
                        </Text>
                      )}
                    </View>
                    <View style={[s.progressTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <View style={[s.progressFill, { backgroundColor: t.accent, width: `${Math.round(pct * 100)}%` }]} />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={s.noVoyage}>
                <Text style={s.heroShip}>No voyage yet</Text>
                <Text style={[s.heroRoute, { color: 'rgba(255,255,255,0.6)' }]}>
                  Create a voyage in the web app to get started.
                </Text>
              </View>
            )}
          </View>

          {/* Wave transition */}
          <View style={[s.wave, { backgroundColor: t.primaryDk }]}>
            <View style={[s.waveInner, { backgroundColor: t.bg }]} />
          </View>

          {/* ── Stats strip ───────────────────────────────────────────────── */}
          {voyage && totalNights > 0 && (
            <View style={[s.statsRow, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: t.primary }]}>{daysLogged}</Text>
                <Text style={[s.statLbl, { color: t.muted }]}>Days written</Text>
              </View>
              <View style={[s.statDiv, { backgroundColor: t.border }]} />
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: t.primary }]}>{totalNights}</Text>
                <Text style={[s.statLbl, { color: t.muted }]}>Nights at sea</Text>
              </View>
              <View style={[s.statDiv, { backgroundColor: t.border }]} />
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: t.primary }]}>{Math.round(pct * 100)}%</Text>
                <Text style={[s.statLbl, { color: t.muted }]}>Complete</Text>
              </View>
            </View>
          )}

          {/* ── Section grid ──────────────────────────────────────────────── */}
          <View style={s.grid}>
            {sections.map((sec) => (
              <Pressable
                key={sec.key}
                onPress={() => router.push(sec.href as never)}
                style={({ pressed }) => [
                  s.card,
                  { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <View style={[s.cardIcon, { backgroundColor: sec.color + '1A' }]}>
                  <Text style={s.cardEmoji}>{sec.emoji}</Text>
                </View>
                <Text style={[s.cardLabel, { color: t.text }]}>{sec.label}</Text>
                <Text style={[s.cardSub, { color: t.muted }]} numberOfLines={2}>{sec.sub}</Text>
                <Text style={[s.cardChev, { color: t.muted }]}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill:   { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero:          { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 0 },
  heroLine:      { fontSize: 10, fontFamily: F_BOLD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  heroShip:      { fontSize: 32, fontFamily: F_DISPLAY, color: '#FFFFFF', marginBottom: 6 },
  heroRoute:     { fontSize: 13, fontFamily: F_BODY, lineHeight: 18 },
  noVoyage:      { paddingBottom: 24 },
  pillRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pill:          { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:      { color: '#FFFFFF', fontSize: 12, fontFamily: F_SEMI },
  progressWrap:  { marginTop: 16, marginBottom: 4 },
  progressLabels:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressDay:   { fontSize: 13, fontFamily: F_BOLD },
  progressRight: { fontSize: 12, fontFamily: F_BODY },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  // Wave
  wave:      { height: 28, overflow: 'hidden' },
  waveInner: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // Stats
  statsRow:  { flexDirection: 'row', marginHorizontal: 16, marginTop: -2, borderRadius: 18, borderWidth: 1, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  statItem:  { flex: 1, alignItems: 'center', gap: 2 },
  statVal:   { fontSize: 20, fontFamily: F_BOLD },
  statLbl:   { fontSize: 11, fontFamily: F_SEMI, textTransform: 'uppercase', letterSpacing: 0.4 },
  statDiv:   { width: 1, marginVertical: 4 },

  // Section grid — 2 columns
  grid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginTop: 6 },
  card:      { width: '47.5%', borderRadius: 18, borderWidth: 1, padding: 16, gap: 6, minHeight: 130 },
  cardIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardEmoji: { fontSize: 22 },
  cardLabel: { fontSize: 15, fontFamily: F_DISPLAY },
  cardSub:   { fontSize: 12, fontFamily: F_BODY, lineHeight: 16, flex: 1 },
  cardChev:  { fontSize: 18, alignSelf: 'flex-end' },
})
