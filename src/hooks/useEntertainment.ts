import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fromDbEntertainmentLog, toDbEntertainmentLog } from '../lib/converters'
import type { EntertainmentEntry } from '../types'

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export const EMPTY_ENT: Omit<EntertainmentEntry, 'id'> = {
  day: '', date: '', name: '', type: 'Show', venue: '',
  performers: '', duration: '', rating: 0, notes: '',
}

const DEBOUNCE = 800

export function useEntertainment({ voyageId }: { voyageId: string | null }) {
  const [entries, setEntries] = useState<EntertainmentEntry[]>([])
  const [loaded,  setLoaded]  = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<EntertainmentEntry[] | null>(null)

  useEffect(() => {
    if (!voyageId) { setLoaded(true); return }
    let cancelled = false
    supabase.from('entertainment_log').select('*').eq('voyage_id', voyageId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (data) setEntries(fromDbEntertainmentLog(data))
        else if (error) console.warn('entertainment_log load', error)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [voyageId])

  const flush = useCallback(async (list: EntertainmentEntry[]) => {
    if (!voyageId) return
    const { error } = await supabase
      .from('entertainment_log')
      .upsert(toDbEntertainmentLog(voyageId, list), { onConflict: 'id' })
    if (error) console.warn('entertainment_log upsert', error)
  }, [voyageId])

  const schedule = useCallback((next: EntertainmentEntry[]) => {
    pending.current = next
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { if (pending.current) flush(pending.current); pending.current = null }, DEBOUNCE)
  }, [flush])

  const addEntry = useCallback((): EntertainmentEntry => {
    const entry: EntertainmentEntry = { id: newId(), ...EMPTY_ENT }
    setEntries(prev => { const next = [entry, ...prev]; schedule(next); return next })
    return entry
  }, [schedule])

  const updateEntry = useCallback((id: string, patch: Partial<EntertainmentEntry>) => {
    setEntries(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...patch } : e)
      schedule(next)
      return next
    })
  }, [schedule])

  const deleteEntry = useCallback(async (id: string) => {
    if (timer.current) clearTimeout(timer.current)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (voyageId) {
      const { error } = await supabase.from('entertainment_log').delete().eq('id', id).eq('voyage_id', voyageId)
      if (error) console.warn('entertainment_log delete', error)
    }
  }, [voyageId])

  return { entries, loaded, addEntry, updateEntry, deleteEntry }
}
