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
import { useNotes } from '../../../src/hooks/useNotes'
import { activeTheme } from '../../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../../src/lib/fonts'
import type { Note } from '../../../src/types'

// ── Note colour palette — 6 colours rotating by index ────────────────────────

const PALETTES = [
  { bg: '#FFFDE7', border: '#FDE68A', pin: '#F59E0B', line: '#FEF08A' }, // yellow
  { bg: '#E3F2FD', border: '#BFDBFE', pin: '#3B82F6', line: '#BAE6FD' }, // blue
  { bg: '#F3E8FF', border: '#DDD6FE', pin: '#8B5CF6', line: '#E9D5FF' }, // purple
  { bg: '#ECFDF5', border: '#A7F3D0', pin: '#10B981', line: '#BBF7D0' }, // green
  { bg: '#FFF1F2', border: '#FECDD3', pin: '#F43F5E', line: '#FEE2E2' }, // pink
  { bg: '#FFF7ED', border: '#FED7AA', pin: '#F97316', line: '#FFEDD5' }, // orange
]

const TILTS = ['-1.2deg', '0.8deg', '-0.7deg', '1.1deg', '-0.9deg', '0.6deg']

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, index, onPress }: { note: Note; index: number; onPress: () => void }) {
  const p = PALETTES[index % PALETTES.length]
  const tilt = TILTS[index % TILTS.length]
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: p.bg,
          borderColor:     p.border,
          transform:       [{ rotate: tilt }],
          opacity:         pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Pin */}
      <View style={s.pinWrap}>
        <View style={[s.pin, { backgroundColor: p.pin, shadowColor: p.pin }]} />
      </View>

      {/* Ruled lines behind content */}
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[s.rule, { top: 52 + i * 22, backgroundColor: p.line }]} />
      ))}

      {/* Content */}
      <Text style={s.cardTitle} numberOfLines={1}>
        {note.title || 'Untitled'}
      </Text>
      {!!note.content && (
        <Text style={s.cardBody} numberOfLines={5}>
          {note.content}
        </Text>
      )}
    </Pressable>
  )
}

// ── Editor modal ──────────────────────────────────────────────────────────────

interface EditorProps {
  note:       Note | null
  onClose:    () => void
  onChange:   (id: string, patch: Partial<Omit<Note, 'id'>>) => void
  onDelete:   (id: string) => Promise<void>
}

