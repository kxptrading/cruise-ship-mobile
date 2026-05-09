import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ActivityIndicator,
  Image,
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
import type { ThemeKey } from '../../src/lib/theme'
import { F_DISPLAY, F_BOLD, F_SEMI, F_BODY } from '../../src/lib/fonts'
import { useProfile } from '../../src/hooks/useProfile'
import { useVoyage } from '../../src/hooks/useVoyage'
import { useBadges } from '../../src/hooks/useBadges'
import { FluentEmoji } from '../../src/components/FluentEmoji'

// ── Personality traits ────────────────────────────────────────────────────────

const TRAITS = [
  { name: 'Balcony Lover',          desc: 'Sea views every morning, no exceptions' },
  { name: 'Excursion Maximalist',   desc: 'Every port, every adventure, every time' },
  { name: 'Formal Night Regular',   desc: 'Black tie? Already packed. Twice.' },
  { name: 'Trivia Enthusiast',      desc: 'Top of the leaderboard or it didn\'t happen' },
  { name: 'Buffet Strategist',      desc: 'First in line, last to leave' },
  { name: 'Sea Day Champion',       desc: 'Nothing beats a day with nowhere to be' },
  { name: 'Port Collector',         desc: 'Ticking off destinations one gangway at a time' },
  { name: 'Spa Devotee',            desc: 'Thermal suite, hot stone, repeat' },
  { name: 'Casino Regular',         desc: 'One more hand — then bed' },
  { name: 'Deck Chair Philosopher', desc: 'Best thoughts happen at sea' },
  { name: 'Photo Chronicler',       desc: 'Every moment captured for posterity' },
  { name: 'Show Fan',               desc: 'Front row for every performance' },
  { name: 'Late Night Reveller',    desc: 'The night is young at every port' },
  { name: 'Early Riser',            desc: 'Sunrises at sea are unmatched' },
  { name: 'Foodie Explorer',        desc: 'Every meal is an adventure' },
  { name: 'Drinks Package Champion',desc: 'Getting full value, every day' },
  { name: 'Pool Lounger',           desc: 'Claimed this sunbed at 7am' },
  { name: 'Shopping Enthusiast',    desc: 'Duty-free is a sport' },
  { name: 'Cocktail Hour Regular',  desc: '5pm somewhere in the world' },
  { name: 'Ship Historian',         desc: 'Knows every deck and corridor by heart' },
]

const SLOT_COLORS = ['#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6']

// ── Preference options ────────────────────────────────────────────────────────

const PREF_OPTIONS: Record<string, string[]> = {
  cabinPreference: ['Inside', 'Oceanview', 'Balcony', 'Suite'],
  diningTime:      ['Early', 'Standard', 'Late', 'Flexible'],
  dietary:         ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Halal', 'Kosher'],
  currency:        ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'CHF', 'JPY', 'NZD'],
  units:           ['Metric', 'Imperial'],
}

