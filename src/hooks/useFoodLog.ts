import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fromDbFoodLogs, toDbFoodLogs } from '../lib/converters'
import type { FoodLog } from '../types'

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export const EMPTY_FOOD: Omit<FoodLog, 'id'> = {
  day: '', date: '', meal: 'Dinner', port: '', venue: '', what: '',
  standout: '', drinks: '', notes: '', rating: 0, cost: '', orderAgain: '',
}

const DEBOUNCE = 800

export function useFoodLog({ voyageId }: { voyageId: string | null }) {
  const [entries, setEntries] = useState<FoodLog[]>([])
  const [loaded,  setLoaded]  = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<FoodLog[] | null>(null)

  useEffect(() => {
    if (!voyageId) { setLoaded(true); return }
    let cancelled = false
    supabase.from('food_logs').select('*').eq('voyage_id', voyageId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (data) setEntries(fromDbFoodLogs(data))
        else if (error) console.warn('food_logs load', error)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [voyageId])

  const flush = useCallback(async (list: FoodLog[]) => {
    if (!voyageId) return
    const { error } = await supabase
      .from('food_logs')
      .upsert(toDbFoodLogs(voyageId, list), { onConflict: 'id' })
    if (error) console.warn('food_logs upsert', error)
  }, [voyageId])

  const schedule = useCallback((next: FoodLog[]) => {
    pending.current = next
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { if (pending.current) flush(pending.current); pending.current = null }, DEBOUNCE)
  }, [flush])

  const addEntry = useCallback((): FoodLog => {
    const entry: FoodLog = { id: newId(), ...EMPTY_FOOD }
    setEntries(prev => { const next = [entry, ...prev]; schedule(next); return next })
    return entry
  }, [schedule])

  const updateEntry = useCallback((id: string, patch: Partial<FoodLog>) => {
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
      const { error } = await supabase.from('food_logs').delete().eq('id', id).eq('voyage_id', voyageId)
      if (error) console.warn('food_logs delete', error)
    }
  }, [voyageId])

  return { entries, loaded, addEntry, updateEntry, deleteEntry }
}
