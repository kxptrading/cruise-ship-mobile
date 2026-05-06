// ─────────────────────────────────────────────────────────────────────────────
// components/StarRating.tsx — 0–5 tap-to-set star rating
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { activeTheme } from '../lib/theme'

interface Props {
  value:    number
  onChange: (n: number) => void
  size?:    number
}

export default function StarRating({ value, onChange, size = 28 }: Props) {
  const t = activeTheme()
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          accessibilityLabel={`Rate ${n} of 5`}
          accessibilityRole="button"
          hitSlop={6}
          key={n}
          onPress={() => onChange(n === value ? 0 : n)}
        >
          <Text style={{ fontSize: size, color: n <= value ? t.accent : t.border, marginRight: 2 }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
})
