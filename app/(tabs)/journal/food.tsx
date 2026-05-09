import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useAuth } from '../../../src/lib/auth'
import { useVoyage } from '../../../src/hooks/useVoyage'
import { useFoodLog } from '../../../src/hooks/useFoodLog'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'
import { FluentEmoji } from '../../../src/components/FluentEmoji'
import StarRating from '../../../src/components/StarRating'
import type { FoodLog } from '../../../src/types'

// ── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Tea', 'Dinner', 'Snack', 'Other']

const MEAL_COLORS: Record<string, string> = {
  Breakfast: '#FEF3C7', Lunch: '#D1FAE5', Tea: '#FEE2E2',
  Dinner: '#DBEAFE', Snack: '#F3E8FF', Other: '#F3F4F6',
}
const MEAL_TEXT: Record<string, string> = {
  Breakfast: '#92400E', Lunch: '#065F46', Tea: '#991B1B',
  Dinner: '#1E40AF', Snack: '#5B21B6', Other: '#374151',
}

// ── Chip selector ────────────────────────────────────────────────────────────

function ChipSelector({ options, value, onChange, colors, textColors }: {
  options: string[]; value: string; onChange: (v: string) => void
  colors?: Record<string, string>; textColors?: Record<string, string>
}) {
  const t = activeTheme()
  return (
    <View style={cs.chipRow}>
      {options.map(opt => {
        const active = opt === value
        const bg   = active ? (colors?.[opt] ?? t.primary + '20') : t.bg
        const color = active ? (textColors?.[opt] ?? t.primary)    : t.muted
        const border = active ? (colors?.[opt] ?? t.primary + '50') : t.border
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[cs.chip, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[cs.chipText, { color }]}>{opt}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Entry card (list view) ───────────────────────────────────────────────────

function EntryCard({ entry, onPress }: { entry: FoodLog; onPress: () => void }) {
  const t = activeTheme()
  const bg   = MEAL_COLORS[entry.meal] ?? '#F3F4F6'
  const col  = MEAL_TEXT[entry.meal]   ?? '#374151'
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [ec.card, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={ec.row}>
        <View style={[ec.mealBadge, { backgroundColor: bg }]}>
          <Text style={[ec.mealText, { color: col }]}>{entry.meal || 'Meal'}</Text>
        </View>
        {!!entry.date && <Text style={[ec.date, { color: t.muted }]}>{entry.date}</Text>}
        {entry.day ? <Text style={[ec.day, { color: t.muted }]}>Day {entry.day}</Text> : null}
      </View>

      {!!entry.venue && <Text style={[ec.venue, { color: t.text }]} numberOfLines={1}>{entry.venue}</Text>}
      {!!entry.what  && <Text style={[ec.what,  { color: t.muted }]} numberOfLines={2}>{entry.what}</Text>}

      <View style={ec.footer}>
        {entry.rating > 0 && (
          <View style={ec.stars}>
            {[1,2,3,4,5].map(n => (
              <Text key={n} style={{ color: n <= entry.rating ? '#F59E0B' : t.border, fontSize: 12 }}>★</Text>
            ))}
          </View>
        )}
        {!!entry.cost && <Text style={[ec.cost, { color: t.muted }]}>{entry.cost}</Text>}
        {entry.orderAgain === 'Yes' && <Text style={[ec.again, { color: '#10B981' }]}>↩ Order again</Text>}
      </View>
    </Pressable>
  )
}

// ── Full-screen editor modal ─────────────────────────────────────────────────

function FoodEditor({ entry, onClose, onChange, onDelete }: {
  entry: FoodLog | null
  onClose:  () => void
  onChange: (id: string, patch: Partial<FoodLog>) => void
  onDelete: (id: string) => Promise<void>
}) {
  const t      = activeTheme()
  const insets = useSafeAreaInsets()

  if (!entry) return null
  const set = (patch: Partial<FoodLog>) => onChange(entry.id, patch)

  const confirmDelete = () => Alert.alert('Delete entry', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await onDelete(entry.id); onClose() } },
  ])

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[fe.safe, { backgroundColor: t.bg }]}>
        <View style={[fe.header, { borderBottomColor: t.border }]}>
          <Pressable onPress={confirmDelete} hitSlop={8}><Text style={fe.del}>Delete</Text></Pressable>
          <Text style={[fe.title, { color: t.text }]}>{entry.meal || 'Meal'}</Text>
          <Pressable onPress={onClose} hitSlop={8}><Text style={[fe.done, { color: t.primary }]}>Done</Text></Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[fe.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">

            {/* Meal type */}
            <Text style={[fe.sectionLabel, { color: t.muted }]}>Meal type</Text>
            <ChipSelector options={MEAL_TYPES} value={entry.meal} onChange={v => set({ meal: v })} colors={MEAL_COLORS} textColors={MEAL_TEXT} />

            {/* When / where */}
            <Text style={[fe.sectionLabel, { color: t.muted }]}>When & where</Text>
            <View style={[fe.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <FRow label="Day" value={entry.day} onChange={v => set({ day: v })} placeholder="3" keyboardType="number-pad" />
              <FRow label="Date" value={entry.date} onChange={v => set({ date: v })} placeholder="YYYY-MM-DD" />
              <FRow label="Port / Location" value={entry.port} onChange={v => set({ port: v })} placeholder="Lisbon" last />
            </View>

            {/* The meal */}
            <Text style={[fe.sectionLabel, { color: t.muted }]}>The meal</Text>
            <View style={[fe.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <FRow label="Venue / Restaurant" value={entry.venue} onChange={v => set({ venue: v })} placeholder="The Horizon Buffet" />
              <FRow label="What I had" value={entry.what} onChange={v => set({ what: v })} placeholder="Grilled salmon, roasted veg…" multiline />
              <FRow label="Standout dish" value={entry.standout} onChange={v => set({ standout: v })} placeholder="The tiramisu" />
              <FRow label="Drinks" value={entry.drinks} onChange={v => set({ drinks: v })} placeholder="House wine, sparkling water" last />
            </View>

            {/* Reflection */}
            <Text style={[fe.sectionLabel, { color: t.muted }]}>Reflection</Text>
            <View style={[fe.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <FRow label="Notes" value={entry.notes} onChange={v => set({ notes: v })} placeholder="Service was great, would visit again…" multiline />
              <View style={fe.fieldWrap}>
                <Text style={[fe.fieldLabel, { color: t.muted }]}>Rating</Text>
                <StarRating value={entry.rating} onChange={n => set({ rating: n })} size={28} />
              </View>
              <FRow label="Cost" value={entry.cost} onChange={v => set({ cost: v })} placeholder="£24.50" keyboardType="decimal-pad" />
              <View style={[fe.fieldWrap, { borderTopColor: t.border }]}>
                <Text style={[fe.fieldLabel, { color: t.muted }]}>Order again?</Text>
                <ChipSelector options={['Yes', 'No']} value={entry.orderAgain} onChange={v => set({ orderAgain: v })} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

function FRow({ label, value, onChange, placeholder, multiline, keyboardType, last }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; multiline?: boolean; keyboardType?: any; last?: boolean
}) {
  const t = activeTheme()
  return (
    <View style={[fe.fieldWrap, !last && { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[fe.fieldLabel, { color: t.muted }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={t.muted} multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        style={[fe.fieldInput, { color: t.text }, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
      />
    </View>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function FoodLogScreen() {
  const t = activeTheme()
  const { userId }  = useAuth()
  const { voyageId, loaded: vLoaded } = useVoyage({ userId })
  const { entries, loaded, addEntry, updateEntry, deleteEntry } = useFoodLog({ voyageId })
  const [active, setActive] = useState<FoodLog | null>(null)

  // Keep modal in sync with live list
  useEffect(() => {
    if (!active) return
    const live = entries.find(e => e.id === active.id)
    if (live) setActive(live)
  }, [entries])

  const openNew = useCallback(() => { const e = addEntry(); setActive(e) }, [addEntry])

  if (!vLoaded || !loaded) {
    return <View style={[ms.fill, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={t.primary} /></View>
  }

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <Pressable onPress={openNew} hitSlop={12}>
            <Text style={[ms.addBtn, { color: '#FFFFFF' }]}>＋ Add</Text>
          </Pressable>
        ),
      }} />

      <SafeAreaView style={[ms.fill, { backgroundColor: t.bg }]} edges={['bottom']}>
        {entries.length === 0 ? (
          <View style={ms.empty}>
            <FluentEmoji name="fork_and_knife" size={72} />
            <Text style={[ms.emptyTitle, { color: t.text }]}>No meals logged yet</Text>
            <Text style={[ms.emptySub, { color: t.muted }]}>Track every meal — from buffet discoveries to specialty dining gems.</Text>
            <Pressable onPress={openNew} style={[ms.emptyBtn, { backgroundColor: t.primary }]}>
              <Text style={ms.emptyBtnText}>＋ Add Meal Entry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={ms.list}>
            <Text style={[ms.count, { color: t.muted }]}>{entries.length} meal{entries.length !== 1 ? 's' : ''} logged</Text>
            {entries.map(e => <EntryCard key={e.id} entry={e} onPress={() => setActive(e)} />)}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {entries.length > 0 && (
          <Pressable onPress={openNew} style={({ pressed }) => [ms.fab, { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={ms.fabText}>＋</Text>
          </Pressable>
        )}
      </SafeAreaView>

      <FoodEditor entry={active} onClose={() => setActive(null)} onChange={updateEntry} onDelete={deleteEntry} />
    </>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText:{ fontSize: 13, fontFamily: F_SEMI },
})

const ec = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  mealText:  { fontSize: 12, fontFamily: F_BOLD },
  date:      { fontSize: 12, fontFamily: F_BODY },
  day:       { fontSize: 12, fontFamily: F_BODY, marginLeft: 'auto' },
  venue:     { fontSize: 15, fontFamily: F_SEMI },
  what:      { fontSize: 13, fontFamily: F_BODY, lineHeight: 18 },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  stars:     { flexDirection: 'row', gap: 1 },
  cost:      { fontSize: 12, fontFamily: F_BODY },
  again:     { fontSize: 12, fontFamily: F_SEMI, marginLeft: 'auto' },
})

const fe = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  del:          { fontSize: 15, fontFamily: F_SEMI, color: '#DC2626' },
  title:        { fontSize: 17, fontFamily: F_BOLD },
  done:         { fontSize: 15, fontFamily: F_BOLD },
  scroll:       { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 11, fontFamily: F_BOLD, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  card:         { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  fieldWrap:    { padding: 14, gap: 6 },
  fieldLabel:   { fontSize: 11, fontFamily: F_BOLD, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldInput:   { fontSize: 15, fontFamily: F_BODY, paddingTop: 4 },
})

const ms = StyleSheet.create({
  fill:         { flex: 1 },
  list:         { padding: 16, gap: 12 },
  count:        { fontSize: 13, fontFamily: F_BODY, marginBottom: 4 },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle:   { fontSize: 26, fontFamily: F_DISPLAY, textAlign: 'center' },
  emptySub:     { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 20 },
  emptyBtn:     { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#FFFFFF', fontFamily: F_BOLD, fontSize: 16 },
  fab:          { position: 'absolute', bottom: 28, right: 22, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText:      { fontSize: 26, color: '#FFFFFF', lineHeight: 30 },
  addBtn:       { fontSize: 15, fontFamily: F_SEMI, paddingRight: 4 },
})
