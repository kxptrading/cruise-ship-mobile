import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fromDbNotes, toDbNotes } from '../lib/converters'
import type { Note } from '../types'

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

interface UseNotesReturn {
  notes:      Note[]
  loaded:     boolean
  addNote:    () => Note
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void
  deleteNote: (id: string) => Promise<void>
}

const DEBOUNCE_MS = 800

export function useNotes({ voyageId }: { voyageId: string | null }): UseNotesReturn {
  const [notes,  setNotes]  = useState<Note[]>([])
  const [loaded, setLoaded] = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Note[] | null>(null)

  useEffect(() => {
    if (!voyageId) { setLoaded(true); return }
    let cancelled = false
    supabase
      .from('notes')
      .select('id, title, content')
      .eq('voyage_id', voyageId)
      .order('id')
      .then(({ data, error }) => {
        if (cancelled) return
        if (data) setNotes(fromDbNotes(data))
        else if (error) console.warn('notes load', error)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [voyageId])

  const flush = useCallback(async (list: Note[]) => {
    if (!voyageId) return
    const { error } = await supabase
      .from('notes')
      .upsert(toDbNotes(voyageId, list), { onConflict: 'id' })
    if (error) console.warn('notes upsert', error)
  }, [voyageId])

  const schedule = useCallback((next: Note[]) => {
    pending.current = next
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (pending.current) flush(pending.current)
      pending.current = null
    }, DEBOUNCE_MS)
  }, [flush])

  const addNote = useCallback((): Note => {
    const note: Note = { id: newId(), title: '', content: '' }
    setNotes(prev => {
      const next = [...prev, note]
      schedule(next)
      return next
    })
    return note
  }, [schedule])

  const updateNote = useCallback((id: string, patch: Partial<Omit<Note, 'id'>>) => {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...patch } : n)
      schedule(next)
      return next
    })
  }, [schedule])

  const deleteNote = useCallback(async (id: string) => {
    if (timer.current) clearTimeout(timer.current)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (voyageId) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('voyage_id', voyageId)
      if (error) console.warn('notes delete', error)
    }
  }, [voyageId])

  return { notes, loaded, addNote, updateNote, deleteNote }
}
