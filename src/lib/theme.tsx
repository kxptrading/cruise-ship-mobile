import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Theme {
  primary:    string
  primaryDk:  string
  primaryMid: string
  primaryLt:  string
  accent:     string
  bg:         string
  surface:    string
  border:     string
  text:       string
  muted:      string
  light:      string
}

// Tokens shared across all themes
const N = { surface: '#FFFFFF', border: '#E5E7EB', text: '#1C2B3A', muted: '#6B7280' }

interface ThemeDef extends Theme { id: ThemeKey; label: string; emoji: string }

function mk(
  label: string, emoji: string,
  primary: string, dk: string, mid: string, lt: string,
  accent: string, bg: string,
): Omit<ThemeDef, 'id'> {
  return { label, emoji, primary, primaryDk: dk, primaryMid: mid, primaryLt: lt, accent, bg, light: bg, ...N }
}

// ── Theme definitions — mirrors web app's 24 themes ──────────────────────────

export type ThemeKey =
  | 'ocean' | 'midnight' | 'cobalt' | 'steel'
  | 'violet' | 'lavender' | 'indigo' | 'periwinkle'
  | 'rose' | 'coral' | 'blush' | 'bubblegum'
  | 'emerald' | 'teal' | 'sage' | 'forest'
  | 'sunset' | 'peach' | 'tangerine' | 'terracotta'
  | 'gold' | 'lemon' | 'amber' | 'saffron'

export const THEMES: Record<ThemeKey, ThemeDef> = {
  // Blues
  ocean:      { id: 'ocean',      ...mk('Ocean Blue',  '🌊', '#0EA5E9', '#0369A1', '#0284C7', '#38BDF8', '#F59E0B', '#F8F9FA') },
  midnight:   { id: 'midnight',   ...mk('Midnight',    '🌙', '#1D4ED8', '#1E3A8A', '#1E40AF', '#93C5FD', '#F59E0B', '#EFF6FF') },
  cobalt:     { id: 'cobalt',     ...mk('Cobalt',      '💙', '#3B82F6', '#1D4ED8', '#2563EB', '#93C5FD', '#FBBF24', '#EFF6FF') },
  steel:      { id: 'steel',      ...mk('Steel Blue',  '🩵', '#5B8DB8', '#2C5F8A', '#3D7CA8', '#96BDD8', '#F59E0B', '#F0F7FD') },
  // Purples
  violet:     { id: 'violet',     ...mk('Violet',      '💜', '#7C3AED', '#4C1D95', '#6D28D9', '#C4B5FD', '#F59E0B', '#F5F3FF') },
  lavender:   { id: 'lavender',   ...mk('Lavender',    '🪻', '#C084FC', '#7E22CE', '#9333EA', '#E9D5FF', '#F59E0B', '#FAF5FF') },
  indigo:     { id: 'indigo',     ...mk('Indigo',      '🔷', '#4F46E5', '#312E81', '#4338CA', '#A5B4FC', '#F59E0B', '#EEF2FF') },
  periwinkle: { id: 'periwinkle', ...mk('Periwinkle',  '🫐', '#8B9DC9', '#3D5A99', '#637AB0', '#BEC8E4', '#F59E0B', '#F2F4FB') },
  // Reds
  rose:       { id: 'rose',       ...mk('Rose Pink',   '🌸', '#EC4899', '#9D174D', '#BE185D', '#F9A8D4', '#F59E0B', '#FFF0F7') },
  coral:      { id: 'coral',      ...mk('Coral',       '🪸', '#F43F5E', '#9F1239', '#E11D48', '#FDA4AF', '#FBBF24', '#FFF1F2') },
  blush:      { id: 'blush',      ...mk('Blush',       '🌷', '#DB7093', '#9A2756', '#BE3E72', '#F0A8BC', '#F59E0B', '#FFF0F5') },
  bubblegum:  { id: 'bubblegum',  ...mk('Bubblegum',   '🩷', '#F472B6', '#9D174D', '#DB2777', '#FBCFE8', '#FBBF24', '#FDF2F8') },
  // Greens
  emerald:    { id: 'emerald',    ...mk('Emerald',     '🌿', '#059669', '#064E3B', '#047857', '#6EE7B7', '#F59E0B', '#F0FDF9') },
  teal:       { id: 'teal',       ...mk('Teal',        '🐚', '#0D9488', '#134E4A', '#0F766E', '#5EEAD4', '#FBBF24', '#F0FDFA') },
  sage:       { id: 'sage',       ...mk('Sage',        '🌾', '#7BAF8E', '#3D6B52', '#5A9070', '#B0D4BD', '#F59E0B', '#F2F9F5') },
  forest:     { id: 'forest',     ...mk('Forest',      '🌲', '#16A34A', '#14532D', '#15803D', '#86EFAC', '#FBBF24', '#F0FDF4') },
  // Oranges
  sunset:     { id: 'sunset',     ...mk('Sunset',      '🌅', '#F97316', '#C2410C', '#EA580C', '#FDBA74', '#FBBF24', '#FFF7ED') },
  peach:      { id: 'peach',      ...mk('Peach',       '🍑', '#E8956D', '#A34A28', '#C96A44', '#F3C4A8', '#FBBF24', '#FFF7F2') },
  tangerine:  { id: 'tangerine',  ...mk('Tangerine',   '🍊', '#EA580C', '#9A3412', '#C2410C', '#FDBA74', '#FBBF24', '#FFF7ED') },
  terracotta: { id: 'terracotta', ...mk('Terracotta',  '🏺', '#C2693A', '#7A3615', '#9F5026', '#DDA07A', '#FBBF24', '#FDF3EE') },
  // Yellows
  gold:       { id: 'gold',       ...mk('Gold',        '✨', '#D97706', '#92400E', '#B45309', '#FCD34D', '#F59E0B', '#FFFBEB') },
  lemon:      { id: 'lemon',      ...mk('Lemon',       '🍋', '#CA8A04', '#713F12', '#A16207', '#FDE047', '#D97706', '#FEFCE8') },
  amber:      { id: 'amber',      ...mk('Amber',       '🟡', '#F59E0B', '#92400E', '#B45309', '#FCD34D', '#EF4444', '#FFFBEB') },
  saffron:    { id: 'saffron',    ...mk('Saffron',     '🌻', '#EAB308', '#713F12', '#A16207', '#FDE047', '#F97316', '#FEFCE8') },
}

