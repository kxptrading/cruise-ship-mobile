import { Stack } from 'expo-router'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY } from '../../../src/lib/fonts'

export default function ChatLayout() {
  const t = activeTheme()
  return (
    <Stack screenOptions={{
      headerStyle:      { backgroundColor: t.primaryDk },
      headerTintColor:  '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontFamily: F_DISPLAY, fontSize: 20 },
      headerBackTitle:  'Back',
    }}>
      <Stack.Screen name="index"  options={{ headerShown: false }} />
      <Stack.Screen name="[id]"   options={{ title: 'Message' }} />
    </Stack>
  )
}
