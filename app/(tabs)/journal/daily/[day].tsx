// ─────────────────────────────────────────────────────────────────────────────
// app/(tabs)/journal/daily/[day].tsx — Daily log editor
//
// Reads the active voyage and the daily_logs row for the requested day
// number, renders form fields for every column, and writes back through
// useVoyage.updateDailyLog (debounced upsert keyed by voyage_id, day_number).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../../../src/lib/auth'
import { useVoyage } from '../../../../src/hooks/useVoyage'
import { addPhoto, getPhotos } from '../../../../src/lib/photoStorage'
import { activeTheme } from '../../../../src/lib/theme'
import Field from '../../../../src/components/Field'
import StarRating from '../../../../src/components/StarRating'
import WeatherChips from '../../../../src/components/WeatherChips'
import type { DailyLog, PhotoRecord } from '../../../../src/types'

const EMPTY: DailyLog = {
  date: '', port: '', weather: [], highlights: '', breakfast: '', lunch: '',
  dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '',
  entertainment: '', bestMoment: '', rating: 0, isPublic: false,
}

export default function DailyDetail() {
  const t = activeTheme()
  const { day }    = useLocalSearchParams<{ day: string }>()
  const { userId } = useAuth()

  const dayNumber  = Number(day)
  const { voyage, voyageId, dailyLogs, loaded, updateDailyLog } = useVoyage({ userId })

  const log = useMemo<DailyLog>(
    () => dailyLogs[dayNumber - 1] ?? EMPTY,
    [dailyLogs, dayNumber],
  )

  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [uploading, setUploading] = useState(false)

  // Load photos for this day once we know the voyage.
  useEffect(() => {
    if (!voyageId) return
    let cancelled = false
    getPhotos(dayNumber, { voyageId })
      .then((p) => { if (!cancelled) setPhotos(p) })
      .catch((e) => console.warn('photos load', e))
    return () => { cancelled = true }
  }, [voyageId, dayNumber])

  const set = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    updateDailyLog(dayNumber, { [key]: value } as Partial<DailyLog>)
  }

  const pickPhoto = async () => {
    if (!voyageId || !userId) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission required', 'Cruise Ship Journal needs access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      const rec = await addPhoto(dayNumber, asset, { voyageId, userId })
      setPhotos((prev) => [...prev, rec])
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again later')
    } finally {
      setUploading(false)
    }
  }

  if (!loaded) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
        <View style={s.center}><ActivityIndicator color={t.primary} /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]} edges={['bottom']}>
      <Stack.Screen options={{ title: `Day ${dayNumber}${log.port ? ` · ${log.port}` : ''}` }} />
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Date + port */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Field label="Date" placeholder="YYYY-MM-DD" value={log.date}
                   onChangeText={(v) => set('date', v)} />
            <Field label="Port" placeholder="e.g. Lisbon"  value={log.port}
                   onChangeText={(v) => set('port', v)} />

            <Text style={[s.sectionLabel, { color: t.muted }]}>Weather</Text>
            <WeatherChips value={log.weather} onChange={(v) => set('weather', v)} />
          </View>

          {/* Meals */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Meals & drinks</Text>
            <Field label="Breakfast" value={log.breakfast} onChangeText={(v) => set('breakfast', v)} />
            <Field label="Lunch"     value={log.lunch}     onChangeText={(v) => set('lunch', v)} />
            <Field label="Dinner"    value={log.dinner}    onChangeText={(v) => set('dinner', v)} />
            <Field label="Drink"     value={log.drink}     onChangeText={(v) => set('drink', v)} />
          </View>

          {/* Activity / excursion */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Activity</Text>
            <Field label="What we did" value={log.activity} onChangeText={(v) => set('activity', v)} />
            <Field label="Duration"    value={log.duration} onChangeText={(v) => set('duration', v)} />
            <Field label="Excursion cost" placeholder="£0.00" keyboardType="decimal-pad"
                   value={log.excCost} onChangeText={(v) => set('excCost', v)} />
            <Field label="Excursion notes" multiline value={log.excNotes}
                   onChangeText={(v) => set('excNotes', v)} />
            <Field label="Entertainment" value={log.entertainment}
                   onChangeText={(v) => set('entertainment', v)} />
          </View>

          {/* Memory */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>The day in writing</Text>
            <Field label="Highlights" multiline value={log.highlights}
                   onChangeText={(v) => set('highlights', v)} />
            <Field label="Best moment" multiline value={log.bestMoment}
                   onChangeText={(v) => set('bestMoment', v)} />
            <Text style={[s.sectionLabel, { color: t.muted }]}>Day rating</Text>
            <StarRating value={log.rating} onChange={(n) => set('rating', n)} />
          </View>

          {/* Photo */}
          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Photos</Text>
            <Text style={[s.sub, { color: t.muted }]}>
              {photos.length} attached
            </Text>
            <Pressable
              disabled={uploading}
              onPress={pickPhoto}
              style={({ pressed }) => [
                s.photoBtn,
                { borderColor: t.primary, opacity: uploading ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[s.photoBtnText, { color: t.primary }]}>
                {uploading ? 'Uploading…' : 'Add photo'}
              </Text>
            </Pressable>
          </View>

          {/* Public toggle */}
          <View style={[s.card, s.publicRow, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={s.flex1}>
              <Text style={[s.cardTitle, { color: t.text }]}>Share to feed</Text>
              <Text style={[s.sub, { color: t.muted }]}>
                Visible to other travellers in their feed.
              </Text>
            </View>
            <Switch
              onValueChange={(v) => set('isPublic', v)}
              thumbColor={'#FFFFFF'}
              trackColor={{ false: t.border, true: t.primary }}
              value={log.isPublic}
            />
          </View>

          <View style={s.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  flex1:        { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 16, gap: 14 },
  card:         { borderRadius: 18, borderWidth: 1, padding: 18, gap: 14 },
  cardTitle:    { fontSize: 16, fontFamily: 'Georgia' },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  sub:          { fontSize: 13 },
  photoBtn:     { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderStyle: 'dashed' },
  photoBtnText: { fontSize: 14, fontWeight: '700' },
  publicRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomSpace:  { height: 40 },
})
