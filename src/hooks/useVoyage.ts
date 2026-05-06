// ─────────────────────────────────────────────────────────────────────────────
// hooks/useVoyage.ts — Active voyage + daily logs (mobile vertical slice)
//
// Slimmer than the web app's useVoyageData: it loads only the voyage
// metadata, the per-day daily_logs rows, and the photos table. Other
// sections (food, budget, packing, etc.) will be added screen-by-screen.
//
// Write strategy mirrors the web app: debounced upsert keyed by
// (voyage_id, day_number), so editing the same day repeatedly hits one row.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fromDbDailyLogs, toDbDailyLogs, fromDbVoyage } from '../lib/converters'
import type { DailyLog, Voyage, VoyageListRow } from '../types'

const VOYAGE_SELECT =
  'id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url'

const FULL_VOYAGE_SELECT = `
  id, user_id, ship_name, cruise_line, cabin, deck, departure_date, return_date,
  departure_port, total_nights, companion_1, companion_2, companion_3, companion_4,
  emergency_contact, phone, guest_services, muster_station, dining_time, cover_photo_url
`

interface Options {
  userId: string | null
}

interface UseVoyageReturn {
  voyageId:    string | null
  voyage:      Voyage | null
  dailyLogs:   DailyLog[]
  allVoyages:  VoyageListRow[]
  loaded:      boolean
  switchVoyage: (id: string) => void
  updateDailyLog: (dayNumber: number, patch: Partial<DailyLog>) => void
  refresh:     () => Promise<void>
}

const DEBOUNCE_MS = 600

export function useVoyage({ userId }: Options): UseVoyageReturn {
  const [voyageId,   setVoyageId]   = useState<string | null>(null)
  const [voyage,     setVoyage]     = useState<Voyage | null>(null)
  const [dailyLogs,  setDailyLogs]  = useState<DailyLog[]>([])
  const [allVoyages, setAllVoyages] = useState<VoyageListRow[]>([])
  const [loaded,     setLoaded]     = useState(false)

  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending    = useRef<DailyLog[] | null>(null)

  // ── Voyage list + active voyage selection ───────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setLoaded(true)
      return
    }

    let cancelled = false

    ;(async () => {
      const { data: rows, error } = await supabase
        .from('voyages')
        .select(VOYAGE_SELECT)
        .eq('user_id', userId)
        .order('departure_date', { ascending: false })

      if (cancelled) return
      if (error) {
        console.warn('voyages list error', error)
        setLoaded(true)
        return
      }

      const list = (rows ?? []) as VoyageListRow[]
      setAllVoyages(list)
      if (list.length > 0) {
        setVoyageId(list[0].id)
      } else {
        setLoaded(true)
      }
    })()

    return () => { cancelled = true }
  }, [userId])

  // ── Load a voyage + its daily logs whenever voyageId flips ──────────────────
  useEffect(() => {
    if (!voyageId) return

    let cancelled = false

    ;(async () => {
      const [voyageRes, dailyRes] = await Promise.all([
        supabase.from('voyages').select(FULL_VOYAGE_SELECT).eq('id', voyageId).single(),
        supabase
          .from('daily_logs')
          .select('*')
          .eq('voyage_id', voyageId)
          .order('day_number', { ascending: true }),
      ])

      if (cancelled) return

      if (voyageRes.data) setVoyage(fromDbVoyage(voyageRes.data))
      if (dailyRes.data)  setDailyLogs(fromDbDailyLogs(dailyRes.data))

      setLoaded(true)
    })()

    return () => { cancelled = true }
  }, [voyageId])

  // ── Debounced upsert for daily logs ─────────────────────────────────────────
  const flushDailyLogs = useCallback(async () => {
    if (!voyageId || !pending.current) return
    const rows = toDbDailyLogs(voyageId, pending.current)
    pending.current = null

    const { error } = await supabase
      .from('daily_logs')
      .upsert(rows, { onConflict: 'voyage_id,day_number' })

    if (error) console.warn('daily_logs upsert error', error)
  }, [voyageId])

  const updateDailyLog = useCallback((dayNumber: number, patch: Partial<DailyLog>) => {
    setDailyLogs((prev) => {
      const idx  = dayNumber - 1
      const next = prev.slice()
      const cur  = next[idx] ?? ({} as DailyLog)
      next[idx]  = { ...cur, ...patch }
      pending.current = next

      if (writeTimer.current) clearTimeout(writeTimer.current)
      writeTimer.current = setTimeout(flushDailyLogs, DEBOUNCE_MS)

      return next
    })
  }, [flushDailyLogs])

  const refresh = useCallback(async () => {
    if (!voyageId) return
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('voyage_id', voyageId)
      .order('day_number', { ascending: true })
    if (data) setDailyLogs(fromDbDailyLogs(data))
  }, [voyageId])

  return {
    voyageId,
    voyage,
    dailyLogs,
    allVoyages,
    loaded,
    switchVoyage: setVoyageId,
    updateDailyLog,
    refresh,
  }
}