export const THEME_GROUPS: { label: string; ids: ThemeKey[] }[] = [
  { label: 'Blues',   ids: ['ocean', 'midnight', 'cobalt', 'steel'] },
  { label: 'Purples', ids: ['violet', 'lavender', 'indigo', 'periwinkle'] },
  { label: 'Reds',    ids: ['rose', 'coral', 'blush', 'bubblegum'] },
  { label: 'Greens',  ids: ['emerald', 'teal', 'sage', 'forest'] },
  { label: 'Oranges', ids: ['sunset', 'peach', 'tangerine', 'terracotta'] },
  { label: 'Yellows', ids: ['gold', 'lemon', 'amber', 'saffron'] },
]

// ── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:      Theme
  themeId:    ThemeKey
  themeMeta:  ThemeDef
  setThemeId: (id: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:      THEMES.ocean,
  themeId:    'ocean',
  themeMeta:  THEMES.ocean,
  setThemeId: () => {},
})

const STORAGE_KEY = '@themeId'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, set] = useState<ThemeKey>('ocean')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v && v in THEMES) set(v as ThemeKey) })
      .catch(() => {})
  }, [])

  const setThemeId = useCallback((id: ThemeKey) => {
    set(id)
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {})
  }, [])

  const meta = THEMES[themeId]
  return (
    <ThemeContext.Provider value={{ theme: meta, themeId, themeMeta: meta, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

/** Backward-compat alias — valid as a hook when called at component top level. */
export function activeTheme(): Theme {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useContext(ThemeContext).theme
}
