import { Pressable, StyleSheet, View } from 'react-native'
import { FluentEmoji } from './FluentEmoji'

interface Props {
  value:    number
  onChange: (n: number) => void
  size?:    number
}

export default function StarRating({ value, onChange, size = 32 }: Props) {
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
          <FluentEmoji
            name="star"
            size={size}
            opacity={n <= value ? 1 : 0.2}
            style={{ marginRight: 2 }}
          />
        </Pressable>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
})
