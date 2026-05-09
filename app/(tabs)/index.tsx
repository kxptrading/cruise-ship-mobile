import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useFeed } from '../../src/hooks/useFeed'
import PostCard from '../../src/components/PostCard'
import { activeTheme } from '../../src/lib/theme'
import { F_DISPLAY, F_SEMI, F_BODY } from '../../src/lib/fonts'
import { FluentEmoji } from '../../src/components/FluentEmoji'

const LOGO = require('../../assets/logo.png')
// Logo is 960×470 → aspect 2.04:1
const LOGO_H = 48
const LOGO_W  = Math.round(LOGO_H * (960 / 470))   // ≈ 98px

// ── App banner ────────────────────────────────────────────────────────────────

function AppBanner() {
  const t = activeTheme()
  return (
    <View style={[b.wrap, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      <Image source={LOGO} style={b.logo} resizeMode="contain" />
      <Text style={[b.appName, { color: t.primaryDk }]}>Cruise Log</Text>
    </View>
  )
}

const b = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  logo:    { width: LOGO_W, height: LOGO_H },
  appName: { fontSize: 28, fontFamily: F_DISPLAY, lineHeight: 34 },
})

// ── Feed screen ───────────────────────────────────────────────────────────────

export default function Feed() {
  const t      = activeTheme()
  const router = useRouter()
  const { items, loading, refresh } = useFeed()

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={[s.safe, { backgroundColor: t.surface }]} edges={['top']}>
        <AppBanner />
      </SafeAreaView>

      <View style={[s.body, { backgroundColor: t.bg }]}>
        <FlatList
          contentContainerStyle={[s.list, items.length === 0 && s.listEmpty]}
          data={items}
          keyExtractor={(it) => `${it.voyageId}-${it.dayNumber}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              colors={[t.primary]}
              onRefresh={refresh}
              refreshing={loading && items.length > 0}
              tintColor={t.primary}
            />
          }
          ListHeaderComponent={
            items.length > 0 ? (
              <View style={s.feedHeader}>
                <Text style={[s.feedCount, { color: t.muted }]}>
                  {items.length} update{items.length !== 1 ? 's' : ''} from fellow travellers
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(`/(tabs)/journal/daily/${item.dayNumber}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            loading ? (
              <View style={s.empty}>
                <ActivityIndicator color={t.primary} size="large" />
              </View>
            ) : (
              <View style={s.empty}>
                <FluentEmoji name="water_wave" size={80} />
                <Text style={[s.emptyTitle, { color: t.text }]}>Calm seas</Text>
                <Text style={[s.emptySub, { color: t.muted }]}>
                  No public logs yet. Open a daily entry and toggle{'\n'}"Share to feed" to appear here.
                </Text>
              </View>
            )
          }
        />
      </View>
    </>
  )
}

const s = StyleSheet.create({
  safe:       { backgroundColor: 'transparent' },
  body:       { flex: 1 },
  list:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  listEmpty:  { flexGrow: 1 },
  feedHeader: { marginBottom: 12 },
  feedCount:  { fontSize: 13, fontFamily: F_SEMI },
  separator:  { height: 14 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  emptyTitle: { fontSize: 28, fontFamily: F_DISPLAY },
  emptySub:   { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 22 },
})
