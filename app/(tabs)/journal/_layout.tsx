// ─────────────────────────────────────────────────────────────────────────────
// app/(tabs)/journal/_layout.tsx — Stack inside the Journal tab
// ─────────────────────────────────────────────────────────────────────────────

import { Stack } from 'expo-router'
import { activeTheme } from '../../../src/lib/theme'

export default function JournalLayout() {
  const t = activeTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: t.surface },
        headerTintColor:  t.primary,
        headerTitleStyle: { color: t.text, fontFamily: 'Georgia', fontSize: 18 },
      }}
    >
      <Stack.Screen name="index"      options={{ title: 'Journal' }} />
      <Stack.Screen name="daily/[day]" options={{ title: 'Daily Log' }} />
    </Stack>
  )
}