function NoteEditor({ note, onClose, onChange, onDelete }: EditorProps) {
  const t       = activeTheme()
  const insets  = useSafeAreaInsets()
  const titleRef = useRef<TextInput>(null)

  const p = note ? PALETTES[0] : PALETTES[0]

  useEffect(() => {
    if (note && !note.title && !note.content) {
      setTimeout(() => titleRef.current?.focus(), 200)
    }
  }, [note?.id])

  const confirmDelete = () => {
    if (!note) return
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await onDelete(note.id)
          onClose()
        },
      },
    ])
  }

  if (!note) return null

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[s.editorSafe, { backgroundColor: t.bg }]}>
        {/* Header */}
        <View style={[s.editorHeader, { borderBottomColor: t.border }]}>
          <Pressable onPress={confirmDelete} hitSlop={8}>
            <Text style={[s.editorDelete, { color: '#DC2626' }]}>Delete</Text>
          </Pressable>
          <Text style={[s.editorTitle, { color: t.text }]}>Note</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[s.editorDone, { color: t.primary }]}>Done</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={[s.editorScroll, { paddingBottom: insets.bottom + 40 }]}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={titleRef}
              value={note.title}
              onChangeText={v => onChange(note.id, { title: v })}
              placeholder="Title…"
              placeholderTextColor={t.muted}
              style={[s.editorTitleInput, { color: t.text }]}
              returnKeyType="next"
              maxLength={120}
            />

            <View style={[s.editorSep, { backgroundColor: t.border }]} />

            <TextInput
              value={note.content}
              onChangeText={v => onChange(note.id, { content: v })}
              placeholder="Write your note…"
              placeholderTextColor={t.muted}
              style={[s.editorBodyInput, { color: t.text }]}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotesScreen() {
  const t = activeTheme()
  const { userId }  = useAuth()
  const { voyageId, loaded: voyageLoaded } = useVoyage({ userId })
  const { notes, loaded, addNote, updateNote, deleteNote } = useNotes({ voyageId })

  const [activeNote, setActiveNote] = useState<Note | null>(null)

  const openNew = useCallback(() => {
    const note = addNote()
    setActiveNote(note)
  }, [addNote])

  const openExisting = useCallback((note: Note) => {
    setActiveNote(note)
  }, [])

  // Keep the modal note in sync with the live notes list
  useEffect(() => {
    if (!activeNote) return
    const live = notes.find(n => n.id === activeNote.id)
    if (live) setActiveNote(live)
  }, [notes])

  const closeEditor = useCallback(() => {
    setActiveNote(null)
  }, [])

  if (!voyageLoaded || !loaded) {
    return (
      <View style={[s.fill, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={t.primary} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={openNew} hitSlop={12}>
              <Text style={[s.addBtn, { color: '#FFFFFF' }]}>＋ New</Text>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={[s.fill, { backgroundColor: t.bg }]} edges={['bottom']}>
        {notes.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📝</Text>
            <Text style={[s.emptyTitle, { color: t.text }]}>No notes yet</Text>
            <Text style={[s.emptySub, { color: t.muted }]}>
              Jot down anything — tips, reminders, ideas, things to remember.
            </Text>
            <Pressable
              onPress={openNew}
              style={[s.emptyBtn, { backgroundColor: t.primary }]}
            >
              <Text style={s.emptyBtnText}>＋ Add Note</Text>
            </Pressable>
          </View>
        ) : (
          /* ── Notes grid ───────────────────────────────────────────────── */
          <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
            {notes.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                index={i}
                onPress={() => openExisting(note)}
              />
            ))}
            {/* Spacer so last row isn't cut off by FAB */}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* ── FAB ─────────────────────────────────────────────────────── */}
        {notes.length > 0 && (
          <Pressable
            onPress={openNew}
            style={({ pressed }) => [s.fab, { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={s.fabText}>＋</Text>
          </Pressable>
        )}
      </SafeAreaView>

      {/* ── Note editor modal ─────────────────────────────────────────── */}
      <NoteEditor
        note={activeNote}
        onClose={closeEditor}
        onChange={updateNote}
        onDelete={deleteNote}
      />
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },
  flex1: { flex: 1 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 14 },

  // Note card
  card: {
    width: '46.5%',
    minHeight: 150,
    borderRadius: 4,
    borderWidth: 1,
    padding: 14,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  pinWrap:    { alignItems: 'center', marginBottom: 8 },
  pin:        { width: 14, height: 14, borderRadius: 7, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  rule:       { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.7 },
  cardTitle:  { fontSize: 13, fontFamily: F_BOLD, color: '#1C2B3A', marginBottom: 6, lineHeight: 18 },
  cardBody:   { fontSize: 12, fontFamily: F_BODY, color: '#374151', lineHeight: 18 },

  // Empty state
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji:   { fontSize: 52 },
  emptyTitle:   { fontSize: 26, fontFamily: F_DISPLAY, textAlign: 'center' },
  emptySub:     { fontSize: 14, fontFamily: F_BODY, textAlign: 'center', lineHeight: 20 },
  emptyBtn:     { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#FFFFFF', fontFamily: F_BOLD, fontSize: 16 },

  // FAB
  fab:     { position: 'absolute', bottom: 28, right: 22, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 26, color: '#FFFFFF', lineHeight: 30 },

  // Header add button
  addBtn: { fontSize: 15, fontFamily: F_SEMI, paddingRight: 4 },

  // Editor modal
  editorSafe:       { flex: 1 },
  editorHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  editorDelete:     { fontSize: 15, fontFamily: F_SEMI },
  editorTitle:      { fontSize: 17, fontFamily: F_BOLD },
  editorDone:       { fontSize: 15, fontFamily: F_BOLD },
  editorScroll:     { padding: 20, gap: 0 },
  editorTitleInput: { fontSize: 26, fontFamily: F_DISPLAY, lineHeight: 34, marginBottom: 16 },
  editorSep:        { height: StyleSheet.hairlineWidth, marginBottom: 16 },
  editorBodyInput:  { fontSize: 16, fontFamily: F_BODY, lineHeight: 26, minHeight: 300 },
})
