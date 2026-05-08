import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../src/lib/auth'
import { useVoyage } from '../../../src/hooks/useVoyage'
import { supabase } from '../../../src/lib/supabase'
import { fromDbHighlights, toDbHighlights } from '../../../src/lib/converters'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BODY, F_BOLD } from '../../../src/lib/fonts'
import Field from '../../../src/components/Field'
import type { Highlights } from '../../../src/types'

const EMPTY: Highlights = {
  port: '', meal: '', funny: '', view: '', friends: '', firstTime: '', moment: '',
}

const FIELDS: { key: keyof Highlights; label: string; placeholder: string }[] = [
  { key: 'port',      label: 'Favourite Port',                  placeholder: 'Which port stood out?' },
  { key: 'meal',      label: 'Most Memorable Meal',             placeholder: 'What did you eat?' },
  { key: 'funny',     label: 'Funniest Moment',                 placeholder: 'What made you laugh?' },
  { key: 'view',      label: 'Best View',                       placeholder: 'What took your breath away?' },
  { key: 'friends',   label: 'Best Moment with Friends',        placeholder: 'Who were you with?' },
  { key: 'firstTime', label: 'First Time Experience',           placeholder: 'Something you did for the first time' },
  { key: 'moment',    label: 'Single Unforgettable Moment',     placeholder: 'If you could only remember one thing…' },
]

export default function HighlightsScreen() {
  const t = activeTheme()
  const { userId } = useAuth()
  const { voyageId, loaded: voyageLoaded } = useVoyage({ userId })

  const [highlights, setHighlights] = useState<Highlights>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Partial<Highlights>>({})

  useEffect(() => {
    if (!voyageId) return
    let cancelled = false
    supabase.from('highlights').select('*').eq('voyage_id', voyageId).single()
      .then(({ data }) => {
        if (cancelled) return
        setHighlights(data ? { ...EMPTY, ...fromDbHighlights(data) } : EMPTY)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [voyageId])

  const flush = useCallback(async () => {
    if (!voyageId || !Object.keys(pending.current).length) return
    const patch = { ...pending.current }
    pending.current = {}
    const full = { ...highlights, ...patch }
    await supabase.from('highlights').upsert(toDbHighlights(voyageId, full), { onConflict: 'voyage_id' })
  }, [voyageId, highlights])

  const set = (key: keyof Highlights, val: string) => {
    setHighlights(prev => ({ ...prev, [key]: val }))
    pending.current = { ...pending.current, [key]: val }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 800)
  }

  if (!voyageLoaded || !loaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <View style={s.center}><ActivityIndicator color={t.primary} /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.intro}>
            <Text style={[s.introTitle, { color: t.text }]}>Your best moments</Text>
            <Text style={[s.introSub, { color: t.muted }]}>
              Capture the highlights that made this voyage unforgettable. Saves automatically.
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            {FIELDS.map((f, i) => (
              <View key={f.key} style={[s.fieldWrap, i > 0 && s.fieldDivider, i > 0 && { borderTopColor: t.border }]}>
                <Field
                  label={f.label}
                  placeholder={f.placeholder}
                  value={highlights[f.key]}
                  onChangeText={v => set(f.key, v)}
                  multiline
                />
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1 },
  flex1:       { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: 16, gap: 16 },
  intro:       { gap: 6 },
  introTitle:  { fontSize: 24, fontFamily: F_DISPLAY },
  introSub:    { fontSize: 13, fontFamily: F_BODY, lineHeight: 18 },
  card:        { borderRadius: 18, borderWidth: 1, padding: 20, gap: 0 },
  fieldWrap:   { paddingVertical: 4 },
  fieldDivider:{ borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, marginTop: 12 },
})
