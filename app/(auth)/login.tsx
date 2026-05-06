// ─────────────────────────────────────────────────────────────────────────────
// app/(auth)/login.tsx — Email + password sign in / sign up screen
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/lib/auth'
import { activeTheme } from '../../src/lib/theme'

type Mode = 'signin' | 'signup'

export default function Login() {
  const t = activeTheme()
  const { signIn, signUp } = useAuth()

  const [mode,     setMode]     = useState<Mode>('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.brand}>
            <Text style={[s.brandTitle, { color: t.primary }]}>Cruise Ship Journal</Text>
            <Text style={[s.brandSubtitle, { color: t.muted }]}>
              {mode === 'signin' ? 'Welcome back aboard.' : 'Set sail with a new log.'}
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.label, { color: t.muted }]}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={t.muted}
              style={[s.input, { borderColor: t.border, color: t.text }]}
              value={email}
            />

            <Text style={[s.label, { color: t.muted, marginTop: 16 }]}>Password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={t.muted}
              secureTextEntry
              style={[s.input, { borderColor: t.border, color: t.text }]}
              value={password}
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={busy || !email || !password}
              onPress={submit}
              style={({ pressed }) => [
                s.button,
                { backgroundColor: t.primary, opacity: busy || !email || !password ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={s.buttonText}>
                {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              style={s.switchMode}
            >
              <Text style={[s.switchText, { color: t.primary }]}>
                {mode === 'signin'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1 },
  flex1:         { flex: 1 },
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 },
  brand:         { alignItems: 'center', gap: 6 },
  brandTitle:    { fontSize: 28, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }) },
  brandSubtitle: { fontSize: 14 },
  card:          { borderRadius: 22, borderWidth: 1, padding: 24, gap: 4 },
  label:         { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:         { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  error:         { color: '#B91C1C', marginTop: 12, fontSize: 13 },
  button:        { borderRadius: 12, paddingVertical: 14, marginTop: 24, alignItems: 'center' },
  buttonText:    { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  switchMode:    { marginTop: 16, alignItems: 'center' },
  switchText:    { fontSize: 13, fontWeight: '600' },
})
