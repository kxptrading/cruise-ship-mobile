// ─────────────────────────────────────────────────────────────────────────────
// app/(tabs)/profile.tsx — Profile placeholder
//
// Stub for the vertical slice. Full profile (avatar, voyages, friends, etc.)
// will port over after Feed + Daily Log are running.
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/lib/auth'
import { activeTheme } from '../../src/lib/theme'

export default function Profile() {
  const t = activeTheme()
  const { session, signOut } = useAuth()

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <View style={s.container}>
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.label, { color: t.muted }]}>Signed in as</Text>
          <Text style={[s.email, { color: t.text }]}>
            {session?.user?.email ?? '—'}
          </Text>
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [
            s.button,
            { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={s.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  container:  { flex: 1, padding: 20, gap: 16 },
  card:       { borderRadius: 22, borderWidth: 1, padding: 22 },
  label:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  email:      { fontSize: 16, fontWeight: '500' },
  button:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
})
