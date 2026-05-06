// ─────────────────────────────────────────────────────────────────────────────
// hooks/useFeed.ts — Public daily logs from all voyages (mobile feed)
//
// Reads daily_logs WHERE is_public = true, joins to voyages + profiles
// to render an author chip on each post, and resolves the cover photo for
// each log via the photos table + signed URLs.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSignedUrls } from '../lib/photoStorage'
import { fromDbDailyLogs } from '../lib/converters'
import type { FeedItem, FeedAuthor } from '../types'

interface UseFeedReturn {
  items:    FeedItem[]
  loading:  boolean
  refresh:  () => Promise<void>
}

interface DailyLogRow {
  id:                 string
  voyage_id:          string
  user_id:            string
  day_number:         number
  date:               string | null
  port:               string | null
  weather:            string[] | null
  highlights:         string | null
  breakfast:          string | null
  lunch:              string | null
  dinner:             string | null
  drink:              string | null
  activity:           string | null
  duration:           string | null
  exc_cost:           string | null
  exc_notes:          string | null
  entertainment:      string | null
  best_moment:        string | null
  rating:             number | null
}

interface VoyageMini { id: string; ship_name: string | null }
interface ProfileMini { user_id: string; display_name: string | null; avatar_url: string | null }
interface PhotoMini   { voyage_id: string; day_number: number; storage_path: string; caption: string | null }

function initialsFor(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function useFeed(): UseFeedReturn {
  const [items, setItems]     = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    // 1. public daily_logs
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
    const userIds   = Array.from(new Set(rows.map(r => r.user_id)))

    // 2. ship names + author profiles + first photo per (voyage, day) — in parallel
    const [voyagesRes, profilesRes, photosRes] = await Promise.all([
      supabase.from('voyages').select('id, ship_name').in('id', voyageIds),
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('photos')
        .select('voyage_id, day_number, storage_path, caption')
        .in('voyage_id', voyageIds),
    ])

    const voyages  = (voyagesRes.data  ?? []) as VoyageMini[]
    const profiles = (profilesRes.data ?? []) as ProfileMini[]
    const photos   = (photosRes.data   ?? []) as PhotoMini[]

    const voyageMap  = new Map(voyages.map(v  => [v.id, v]))
    const profileMap = new Map(profiles.map(p => [p.user_id, p]))

    // pick first photo per (voyage_id, day_number)
    const photoMap = new Map<string, PhotoMini>()
    for (const p of photos) {
      const key = `${p.voyage_id}-${p.day_number}`
      if (!photoMap.has(key)) photoMap.set(key, p)
    }
    const urlMap = await getSignedUrls(Array.from(photoMap.values()).map(p => p.storage_path))

    // 3. assemble feed items
    const built: FeedItem[] = rows.map((row) => {
      const [log] = fromDbDailyLogs([row])
      const ship   = voyageMap.get(row.voyage_id)
      const prof   = profileMap.get(row.user_id)
      const photo  = photoMap.get(`${row.voyage_id}-${row.day_number}`)

      const author: FeedAuthor = {
        name:      prof?.display_name ?? 'Unknown traveller',
        avatarUrl: prof?.avatar_url ?? '',
        initials:  initialsFor(prof?.display_name),
        shipName:  ship?.ship_name ?? '',
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
