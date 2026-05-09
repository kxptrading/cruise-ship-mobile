import {
  ActivityIndicator,
  FlatList,
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
import { TopNav } from '../../src/components/TopNav'
import { activeTheme } from '../../src/lib/theme'
import { F_DISPLAY, F_SEMI, F_BODY } from '../../src/lib/fonts'
import { FluentEmoji } from '../../src/components/FluentEmoji'

export default function Feed() {
  const t      = activeTheme()
  const router = useRouter()
  const { items, loading, refresh } = useFeed()

  return (
    <>
      <StatusBar style="dark" />
      <TopNav />

      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
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
      </SafeAreaView>
    </>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  list:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  listEmpty:  { flexGrow: 1 },
  feedHeader: { marginBottom: 12 },
  feedCount:  { fontSize: 13, fontFamily: F_SEMI },
  separator:  { height: 14 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  emptyTitle: { fontSize: 28, fontFamily: F_DISPLAY },
  emptySub:   { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 22 },
})
