// ─────────────────────────────────────────────────────────────────────────────
// app/(tabs)/_layout.tsx — Bottom tab navigation
//
// Three tabs: Feed, Journal (daily log hub), Profile. Other journal sections
// will live inside the Journal stack as they're ported.
// ─────────────────────────────────────────────────────────────────────────────

import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { activeTheme } from '../../src/lib/theme'

function tabIcon(emoji: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 22, color }}>{emoji}</Text>
  )
}

export default function TabsLayout() {
  const t = activeTheme()
  return (
    <Tabs
      screenOptions={{
        headerStyle:        { backgroundColor: t.surface },
        headerTitleStyle:   { color: t.text, fontFamily: 'Georgia', fontSize: 20 },
        tabBarActiveTintColor:   t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor:  t.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: tabIcon('🌊'),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          headerShown: false, // journal stack manages its own headers
          tabBarIcon: tabIcon('📔'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('👤'),
        }}
      />
    </Tabs>
  )
}
