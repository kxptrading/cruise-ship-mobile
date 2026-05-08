import 'react-native-gesture-handler'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { useFonts } from 'expo-font'
import { AuthProvider, useAuth } from '../src/lib/auth'
import { ThemeProvider, activeTheme } from '../src/lib/theme'

function AuthGate() {
  const t = activeTheme()
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
  const [fontsLoaded] = useFonts({
    'FredokaOne-Regular': require('@expo-google-fonts/fredoka-one/FredokaOne_400Regular.ttf'),
    'Nunito-Regular':     require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
    'Nunito-SemiBold':    require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
    'Nunito-Bold':        require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0369A1', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
