import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFeed } from '../../src/hooks/useFeed'
import PostCard from '../../src/components/PostCard'
import { activeTheme } from '../../src/lib/theme'
import { F_DISPLAY, F_BODY } from '../../src/lib/fonts'
import { FluentEmoji } from '../../src/components/FluentEmoji'

export default function Feed() {
  const t = activeTheme()
  const router = useRouter()
  const { items, loading, refresh } = useFeed()

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <FlatList
        contentContainerStyle={s.listContent}
        data={items}
        keyExtractor={(it) => `${it.voyageId}-${it.dayNumber}`}
        refreshControl={
          <RefreshControl
            colors={[t.primary]}
            onRefresh={refresh}
            refreshing={loading && items.length > 0}
            tintColor={t.primary}
          />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/(tabs)/journal/daily/${item.dayNumber}`)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={s.empty}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : (
            <View style={s.empty}>
              <FluentEmoji name="water_wave" size={72} />
              <Text style={[s.emptyTitle, { color: t.text }]}>Calm seas</Text>
              <Text style={[s.emptySub, { color: t.muted }]}>
                No public logs yet. Toggle a daily log to public to see it here.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1 },
  listContent: { padding: 16, gap: 14, flexGrow: 1 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyTitle:  { fontSize: 22, fontFamily: F_DISPLAY },
  emptySub:    { fontSize: 13, fontFamily: F_BODY, textAlign: 'center' },
})
