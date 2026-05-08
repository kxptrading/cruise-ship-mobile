import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WX_STYLE } from '../constants'
import { activeTheme } from '../lib/theme'
import { F_SEMI } from '../lib/fonts'
import { FluentEmoji } from './FluentEmoji'
import type { EmojiKey } from './FluentEmoji'

interface Props {
  value:    string[]
  onChange: (next: string[]) => void
}

const WX_OPTIONS: { name: string; emojiKey: EmojiKey }[] = [
  { name: 'Sunny',  emojiKey: 'sun' },
  { name: 'Cloudy', emojiKey: 'cloud' },
  { name: 'Rainy',  emojiKey: 'cloud_with_rain' },
  { name: 'Windy',  emojiKey: 'wind_face' },
  { name: 'Hot',    emojiKey: 'fire' },
  { name: 'Mild',   emojiKey: 'sun_behind_small_cloud' },
  { name: 'Cool',   emojiKey: 'snowflake' },
]

export default function WeatherChips({ value, onChange }: Props) {
  const t = activeTheme()
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter(v => v !== name) : [...value, name])

  return (
    <View style={s.row}>
      {WX_OPTIONS.map(({ name, emojiKey }) => {
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
              { backgroundColor: on ? style.background : t.surface, borderColor: on ? style.border : t.border },
            ]}
          >
            <FluentEmoji name={emojiKey} size={18} />
            <Text style={[s.label, { color: on ? style.color : t.muted }]}>{name}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  label: { fontSize: 12, fontFamily: F_SEMI },
})
