// ─────────────────────────────────────────────────────────────────────────────
// app/_layout.tsx — Root layout
//
// Sets up auth context, decides whether the user sees the (auth) flow or the
// (tabs) flow, and configures the gesture handler / safe-area providers
// every Expo Router app needs.
// ─────────────────────────────────────────────────────────────────────────────

import 'react-native-gesture-handler'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from '../src/lib/auth'
import { activeTheme } from '../src/lib/theme'

function AuthGate() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router   = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments, router])

  if (loading) {
    const t = activeTheme()
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
