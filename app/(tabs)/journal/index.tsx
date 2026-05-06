// ─────────────────────────────────────────────────────────────────────────────
// app/(tabs)/journal/index.tsx — Day picker (the journal hub)
//
// For the vertical slice this is a simple list of days 1–N. Tap a day to
// open the Daily Log editor for that day. Other journal sections (Food,
// Budget, Packing…) will mount here later as additional sections.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../src/lib/auth'
import { useVoyage } from '../../../src/hooks/useVoyage'
import { activeTheme } from '../../../src/lib/theme'
import type { DailyLog } from '../../../src/types'

interface DayItem {
  day:    number
  date:   string
  port:   string
  filled: boolean
}

function dayItems(voyageNights: number, logs: DailyLog[]): DayItem[] {
  const total = Math.max(1, voyageNights || logs.length || 7)
  return Array.from({ length: total }, (_, i) => {
    const log = logs[i]
    return {
      day:    i + 1,
      date:   log?.date ?? '',
      port:   log?.port ?? '',
      filled: Boolean(log?.highlights || log?.bestMoment),
    }
  })
}

export default function JournalIndex() {
  const t = activeTheme()
  const router = useRouter()
  const { userId } = useAuth()
  const { voyage, dailyLogs, loaded } = useVoyage({ userId })

  const totalNights = Number(voyage?.totalNights) || 0
  const items = useMemo(() => dayItems(totalNights, dailyLogs), [totalNights, dailyLogs])

  if (!loaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <View style={s.center}>
          <ActivityIndicator color={t.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!voyage) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <View style={s.center}>
          <Text style={[s.empty, { color: t.muted }]}>
            No voyage yet. Create one in the web app to get started.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <FlatList
        contentContainerStyle={s.listContent}
        data={items}
        keyExtractor={(item) => String(item.day)}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={[s.shipName, { color: t.text }]}>{voyage.shipName || 'Your voyage'}</Text>
            <Text style={[s.shipLine, { color: t.muted }]}>
              {voyage.cruiseLine || ''}
              {voyage.totalNights ? ` · ${voyage.totalNights} nights` : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/journal/daily/${item.day}`)}
            style={({ pressed }) => [
              s.row,
              { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[s.dayBadge, { backgroundColor: item.filled ? t.primary : t.light, borderColor: t.border }]}>
              <Text style={[s.dayBadgeText, { color: item.filled ? '#FFF' : t.muted }]}>
                {item.day}
              </Text>
            </View>
            <View style={s.rowText}>
              <Text style={[s.rowTitle, { color: t.text }]}>
                Day {item.day}{item.port ? ` · ${item.port}` : ''}
              </Text>
              <Text style={[s.rowSub, { color: t.muted }]}>
                {item.filled ? 'Logged' : 'Tap to add details'}
              </Text>
            </View>
            <Text style={[s.chev, { color: t.muted }]}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty:        { fontSize: 14, textAlign: 'center' },
  listContent:  { padding: 16, gap: 12 },
  header:       { paddingHorizontal: 4, paddingBottom: 8 },
  shipName:     { fontSize: 22, fontFamily: 'Georgia' },
  shipLine:     { fontSize: 13, marginTop: 2 },
  row:          { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 14 },
  dayBadge:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dayBadgeText: { fontWeight: '700' },
  rowText:      { flex: 1 },
  rowTitle:     { fontSize: 15, fontWeight: '600' },
  rowSub:       { fontSize: 12, marginTop: 2 },
  chev:         { fontSize: 22 },
})
