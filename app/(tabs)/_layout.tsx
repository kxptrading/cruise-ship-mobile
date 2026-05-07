import { Tabs } from 'expo-router'
import { Platform, Text } from 'react-native'
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
        // Header — dark primary background with white title, mirrors web top nav
        headerStyle:      { backgroundColor: t.primaryDk },
        headerTitleStyle: {
          color:      '#FFFFFF',
          fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
          fontSize:   20,
        },
        headerTintColor: '#FFFFFF',

        // Tab bar — dark primary background, gold active, soft white inactive
        tabBarActiveTintColor:   t.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: {
          backgroundColor: t.primaryDk,
          borderTopColor:  t.primaryMid,
          borderTopWidth:  1,
        },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Feed', tabBarIcon: tabIcon('🌊') }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title:        'Journal',
          headerShown:  false,
          tabBarIcon:   tabIcon('📔'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('👤') }}
      />
    </Tabs>
  )
}
