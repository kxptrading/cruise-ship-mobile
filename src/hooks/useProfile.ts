import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Profile {
  displayName:         string
  email:               string
  homePort:            string
  favouriteCruiseLine: string
  avatarUrl:           string
  bannerUrl:           string
  cabinPreference:     string
  diningTime:          string
  dietary:             string
  currency:            string
  units:               string
  theme:               string
  trait1:              string
  trait2:              string
  trait3:              string
  trait4:              string
}

const DEFAULTS: Profile = {
  displayName:         '',
  email:               '',
  homePort:            '',
  favouriteCruiseLine: '',
  avatarUrl:           '',
  bannerUrl:           '',
  cabinPreference:     '',
  diningTime:          '',
  dietary:             '',
  currency:            'GBP',
  units:               'Metric',
  theme:               '',
  trait1:              '',
  trait2:              '',
  trait3:              '',
  trait4:              '',
}

function fromDb(row: Record<string, unknown>): Profile {
  return {
    displayName:         String(row.display_name          ?? ''),
    email:               String(row.email                 ?? ''),
    homePort:            String(row.home_port             ?? ''),
    favouriteCruiseLine: String(row.favourite_cruise_line ?? ''),
    avatarUrl:           String(row.avatar_url            ?? ''),
    bannerUrl:           String(row.banner_url            ?? ''),
    cabinPreference:     String(row.cabin_preference      ?? ''),
    diningTime:          String(row.dining_time           ?? ''),
    dietary:             String(row.dietary               ?? ''),
    currency:            String(row.currency   ?? 'GBP'),
    units:               String(row.units      ?? 'Metric'),
    theme:               String(row.theme      ?? ''),
    trait1:              String(row.trait_1    ?? ''),
    trait2:              String(row.trait_2    ?? ''),
    trait3:              String(row.trait_3    ?? ''),
    trait4:              String(row.trait_4    ?? ''),
  }
}

function toDb(patch: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.displayName         !== undefined) row.display_name          = patch.displayName
  if (patch.email               !== undefined) row.email                 = patch.email
  if (patch.homePort            !== undefined) row.home_port             = patch.homePort
  if (patch.favouriteCruiseLine !== undefined) row.favourite_cruise_line = patch.favouriteCruiseLine
  if (patch.avatarUrl           !== undefined) row.avatar_url            = patch.avatarUrl
  if (patch.bannerUrl           !== undefined) row.banner_url            = patch.bannerUrl
  if (patch.cabinPreference     !== undefined) row.cabin_preference      = patch.cabinPreference
  if (patch.diningTime          !== undefined) row.dining_time           = patch.diningTime
  if (patch.dietary             !== undefined) row.dietary               = patch.dietary
  if (patch.currency !== undefined) row.currency = patch.currency
  if (patch.units    !== undefined) row.units    = patch.units
  if (patch.theme    !== undefined) row.theme    = patch.theme
  if (patch.trait1   !== undefined) row.trait_1  = patch.trait1
  if (patch.trait2   !== undefined) row.trait_2  = patch.trait2
  if (patch.trait3   !== undefined) row.trait_3  = patch.trait3
  if (patch.trait4   !== undefined) row.trait_4  = patch.trait4
  return row
}

interface UseProfileReturn {
  profile:       Profile
  loaded:        boolean
  updateProfile: (patch: Partial<Profile>) => void
}

const DEBOUNCE_MS = 800

export function useProfile({ userId }: { userId: string | null }): UseProfileReturn {
  const [profile, setProfile] = useState<Profile>(DEFAULTS)
  const [loaded,  setLoaded]  = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Partial<Profile>>({})

  useEffect(() => {
    if (!userId) { setLoaded(true); return }
    let cancelled = false
    supabase.from('profiles').select('*').eq('user_id', userId).single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (data) setProfile(fromDb(data as Record<string, unknown>))
        else if (error?.code !== 'PGRST116') console.warn('profile load', error)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [userId])

  const flush = useCallback(async () => {
    if (!userId || !Object.keys(pending.current).length) return
    const patch = { ...pending.current }
    pending.current = {}
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...toDb(patch) }, { onConflict: 'user_id' })
    if (error) console.warn('profile upsert', error)
  }, [userId])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...patch }))
    pending.current = { ...pending.current, ...patch }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, DEBOUNCE_MS)
  }, [flush])

  return { profile, loaded, updateProfile }
}
