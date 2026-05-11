import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="chat"    />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
