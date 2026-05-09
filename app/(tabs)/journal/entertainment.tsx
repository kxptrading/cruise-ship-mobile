import { useCallback, useEffect, useState } from 'react'
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
import { useEntertainment } from '../../../src/hooks/useEntertainment'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'
import { FluentEmoji } from '../../../src/components/FluentEmoji'
import StarRating from '../../../src/components/StarRating'
import type { EntertainmentEntry } from '../../../src/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ENT_TYPES = ['Show', 'Live Music', 'Comedy', 'Game Show', 'Movie', 'Deck Party', 'Sport / Activity', 'Art Auction', 'Other']

const TYPE_COLORS: Record<string, string> = {
  'Show': '#DBEAFE', 'Live Music': '#D1FAE5', 'Comedy': '#FEF3C7',
  'Game Show': '#F3E8FF', 'Movie': '#FEE2E2', 'Deck Party': '#FFF7ED',
  'Sport / Activity': '#CCFBF1', 'Art Auction': '#FAF5FF', 'Other': '#F3F4F6',
}
const TYPE_TEXT: Record<string, string> = {
  'Show': '#1E40AF', 'Live Music': '#065F46', 'Comedy': '#92400E',
  'Game Show': '#5B21B6', 'Movie': '#991B1B', 'Deck Party': '#9A3412',
  'Sport / Activity': '#115E59', 'Art Auction': '#581C87', 'Other': '#374151',
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
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[cs.chip, {
            backgroundColor: active ? (colors?.[opt] ?? t.primary + '20') : t.bg,
            borderColor:     active ? (colors?.[opt] ?? t.primary + '40') : t.border,
          }]}>
            <Text style={[cs.chipText, { color: active ? (textColors?.[opt] ?? t.primary) : t.muted }]}>{opt}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, onPress }: { entry: EntertainmentEntry; onPress: () => void }) {
  const t   = activeTheme()
  const bg  = TYPE_COLORS[entry.type] ?? '#F3F4F6'
  const col = TYPE_TEXT[entry.type]   ?? '#374151'
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [ec.card, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={ec.row}>
        <View style={[ec.typeBadge, { backgroundColor: bg }]}>
          <Text style={[ec.typeText, { color: col }]}>{entry.type || 'Show'}</Text>
        </View>
        {!!entry.date && <Text style={[ec.meta, { color: t.muted }]}>{entry.date}</Text>}
        {!!entry.day  && <Text style={[ec.meta, { color: t.muted, marginLeft: 'auto' }]}>Day {entry.day}</Text>}
      </View>

      <Text style={[ec.name, { color: t.text }]} numberOfLines={1}>{entry.name || 'Untitled event'}</Text>

      <View style={ec.footer}>
        {!!entry.venue && <Text style={[ec.venue, { color: t.muted }]} numberOfLines={1}>{entry.venue}</Text>}
        {entry.rating > 0 && (
          <View style={ec.stars}>
            {[1,2,3,4,5].map(n => (
              <Text key={n} style={{ color: n <= entry.rating ? '#F59E0B' : t.border, fontSize: 12 }}>★</Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

// ── Editor modal ─────────────────────────────────────────────────────────────

function EntEditor({ entry, onClose, onChange, onDelete }: {
  entry: EntertainmentEntry | null
  onClose:  () => void
  onChange: (id: string, patch: Partial<EntertainmentEntry>) => void
  onDelete: (id: string) => Promise<void>
}) {
  const t      = activeTheme()
  const insets = useSafeAreaInsets()

  if (!entry) return null
  const set = (patch: Partial<EntertainmentEntry>) => onChange(entry.id, patch)

  const confirmDelete = () => Alert.alert('Delete entry', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await onDelete(entry.id); onClose() } },
  ])

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[ee.safe, { backgroundColor: t.bg }]}>
        <View style={[ee.header, { borderBottomColor: t.border }]}>
          <Pressable onPress={confirmDelete} hitSlop={8}><Text style={ee.del}>Delete</Text></Pressable>
          <Text style={[ee.title, { color: t.text }]}>{entry.name || entry.type || 'Event'}</Text>
          <Pressable onPress={onClose} hitSlop={8}><Text style={[ee.done, { color: t.primary }]}>Done</Text></Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[ee.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">

            {/* Event type */}
            <Text style={[ee.sectionLabel, { color: t.muted }]}>Type</Text>
            <ChipSelector options={ENT_TYPES} value={entry.type} onChange={v => set({ type: v })} colors={TYPE_COLORS} textColors={TYPE_TEXT} />

            {/* Name & when */}
            <Text style={[ee.sectionLabel, { color: t.muted }]}>The event</Text>
            <View style={[ee.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <ERow label="Name" value={entry.name} onChange={v => set({ name: v })} placeholder="Rock of Ages" />
              <ERow label="Day" value={entry.day} onChange={v => set({ day: v })} placeholder="4" keyboardType="number-pad" />
              <ERow label="Date" value={entry.date} onChange={v => set({ date: v })} placeholder="YYYY-MM-DD" last />
            </View>

            {/* Details */}
            <Text style={[ee.sectionLabel, { color: t.muted }]}>Details</Text>
            <View style={[ee.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <ERow label="Venue" value={entry.venue} onChange={v => set({ venue: v })} placeholder="Main Stage Theatre" />
              <ERow label="Performers" value={entry.performers} onChange={v => set({ performers: v })} placeholder="The Ship's Company" />
              <ERow label="Duration" value={entry.duration} onChange={v => set({ duration: v })} placeholder="01:30" last />
            </View>

            {/* Reflection */}
            <Text style={[ee.sectionLabel, { color: t.muted }]}>Reflection</Text>
            <View style={[ee.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={ee.fieldWrap}>
                <Text style={[ee.fieldLabel, { color: t.muted }]}>Rating</Text>
                <StarRating value={entry.rating} onChange={n => set({ rating: n })} size={28} />
              </View>
              <ERow label="Notes" value={entry.notes} onChange={v => set({ notes: v })} placeholder="Brilliant cast, incredible staging…" multiline last />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

function ERow({ label, value, onChange, placeholder, multiline, keyboardType, last }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; multiline?: boolean; keyboardType?: any; last?: boolean
}) {
  const t = activeTheme()
  return (
    <View style={[ee.fieldWrap, !last && { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[ee.fieldLabel, { color: t.muted }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={t.muted} multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        style={[ee.fieldInput, { color: t.text }, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
      />
    </View>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function EntertainmentScreen() {
  const t = activeTheme()
  const { userId }  = useAuth()
  const { voyageId, loaded: vLoaded } = useVoyage({ userId })
  const { entries, loaded, addEntry, updateEntry, deleteEntry } = useEntertainment({ voyageId })
  const [active, setActive] = useState<EntertainmentEntry | null>(null)

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
            <FluentEmoji name="performing_arts" size={72} />
            <Text style={[ms.emptyTitle, { color: t.text }]}>No shows logged yet</Text>
            <Text style={[ms.emptySub, { color: t.muted }]}>Log every show, performance, and event enjoyed on board.</Text>
            <Pressable onPress={openNew} style={[ms.emptyBtn, { backgroundColor: t.primary }]}>
              <Text style={ms.emptyBtnText}>＋ Add Entertainment Entry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={ms.list}>
            <Text style={[ms.count, { color: t.muted }]}>{entries.length} event{entries.length !== 1 ? 's' : ''} logged</Text>
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

      <EntEditor entry={active} onClose={() => setActive(null)} onChange={updateEntry} onDelete={deleteEntry} />
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
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeText:  { fontSize: 12, fontFamily: F_BOLD },
  meta:      { fontSize: 12, fontFamily: F_BODY },
  name:      { fontSize: 16, fontFamily: F_SEMI },
  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  venue:     { fontSize: 12, fontFamily: F_BODY, flex: 1 },
  stars:     { flexDirection: 'row', gap: 1 },
})

const ee = StyleSheet.create({
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