const PREF_LABELS: Record<string, string> = {
  cabinPreference: 'Cabin', diningTime: 'Dining', dietary: 'Dietary',
  currency: 'Currency', units: 'Units',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string, email: string): string {
  if (name.trim()) return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] ?? '?').toUpperCase()
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Stat item ─────────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number | string; label: string }) {
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

  const { profile, loaded, updateProfile }        = useProfile({ userId })
  const { voyage, allVoyages, dailyLogs, loaded: vLoaded } = useVoyage({ userId })
  const totalNights = parseInt(voyage?.totalNights ?? '0') || 0
  const badges = useBadges({ voyageId: voyage ? (allVoyages[0]?.id ?? null) : null, dailyLogs, totalNights })

  // Sync DB theme on load
  useEffect(() => {
    if (loaded && profile.theme && profile.theme in THEMES) {
      setThemeId(profile.theme as ThemeKey)
    }
  }, [loaded, profile.theme])

  // Stats
  const totalNightsAll = allVoyages.reduce((s, v) => s + (v.total_nights ?? 0), 0)
  const daysLogged     = dailyLogs.filter(d => d.highlights || d.bestMoment).length

  // Companions from current voyage
  const companions = [voyage?.companion1, voyage?.companion2, voyage?.companion3, voyage?.companion4]
    .filter(Boolean) as string[]

  // Name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState('')
  const nameRef = useRef<TextInput>(null)

  const startEditName = () => { setNameValue(profile.displayName); setEditingName(true); setTimeout(() => nameRef.current?.focus(), 50) }
  const saveName      = () => { setEditingName(false); if (nameValue.trim() !== profile.displayName) updateProfile({ displayName: nameValue.trim() }) }

  // Generic picker modal (preferences + traits share this)
  const [pickerKey,   setPickerKey]   = useState<string | null>(null)
  const [pickerSlot,  setPickerSlot]  = useState<number | null>(null)   // 1-4 for traits
  const closePicker = () => { setPickerKey(null); setPickerSlot(null) }

  const openPref  = (key: string)    => setPickerKey(key)
  const pickPref  = (val: string)    => { if (!pickerKey) return; updateProfile({ [pickerKey]: val } as never); closePicker() }
  const openTrait = (slot: number)   => { setPickerSlot(slot); setPickerKey('trait') }
  const pickTrait = (name: string)   => {
    if (!pickerSlot) return
    updateProfile({ [`trait${pickerSlot}`]: name } as never)
    closePicker()
  }
  const clearTrait = (slot: number)  => updateProfile({ [`trait${slot}`]: '' } as never)

  const prefValue = (key: string) => (profile as Record<string, string>)[key] || '—'
  const traitValue = (slot: number): string => (profile as Record<string, string>)[`trait${slot}`] || ''

  const [publicFeed, setPublicFeed] = useState(false)

  if (!loaded || !vLoaded) {
    return (
      <View style={[s.fill, { backgroundColor: t.primaryDk, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    )
  }

  const userInitials = initials(profile.displayName, profile.email || session?.user?.email || '')
  const subtitle     = [profile.homePort, profile.favouriteCruiseLine].filter(Boolean).join(' · ')
                     || profile.email || session?.user?.email || ''

  const earnedBadges = badges.filter(b => b.earned).length

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={[s.fill, { backgroundColor: t.primaryDk }]} edges={['top']}>
        <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <View style={[s.hero, { backgroundColor: t.primaryDk }]}>
            {!!profile.bannerUrl && (
              <Image source={{ uri: profile.bannerUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            )}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: profile.bannerUrl ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={[s.avatar, { backgroundColor: t.primary, borderColor: '#FFFFFF' }]}>
              {profile.avatarUrl
                ? <Image source={{ uri: profile.avatarUrl }} style={s.avatarImg} />
                : <Text style={s.avatarText}>{userInitials}</Text>}
            </View>

            <View style={s.heroText}>
              {editingName ? (
                <TextInput ref={nameRef} value={nameValue} onChangeText={setNameValue} onBlur={saveName} onSubmitEditing={saveName} returnKeyType="done" style={[s.nameInput, { borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' }]} placeholderTextColor="rgba(255,255,255,0.5)" placeholder="Your name" selectionColor="#FFFFFF" />
              ) : (
                <Pressable onPress={startEditName} style={s.nameRow}>
                  <Text style={s.heroName} numberOfLines={1}>{profile.displayName || profile.email?.split('@')[0] || session?.user?.email?.split('@')[0] || 'Your name'}</Text>
                  <Text style={s.editIcon}>✏</Text>
                </Pressable>
              )}
              {!!subtitle && <Text style={s.heroSub} numberOfLines={1}>{subtitle}</Text>}
              {earnedBadges > 0 && (
                <Text style={[s.heroBadgeCount, { color: t.accent }]}>{earnedBadges} of {badges.length} badges earned</Text>
              )}
            </View>
          </View>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <View style={[s.statsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <StatItem value={allVoyages.length} label="Voyages" />
            <View style={[s.statDiv, { backgroundColor: t.border }]} />
            <StatItem value={totalNightsAll}    label="Nights" />
            <View style={[s.statDiv, { backgroundColor: t.border }]} />
            <StatItem value={daysLogged}        label="Days logged" />
          </View>

          {/* ── Badges ────────────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Badges</Text>
            <Text style={[s.cardSub, { color: t.muted }]}>{earnedBadges} of {badges.length} earned</Text>

            <View style={s.badgeGrid}>
              {badges.map(badge => (
                <View
                  key={badge.id}
                  style={[
                    s.badgeCard,
                    {
                      backgroundColor: badge.earned ? badge.color + '14' : t.light,
                      borderColor:     badge.earned ? badge.color + '50' : t.border,
                    },
                  ]}
                >
                  <FluentEmoji name={badge.emojiKey} size={36} opacity={badge.earned ? 1 : 0.25} />
                  <Text style={[s.badgeLabel, { color: badge.earned ? t.text : t.muted }]} numberOfLines={2}>
                    {badge.label}
                  </Text>
                  {badge.earned && (
                    <View style={[s.badgeTick, { backgroundColor: badge.color }]}>
                      <Text style={s.badgeTickText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* ── Personality Traits ────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Personality</Text>
            <Text style={[s.cardSub, { color: t.muted }]}>Pick up to 4 cruise archetypes</Text>

            {[1, 2, 3, 4].map(slot => {
              const val   = traitValue(slot)
              const color = SLOT_COLORS[slot - 1]
              return (
                <Pressable
                  key={slot}
                  onPress={() => openTrait(slot)}
                  style={[s.traitRow, { borderColor: val ? color + '60' : t.border, backgroundColor: val ? color + '0D' : t.bg }]}
                >
                  <View style={[s.traitDot, { backgroundColor: val ? color : t.border }]} />
                  <View style={s.flex1}>
                    <Text style={[s.traitName, { color: val ? t.text : t.muted }]}>{val || 'Tap to choose a trait'}</Text>
                    {!!val && <Text style={[s.traitDesc, { color: t.muted }]} numberOfLines={1}>
                      {TRAITS.find(tr => tr.name === val)?.desc}
                    </Text>}
                  </View>
                  {val ? (
                    <Pressable onPress={() => clearTrait(slot)} hitSlop={10}>
                      <Text style={[s.traitClear, { color: t.muted }]}>✕</Text>
                    </Pressable>
                  ) : (
                    <Text style={[s.prefChev, { color: t.muted }]}>›</Text>
                  )}
                </Pressable>
              )
            })}
          </View>

          {/* ── Companions ────────────────────────────────────────────────── */}
          {companions.length > 0 && (
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[s.cardTitle, { color: t.text }]}>Travel Companions</Text>
              <Text style={[s.cardSub, { color: t.muted }]}>From your active voyage</Text>
              <View style={s.companionRow}>
                {companions.map(name => {
                  const initls = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <View key={name} style={s.companionItem}>
                      <View style={[s.companionAvatar, { backgroundColor: t.primary + '20', borderColor: t.primary + '40' }]}>
                        <Text style={[s.companionInitials, { color: t.primary }]}>{initls}</Text>
                      </View>
                      <Text style={[s.companionName, { color: t.text }]} numberOfLines={1}>{name}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* ── Voyages ───────────────────────────────────────────────────── */}
          {allVoyages.length > 0 && (
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[s.cardTitle, { color: t.text }]}>Voyages</Text>
              <Text style={[s.cardSub, { color: t.muted }]}>{allVoyages.length} voyage{allVoyages.length !== 1 ? 's' : ''} in your log</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.voyageScroll} contentContainerStyle={s.voyageScrollContent}>
                {allVoyages.map((v, i) => {
                  const isActive = i === 0
                  return (
                    <View key={v.id} style={[s.voyageCard, { borderColor: isActive ? t.primary : t.border, backgroundColor: isActive ? t.primary + '0A' : t.light }]}>
                      {v.cover_photo_url ? (
                        <Image source={{ uri: v.cover_photo_url }} style={s.voyagePhoto} resizeMode="cover" />
                      ) : (
                        <View style={[s.voyagePhoto, { backgroundColor: t.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                          <FluentEmoji name="ship" size={32} />
                        </View>
                      )}
                      <View style={s.voyageInfo}>
                        <Text style={[s.voyageShip, { color: t.text }]} numberOfLines={1}>{v.ship_name || 'Unnamed voyage'}</Text>
                        <Text style={[s.voyageLine, { color: t.muted }]} numberOfLines={1}>{v.cruise_line || ''}</Text>
                        <Text style={[s.voyageDates, { color: t.muted }]}>{fmtDate(v.departure_date ?? '')} · {v.total_nights ?? '?'} nights</Text>
                        {isActive && <View style={[s.voyageNowBadge, { backgroundColor: t.primary }]}><Text style={s.voyageNowText}>ACTIVE</Text></View>}
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Appearance ────────────────────────────────────────────────── */}
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
                      <Pressable key={id} onPress={() => { setThemeId(id); updateProfile({ theme: id }) }} style={s.circleWrap} accessibilityLabel={meta.label} accessibilityState={{ selected: active }}>
                        <View style={[s.circle, { backgroundColor: meta.primary }, active && { borderWidth: 3, borderColor: t.text }]}>
                          {active && <Text style={s.checkmark}>✓</Text>}
                        </View>
                        <Text style={s.circleEmoji}>{meta.emoji}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* ── Preferences ───────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Preferences</Text>
            <Text style={[s.cardSub, { color: t.muted }]}>Defaults for new voyages</Text>
            {Object.keys(PREF_OPTIONS).map((key, i) => (
              <Pressable key={key} onPress={() => openPref(key)} style={[s.prefRow, { borderTopColor: t.border }, i === 0 && s.prefRowFirst]}>
                <Text style={[s.prefLabel, { color: t.text }]}>{PREF_LABELS[key]}</Text>
                <View style={s.prefRight}>
                  <Text style={[s.prefValue, { color: t.muted }]}>{prefValue(key)}</Text>
                  <Text style={[s.prefChev, { color: t.muted }]}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* ── Settings ──────────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Settings</Text>
            <View style={[s.prefRow, s.prefRowFirst, { borderTopColor: t.border }]}>
              <View style={s.flex1}>
                <Text style={[s.prefLabel, { color: t.text }]}>Public feed</Text>
                <Text style={[s.prefHint, { color: t.muted }]}>Share daily logs with other travellers</Text>
              </View>
              <Switch value={publicFeed} onValueChange={setPublicFeed} thumbColor="#FFFFFF" trackColor={{ false: t.border, true: t.primary }} />
            </View>
            <View style={[s.prefRow, { borderTopColor: t.border }]}>
              <Text style={[s.prefLabel, { color: t.muted }]}>Signed in as</Text>
              <Text style={[s.prefValue, { color: t.muted }]} numberOfLines={1}>{session?.user?.email ?? '—'}</Text>
            </View>
          </View>

          <Pressable onPress={signOut} style={({ pressed }) => [s.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Picker modal (preferences & traits) ───────────────────────────── */}
      <Modal visible={pickerKey !== null} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={s.overlay} onPress={closePicker}>
          <Pressable style={[s.sheet, { backgroundColor: t.surface }]} onPress={e => e.stopPropagation()}>
            <View style={[s.sheetHandle, { backgroundColor: t.border }]} />
            <Text style={[s.sheetTitle, { color: t.text }]}>
              {pickerKey === 'trait' ? 'Choose a trait' : PREF_LABELS[pickerKey ?? ''] ?? ''}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerKey === 'trait'
                ? TRAITS.map(tr => {
                    const isSelected = [1, 2, 3, 4].some(sl => traitValue(sl) === tr.name && sl !== pickerSlot)
                    return (
                      <Pressable key={tr.name} onPress={() => pickTrait(tr.name)} style={[s.sheetOption, { borderBottomColor: t.border, opacity: isSelected ? 0.4 : 1 }]}>
                        <View style={s.flex1}>
                          <Text style={[s.sheetOptionText, { color: traitValue(pickerSlot ?? 0) === tr.name ? t.primary : t.text, fontFamily: traitValue(pickerSlot ?? 0) === tr.name ? F_BOLD : F_BODY }]}>{tr.name}</Text>
                          <Text style={[s.sheetOptionDesc, { color: t.muted }]}>{tr.desc}</Text>
                        </View>
                        {traitValue(pickerSlot ?? 0) === tr.name && <Text style={[s.sheetCheck, { color: t.primary }]}>✓</Text>}
                      </Pressable>
                    )
                  })
                : (PREF_OPTIONS[pickerKey ?? ''] ?? []).map(opt => (
                    <Pressable key={opt} onPress={() => pickPref(opt)} style={[s.sheetOption, { borderBottomColor: t.border }]}>
                      <Text style={[s.sheetOptionText, { color: prefValue(pickerKey ?? '') === opt ? t.primary : t.text, fontFamily: prefValue(pickerKey ?? '') === opt ? F_BOLD : F_BODY }]}>{opt}</Text>
                      {prefValue(pickerKey ?? '') === opt && <Text style={[s.sheetCheck, { color: t.primary }]}>✓</Text>}
                    </Pressable>
                  ))
              }
              <View style={{ height: 32 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill:   { flex: 1 },
  flex1:  { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero:         { paddingTop: 28, paddingBottom: 48, paddingHorizontal: 20, gap: 14, overflow: 'hidden', minHeight: 200 },
  avatar:       { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 3, overflow: 'hidden' },
  avatarImg:    { width: '100%', height: '100%' },
  avatarText:   { fontSize: 30, fontFamily: F_BOLD, color: '#FFFFFF' },
  heroText:     { gap: 4 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName:     { fontSize: 26, fontFamily: F_DISPLAY, color: '#FFFFFF' },
  editIcon:     { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  heroSub:      { fontSize: 13, fontFamily: F_BODY, color: 'rgba(255,255,255,0.7)' },
  heroBadgeCount: { fontSize: 12, fontFamily: F_SEMI, color: '#F59E0B' },
  nameInput:    { fontSize: 22, fontFamily: F_DISPLAY, color: '#FFFFFF', borderBottomWidth: 1.5, paddingBottom: 4, minWidth: 160 },

  // Stats
  statsCard:  { flexDirection: 'row', marginHorizontal: 16, marginTop: -24, borderRadius: 18, borderWidth: 1, padding: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  statItem:   { flex: 1, alignItems: 'center', gap: 2 },
  statValue:  { fontSize: 22, fontFamily: F_BOLD },
  statLabel:  { fontSize: 11, fontFamily: F_SEMI, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv:    { width: 1, marginVertical: 4 },

  // Cards
  card:       { marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 20, gap: 2 },
  cardTitle:  { fontSize: 20, fontFamily: F_DISPLAY, marginBottom: 2 },
  cardSub:    { fontSize: 13, fontFamily: F_BODY, marginBottom: 12 },

  // Badges
  badgeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  badgeCard:     { width: '22%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', gap: 6, minHeight: 90 },
  badgeLabel:    { fontSize: 10, fontFamily: F_SEMI, textAlign: 'center', lineHeight: 13 },
  badgeTick:     { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeTickText: { color: '#FFFFFF', fontSize: 9, fontFamily: F_BOLD },

  // Traits
  traitRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  traitDot:    { width: 10, height: 10, borderRadius: 5 },
  traitName:   { fontSize: 14, fontFamily: F_SEMI },
  traitDesc:   { fontSize: 11, fontFamily: F_BODY, marginTop: 2 },
  traitClear:  { fontSize: 14, padding: 4 },

  // Companions
  companionRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  companionItem:     { alignItems: 'center', gap: 6, width: 64 },
  companionAvatar:   { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  companionInitials: { fontSize: 18, fontFamily: F_BOLD },
  companionName:     { fontSize: 11, fontFamily: F_BODY, textAlign: 'center' },

  // Voyages
  voyageScroll:        { marginTop: 8 },
  voyageScrollContent: { gap: 12, paddingRight: 4 },
  voyageCard:          { width: 160, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  voyagePhoto:         { width: '100%', height: 90 },
  voyageInfo:          { padding: 10, gap: 3 },
  voyageShip:          { fontSize: 13, fontFamily: F_SEMI },
  voyageLine:          { fontSize: 11, fontFamily: F_BODY },
  voyageDates:         { fontSize: 10, fontFamily: F_BODY },
  voyageNowBadge:      { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  voyageNowText:       { color: '#FFFFFF', fontSize: 9, fontFamily: F_BOLD, letterSpacing: 0.5 },

  // Theme picker
  themeGroup:  { marginTop: 12 },
  groupLabel:  { fontSize: 11, fontFamily: F_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  circleRow:   { flexDirection: 'row', gap: 14 },
  circleWrap:  { alignItems: 'center', gap: 4 },
  circle:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { color: '#FFFFFF', fontSize: 18, fontFamily: F_BOLD },
  circleEmoji: { fontSize: 13 },

  // Preferences
  prefRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, gap: 8 },
  prefRowFirst: { borderTopWidth: 0, paddingTop: 6 },
  prefLabel:    { flex: 1, fontSize: 15, fontFamily: F_BODY },
  prefRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prefValue:    { fontSize: 14, fontFamily: F_BODY },
  prefChev:     { fontSize: 20 },
  prefHint:     { fontSize: 12, fontFamily: F_BODY, marginTop: 2 },

  // Sign out
  signOutBtn:  { margin: 16, marginTop: 12, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: '#B91C1C', fontFamily: F_BOLD, fontSize: 16 },

  // Picker modal
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:           { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '75%' },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 20, fontFamily: F_DISPLAY, marginBottom: 8 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15, marginBottom: 1 },
  sheetOptionDesc: { fontSize: 12, fontFamily: F_BODY },
  sheetCheck:      { fontSize: 18, fontFamily: F_BOLD },
})
