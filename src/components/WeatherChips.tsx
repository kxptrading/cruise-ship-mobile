// ─────────────────────────────────────────────────────────────────────────────
// components/WeatherChips.tsx — Multi-select weather chips for the daily log
// ─────────────────────────────────────────────────────────────────────────────

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WX_EMOJI, WX_STYLE } from '../constants'

interface Props {
  value:    string[]
  onChange: (next: string[]) => void
}

const ALL = Object.keys(WX_EMOJI)

export default function WeatherChips({ value, onChange }: Props) {
  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter(v => v !== name) : [...value, name])
  }

  return (
    <View style={s.row}>
      {ALL.map((name) => {
        const on    = value.includes(name)
        const style = WX_STYLE[name]
        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            key={name}
            onPress={() => toggle(name)}
            style={[
              s.chip,
              { backgroundColor: on ? style.background : '#FFFFFF', borderColor: on ? style.border : '#E0DBD0' },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{WX_EMOJI[name]}</Text>
            <Text style={[s.label, { color: on ? style.color : '#7A8594' }]}>{name}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '600' },
})
