import { Stack } from 'expo-router'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BODY } from '../../../src/lib/fonts'

export default function JournalLayout() {
  const t = activeTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: t.primaryDk },
        headerTintColor:  '#FFFFFF',
        headerTitleStyle: { color: '#FFFFFF', fontFamily: F_DISPLAY, fontSize: 20 },
        headerBackTitle:  'Back',
      }}
    >
      <Stack.Screen name="index"             options={{ headerShown: false }} />
      <Stack.Screen name="daily/index"       options={{ title: 'Daily Log' }} />
      <Stack.Screen name="daily/[day]"       options={{ title: 'Day Entry' }} />
      <Stack.Screen name="highlights"        options={{ title: 'Highlights' }} />
      <Stack.Screen name="food"              options={{ title: 'Food Log' }} />
      <Stack.Screen name="entertainment"     options={{ title: 'Entertainment' }} />
      <Stack.Screen name="notes"             options={{ title: 'Notes' }} />
    </Stack>
  )
}
