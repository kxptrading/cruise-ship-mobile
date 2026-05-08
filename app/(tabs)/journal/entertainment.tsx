import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BODY } from '../../../src/lib/fonts'

export default function Entertainment() {
  const t = activeTheme()
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <View style={s.center}>
        <Text style={s.emoji}>🎭</Text>
        <Text style={[s.title, { color: t.text }]}>Entertainment</Text>
        <Text style={[s.sub, { color: t.muted }]}>
          Log the shows, performances, and evening events you enjoyed on board. Coming in the next update.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emoji:  { fontSize: 52 },
  title:  { fontSize: 28, fontFamily: F_DISPLAY, textAlign: 'center' },
  sub:    { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 20 },
})
