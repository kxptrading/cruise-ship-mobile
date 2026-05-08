import { Tabs } from 'expo-router'
import { Image } from 'react-native'
import { activeTheme } from '../../src/lib/theme'
import { F_DISPLAY, F_SEMI } from '../../src/lib/fonts'
import { EMOJI } from '../../src/components/FluentEmoji'

function tabIcon(asset: ReturnType<typeof require>) {
  return ({ focused }: { color: string; focused: boolean }) => (
    <Image
      source={asset}
      style={{ width: 27, height: 27, opacity: focused ? 1 : 0.55 }}
      resizeMode="contain"
    />
  )
}

export default function TabsLayout() {
  const t = activeTheme()
  return (
    <Tabs
      screenOptions={{
        headerStyle:      { backgroundColor: t.primaryDk },
        headerTitleStyle: { color: '#FFFFFF', fontFamily: F_DISPLAY, fontSize: 20 },
        headerTintColor:  '#FFFFFF',
        tabBarActiveTintColor:   t.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: {
          backgroundColor: t.primaryDk,
          borderTopColor:  t.primaryMid,
          borderTopWidth:  1,
        },
        tabBarLabelStyle: { fontFamily: F_SEMI, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Feed', tabBarIcon: tabIcon(EMOJI.water_wave) }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title:       'Journal',
          headerShown: false,
          tabBarIcon:  tabIcon(EMOJI.spiral_notepad),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false, tabBarIcon: tabIcon(EMOJI.bust_in_silhouette) }}
      />
    </Tabs>
  )
}
