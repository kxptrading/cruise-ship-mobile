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
import { useAuth } from '../../../../src/lib/auth'
import { useVoyage } from '../../../../src/hooks/useVoyage'
import { activeTheme } from '../../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../../src/lib/fonts'
import type { DailyLog } from '../../../../src/types'

interface DayItem { day: number; date: string; port: string; filled: boolean }

function buildDays(nights: number, logs: DailyLog[]): DayItem[] {
  const total = Math.max(1, nights || logs.length || 7)
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

export default function DailyIndex() {
  const t      = activeTheme()
  const router = useRouter()
  const { userId } = useAuth()
  const { voyage, dailyLogs, loaded } = useVoyage({ userId })

  const totalNights = parseInt(voyage?.totalNights ?? '0') || 0
  const items = useMemo(() => buildDays(totalNights, dailyLogs), [totalNights, dailyLogs])
  const written = items.filter(i => i.filled).length

  if (!loaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <View style={s.center}><ActivityIndicator color={t.primary} /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <FlatList
        contentContainerStyle={s.list}
        data={items}
        keyExtractor={i => String(i.day)}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={[s.subtitle, { color: t.muted }]}>
              {written} of {items.length} days written
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
            <View style={[
              s.badge,
              { backgroundColor: item.filled ? t.primary : t.light, borderColor: item.filled ? t.primary : t.border },
            ]}>
              <Text style={[s.badgeNum, { color: item.filled ? '#FFF' : t.muted }]}>
                {item.day}
              </Text>
            </View>

            <View style={s.rowBody}>
              <Text style={[s.rowTitle, { color: t.text }]}>
                Day {item.day}{item.port ? ` · ${item.port}` : ''}
              </Text>
              <Text style={[s.rowSub, { color: item.filled ? t.primary : t.muted }]}>
                {item.filled ? '✓ Written' : item.date ? item.date : 'Tap to write'}
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
  safe:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:       { padding: 16, gap: 10, flexGrow: 1 },
  listHeader: { marginBottom: 4 },
  subtitle:   { fontSize: 13, fontFamily: F_BODY },
  row:        { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 14 },
  badge:      { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badgeNum:   { fontFamily: F_BOLD, fontSize: 16 },
  rowBody:    { flex: 1 },
  rowTitle:   { fontSize: 15, fontFamily: F_SEMI },
  rowSub:     { fontSize: 12, fontFamily: F_BODY, marginTop: 2 },
  chev:       { fontSize: 22 },
})
