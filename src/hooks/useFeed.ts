import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSignedUrls } from '../lib/photoStorage'
import { fromDbDailyLogs } from '../lib/converters'
import type { FeedItem, FeedAuthor } from '../types'

interface UseFeedReturn {
  items:   FeedItem[]
  loading: boolean
  refresh: () => Promise<void>
}

interface DailyLogRow {
  voyage_id:     string
  day_number:    number
  date:          string | null
  port:          string | null
  weather:       string[] | null
  highlights:    string | null
  breakfast:     string | null
  lunch:         string | null
  dinner:        string | null
  drink:         string | null
  activity:      string | null
  duration:      string | null
  exc_cost:      string | null
  exc_notes:     string | null
  entertainment: string | null
  best_moment:   string | null
  rating:        number | null
}

interface VoyageRow  { id: string; user_id: string; ship_name: string | null }
interface ProfileRow { id: string; display_name: string | null; avatar_url: string | null }
interface PhotoRow   { voyage_id: string; day_number: number; storage_path: string; caption: string | null }

function initialsFor(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export function useFeed(): UseFeedReturn {
  const [items,   setItems]   = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    // 1. Public daily logs
    const { data: logs, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('is_public', true)
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.warn('feed load error', error)
      setLoading(false)
      return
    }

    const rows = (logs ?? []) as DailyLogRow[]
    if (rows.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const voyageIds = Array.from(new Set(rows.map(r => r.voyage_id)))

    // 2. Voyages (for ship name + user_id) and photos in parallel
    const [voyagesRes, photosRes] = await Promise.all([
      supabase.from('voyages').select('id, user_id, ship_name').in('id', voyageIds),
      supabase.from('photos').select('voyage_id, day_number, storage_path, caption').in('voyage_id', voyageIds),
    ])

    const voyages = (voyagesRes.data ?? []) as VoyageRow[]
    const photos  = (photosRes.data  ?? []) as PhotoRow[]

    // 3. Profiles — keyed by the auth user id (profiles.id = auth.users.id)
    const userIds = Array.from(new Set(voyages.map(v => v.user_id).filter(Boolean)))
    let profiles: ProfileRow[] = []
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)
      profiles = (data ?? []) as ProfileRow[]
    }

    // Build lookup maps
    const voyageMap  = new Map(voyages.map(v  => [v.id,      v]))
    const profileMap = new Map(profiles.map(p => [p.id,      p]))

    // First photo per (voyage_id, day_number)
    const photoMap = new Map<string, PhotoRow>()
    for (const p of photos) {
      const key = `${p.voyage_id}-${p.day_number}`
      if (!photoMap.has(key)) photoMap.set(key, p)
    }
    const urlMap = await getSignedUrls(Array.from(photoMap.values()).map(p => p.storage_path))

    // 4. Assemble feed items
    const built: FeedItem[] = rows.map((row) => {
      const [log]  = fromDbDailyLogs([row])
      const voyage = voyageMap.get(row.voyage_id)
      const prof   = voyage ? profileMap.get(voyage.user_id) : undefined
      const photo  = photoMap.get(`${row.voyage_id}-${row.day_number}`)

      const author: FeedAuthor = {
        name:      prof?.display_name || 'Traveller',
        avatarUrl: prof?.avatar_url ?? '',
        initials:  initialsFor(prof?.display_name),
        shipName:  voyage?.ship_name ?? '',
      }

      return {
        ...log,
        dayIndex:     row.day_number - 1,
        dayNumber:    row.day_number,
        voyageId:     row.voyage_id,
        resolvedPort: log.port,
        photo:        photo
          ? { dataUrl: urlMap[photo.storage_path] ?? '', caption: photo.caption ?? '' }
          : null,
        author,
      }
    })

    setItems(built)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { items, loading, refresh: load }
}
