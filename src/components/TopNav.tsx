import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, usePathname } from 'expo-router'
import { activeTheme } from '../lib/theme'
import { F_DISPLAY, F_BOLD } from '../lib/fonts'
import { FluentEmoji } from './FluentEmoji'
import type { EmojiKey } from './FluentEmoji'

const LOGO = require('../../assets/logo.png')
// 960×470 → at height 38 → width 77
const LOGO_H = 38
const LOGO_W  = Math.round(LOGO_H * (960 / 470))

const NAV_ITEMS: { emoji: EmojiKey; label: string; href: string; match: string }[] = [
  { emoji: 'water_wave',        label: 'Feed',    href: '/(tabs)/',        match: '/'        },
  { emoji: 'spiral_notepad',    label: 'Journal', href: '/(tabs)/journal', match: '/journal' },
  { emoji: 'speech_balloon',    label: 'Chat',    href: '/(tabs)/chat',    match: '/chat'    },
  { emoji: 'bust_in_silhouette',label: 'Profile', href: '/(tabs)/profile', match: '/profile' },
]

function NavBtn({
  emoji, label, active, onPress,
}: { emoji: EmojiKey; label: string; active: boolean; onPress: () => void }) {
  const t = activeTheme()
  return (
    <Pressable onPress={onPress} style={s.navBtn} hitSlop={10} accessibilityLabel={label} accessibilityRole="button">
      <FluentEmoji name={emoji} size={26} opacity={active ? 1 : 0.38} />
      {active && <View style={[s.activeDot, { backgroundColor: t.primary }]} />}
    </Pressable>
  )
}

export function TopNav() {
  const t        = activeTheme()
  const router   = useRouter()
  const pathname = usePathname()

  const isActive = (match: string) => {
    if (match === '/') return pathname === '/' || pathname === ''
    return pathname.startsWith(match)
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.surface, borderBottomColor: t.border }]} edges={['top']}>
      <View style={s.bar}>
        {/* Brand */}
        <View style={s.brand}>
          <Image source={LOGO} style={{ width: LOGO_W, height: LOGO_H }} resizeMode="contain" />
          <Text style={[s.appName, { color: t.primaryDk }]}>Cruise Log</Text>
        </View>

        {/* Nav icons */}
        <View style={s.navRow}>
          {NAV_ITEMS.map(item => (
            <NavBtn
              key={item.match}
              emoji={item.emoji}
              label={item.label}
              active={isActive(item.match)}
              onPress={() => router.push(item.href as never)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { borderBottomWidth: StyleSheet.hairlineWidth },
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName:   { fontSize: 22, fontFamily: F_DISPLAY, lineHeight: 26 },
  navRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn:    { alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4 },
  activeDot: { width: 4, height: 4, borderRadius: 2 },
})
