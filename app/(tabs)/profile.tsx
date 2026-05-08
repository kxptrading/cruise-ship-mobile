import { useState, useRef, useEffect } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../src/lib/auth'
import { useTheme, THEMES, THEME_GROUPS } from '../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../src/lib/fonts'
import type { ThemeKey } from '../../src/lib/theme'
import { useProfile } from '../../src/hooks/useProfile'
import { useVoyage } from '../../src/hooks/useVoyage'

// ── Preference picker config ──────────────────────────────────────────────────

const PREF_OPTIONS: Record<string, string[]> = {
  cabinPreference: ['Inside', 'Oceanview', 'Balcony', 'Suite'],
  diningTime:      ['Early', 'Standard', 'Late', 'Flexible'],
  dietary:         ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Halal', 'Kosher'],
  currency:        ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'CHF', 'JPY', 'NZD'],
  units:           ['Metric', 'Imperial'],
}

const PREF_LABELS: Record<string, string> = {
  cabinPreference: 'Cabin',
  diningTime:      'Dining',
  dietary:         'Dietary',
  currency:        'Currency',
  units:           'Units',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string, email: string): string {
  if (name.trim()) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number; label: string }) {
  const { theme: t } = useTheme()
  return (
    <View style={s.statItem}>
      <Text style={[s.statValue, { color: t.primary }]}>{value}</Text>
      <Text style={[s.statLabel, { color: t.muted }]}>{label}</Text>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Profile() {
  const { theme: t, themeId, setThemeId } = useTheme()
  const { session, signOut }              = useAuth()
  const userId = session?.user?.id ?? null

  const { profile, loaded, updateProfile } = useProfile({ userId })
  const { allVoyages, dailyLogs }          = useVoyage({ userId })

  // Apply theme saved in the profile (syncs with web app)
  useEffect(() => {
    if (loaded && profile.theme && profile.theme in THEMES) {
      setThemeId(profile.theme as ThemeKey)
    }
  }, [loaded, profile.theme])

  // Stats
  const totalNights  = allVoyages.reduce((sum, v) => sum + (v.total_nights ?? 0), 0)
  const daysLogged   = dailyLogs.filter(d => d.highlights || d.bestMoment).length

  // Name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState('')
  const nameRef = useRef<TextInput>(null)

  const startEditName = () => {
    setNameValue(profile.displayName)
    setEditingName(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }
  const saveName = () => {
    setEditingName(false)
    if (nameValue.trim() !== profile.displayName) {
      updateProfile({ displayName: nameValue.trim() })
    }
  }

  // Preference picker
  const [pickerKey,  setPickerKey]  = useState<string | null>(null)
  const openPicker  = (key: string) => setPickerKey(key)
  const closePicker = ()            => setPickerKey(null)
  const pickOption  = (val: string) => {
    if (!pickerKey) return
    updateProfile({ [pickerKey]: val } as never)
    closePicker()
  }

  const prefValue = (key: string): string => {
    const v = (profile as Record<string, string>)[key] ?? ''
    return v || '—'
  }

  // Public feed toggle — stored as a preference-style field isn't in profile,
  // so we track it locally as a UI stub (web app has a separate privacy setting)
  const [publicFeed, setPublicFeed] = useState(false)

  if (!loaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.primaryDk }]} edges={['top']}>
        <View style={[s.safe, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={t.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const userInitials = initials(profile.displayName, profile.email || session?.user?.email || '')
  const subtitle     = [profile.homePort, profile.favouriteCruiseLine].filter(Boolean).join(' · ')
                     || profile.email
                     || session?.user?.email
                     || ''

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[s.safe, { backgroundColor: t.primaryDk }]} edges={['top']}>
        <ScrollView
          style={{ backgroundColor: t.bg }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <View style={[s.hero, { backgroundColor: t.primaryDk }]}>
            <View style={[s.avatar, { backgroundColor: t.primary, borderColor: '#FFFFFF' }]}>
              <Text style={s.avatarText}>{userInitials}</Text>
            </View>

            <View style={s.heroText}>
              {editingName ? (
                <TextInput
                  ref={nameRef}
                  value={nameValue}
                  onChangeText={setNameValue}
                  onBlur={saveName}
                  onSubmitEditing={saveName}
                  returnKeyType="done"
                  style={[s.nameInput, { borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' }]}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  placeholder="Your name"
                  selectionColor="#FFFFFF"
                />
              ) : (
                <Pressable onPress={startEditName} style={s.nameRow}>
                  <Text style={s.heroName} numberOfLines={1}>
                    {profile.displayName || profile.email?.split('@')[0] || session?.user?.email?.split('@')[0] || 'Your name'}
                  </Text>
                  <Text style={s.editIcon}>✏</Text>
                </Pressable>
              )}
              {!!subtitle && (
                <Text style={s.heroSub} numberOfLines={1}>{subtitle}</Text>
              )}
            </View>
          </View>

          {/* ── Stats strip ──────────────────────────────────────────────── */}
          <View style={[s.statsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <StatItem value={allVoyages.length} label="Voyages" />
            <View style={[s.statDivider, { backgroundColor: t.border }]} />
            <StatItem value={totalNights}       label="Nights" />
            <View style={[s.statDivider, { backgroundColor: t.border }]} />
            <StatItem value={daysLogged}        label="Days logged" />
          </View>

          {/* ── Appearance ───────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Appearance</Text>
            <Text style={[s.cardSub, { color: t.muted }]}>Choose your colour theme</Text>

            {THEME_GROUPS.map(group => (
              <View key={group.label} style={s.themeGroup}>
                <Text style={[s.groupLabel, { color: t.muted }]}>{group.label}</Text>
                <View style={s.circleRow}>
                  {group.ids.map((id: ThemeKey) => {
                    const meta   = THEMES[id]
                    const active = id === themeId
                    return (
                      <Pressable
                        key={id}
                        onPress={() => { setThemeId(id); updateProfile({ theme: id }) }}
                        style={s.circleWrap}
                        accessibilityLabel={meta.label}
                        accessibilityState={{ selected: active }}
                      >
                        <View style={[
                          s.circle,
                          { backgroundColor: meta.primary },
                          active && { borderWidth: 3, borderColor: t.text },
                        ]}>
                          {active && <Text style={s.checkmark}>✓</Text>}
                        </View>
                        <Text style={[s.circleEmoji]}>{meta.emoji}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* ── Preferences ──────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Preferences</Text>
            <Text style={[s.cardSub, { color: t.muted }]}>Defaults for new voyages</Text>

            {Object.keys(PREF_OPTIONS).map((key, i, arr) => (
              <Pressable
                key={key}
                onPress={() => openPicker(key)}
                style={[
                  s.prefRow,
                  { borderTopColor: t.border },
                  i === 0 && s.prefRowFirst,
                ]}
              >
                <Text style={[s.prefLabel, { color: t.text }]}>{PREF_LABELS[key]}</Text>
                <View style={s.prefRight}>
                  <Text style={[s.prefValue, { color: t.muted }]}>{prefValue(key)}</Text>
                  <Text style={[s.prefChev, { color: t.muted }]}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* ── Settings ─────────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Settings</Text>

            <View style={[s.prefRow, s.prefRowFirst, { borderTopColor: t.border }]}>
              <View style={s.flex1}>
                <Text style={[s.prefLabel, { color: t.text }]}>Public feed</Text>
                <Text style={[s.prefHint, { color: t.muted }]}>Share daily logs with other travellers</Text>
              </View>
              <Switch
                value={publicFeed}
                onValueChange={setPublicFeed}
                thumbColor="#FFFFFF"
                trackColor={{ false: t.border, true: t.primary }}
              />
            </View>

            <View style={[s.prefRow, { borderTopColor: t.border }]}>
              <Text style={[s.prefLabel, { color: t.muted }]}>Signed in as</Text>
              <Text style={[s.prefValue, { color: t.muted }]} numberOfLines={1}>
                {session?.user?.email ?? '—'}
              </Text>
            </View>
          </View>

          {/* ── Sign out ─────────────────────────────────────────────────── */}
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [s.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>

          <View style={s.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Preference picker modal ───────────────────────────────────────── */}
      <Modal
        visible={pickerKey !== null}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <Pressable style={s.overlay} onPress={closePicker}>
          <Pressable
            style={[s.sheet, { backgroundColor: t.surface }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[s.sheetHandle, { backgroundColor: t.border }]} />
            <Text style={[s.sheetTitle, { color: t.text }]}>
              {pickerKey ? PREF_LABELS[pickerKey] : ''}
            </Text>
            {(pickerKey ? PREF_OPTIONS[pickerKey] : []).map(opt => {
              const current = pickerKey ? prefValue(pickerKey) : ''
              const active  = opt === current
              return (
                <Pressable
                  key={opt}
                  onPress={() => pickOption(opt)}
                  style={[s.sheetOption, { borderBottomColor: t.border }]}
                >
                  <Text style={[s.sheetOptionText, { color: active ? t.primary : t.text, fontWeight: active ? '700' : '400' }]}>
                    {opt}
                  </Text>
                  {active && <Text style={[s.sheetCheck, { color: t.primary }]}>✓</Text>}
                </Pressable>
              )
            })}
            <View style={s.sheetPad} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { flexGrow: 1 },

  // Hero
  hero:         { paddingTop: 28, paddingBottom: 48, paddingHorizontal: 20, gap: 14 },
  avatar:       { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarText:   { fontSize: 30, fontFamily: F_BOLD, color: '#FFFFFF' },
  heroText:     { gap: 4 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName:     { fontSize: 26, fontFamily: F_DISPLAY, color: '#FFFFFF' },
  editIcon:     { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  heroSub:      { fontSize: 13, fontFamily: F_BODY, color: 'rgba(255,255,255,0.7)' },
  nameInput:    { fontSize: 22, fontFamily: F_DISPLAY, color: '#FFFFFF', borderBottomWidth: 1.5, paddingBottom: 4, minWidth: 160 },

  // Stats
  statsCard:    { flexDirection: 'row', marginHorizontal: 16, marginTop: -24, borderRadius: 18, borderWidth: 1, padding: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  statItem:     { flex: 1, alignItems: 'center', gap: 2 },
  statValue:    { fontSize: 22, fontFamily: F_BOLD },
  statLabel:    { fontSize: 11, fontFamily: F_SEMI, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider:  { width: 1, marginVertical: 4 },

  // Cards
  card:         { marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 20, gap: 2 },
  cardTitle:    { fontSize: 20, fontFamily: F_DISPLAY, marginBottom: 2 },
  cardSub:      { fontSize: 13, fontFamily: F_BODY, marginBottom: 10 },
  flex1:        { flex: 1 },

  // Theme picker
  themeGroup:   { marginTop: 12 },
  groupLabel:   { fontSize: 11, fontFamily: F_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  circleRow:    { flexDirection: 'row', gap: 14 },
  circleWrap:   { alignItems: 'center', gap: 4 },
  circle:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  checkmark:    { color: '#FFFFFF', fontSize: 18, fontFamily: F_BOLD },
  circleEmoji:  { fontSize: 13 },

  // Preferences
  prefRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, gap: 8 },
  prefRowFirst: { borderTopWidth: 0, paddingTop: 6 },
  prefLabel:    { flex: 1, fontSize: 15, fontFamily: F_BODY },
  prefRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prefValue:    { fontSize: 14, fontFamily: F_BODY },
  prefChev:     { fontSize: 20 },
  prefHint:     { fontSize: 12, fontFamily: F_BODY, marginTop: 2 },

  // Sign out
  signOutBtn:   { margin: 16, marginTop: 12, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signOutText:  { color: '#B91C1C', fontFamily: F_BOLD, fontSize: 16 },
  bottomPad:    { height: 32 },

  // Picker modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '70%' },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 20, fontFamily: F_DISPLAY, marginBottom: 8 },
  sheetOption:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { flex: 1, fontSize: 16, fontFamily: F_BODY },
  sheetCheck:   { fontSize: 18, fontFamily: F_BOLD },
  sheetPad:     { height: 32 },
})
