// ─────────────────────────────────────────────────────────────────────────────
// components/Field.tsx — Labelled TextInput wrapper used throughout forms
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import { activeTheme } from '../lib/theme'

interface Props extends Omit<TextInputProps, 'style'> {
  label:      string
  multiline?: boolean
}

export default function Field({ label, multiline, ...textInputProps }: Props) {
  const t = activeTheme()
  return (
    <View style={s.wrap}>
      <Text style={[s.label, { color: t.muted }]}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor={t.muted}
        style={[
          s.input,
          { borderColor: t.border, color: t.text, backgroundColor: t.surface },
          multiline && s.multiline,
        ]}
        {...textInputProps}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap:      { gap: 6 },
  label:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input:     { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
})
