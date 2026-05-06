// ─────────────────────────────────────────────────────────────────────────────
// constants.ts — Design tokens (mobile)
//
// Mobile build can't use CSS variables, so colours are concrete hex values.
// Theme switching at runtime is handled via context (see src/lib/theme.ts).
// ─────────────────────────────────────────────────────────────────────────────

// ── Default colour palette (Navy/Gold theme) ──────────────────────────────────
export const NAVY   = '#1B3A5C'
export const NAVY2  = '#14293F'
export const GOLD   = '#C9A227'
export const CREAM  = '#F4F1EB'
export const WHITE  = '#FFFFFF'
export const BORDER = '#E0DBD0'
export const TEXT   = '#1C2B3A'
export const MUTED  = '#7A8594'
export const LIGHT  = '#F9F7F3'
export const TEAL   = '#0D6B55'
export const ROSE   = '#B03060'
export const PLUM   = '#4A3B8C'

// ── Per-section accent colours ────────────────────────────────────────────────
export const SECTION_COLORS: Record<string, string> = {
  feed:          NAVY,
  voyage:        NAVY,
  itinerary:     TEAL,
  daily:         NAVY,
  food:          ROSE,
  dining:        ROSE,
  entertainment: PLUM,
  foodfav:       GOLD,
  budget:        TEAL,
  shopping:      GOLD,
  highlights:    ROSE,
  packing:       GOLD,
  notes:         PLUM,
}

// ── Weather chip data ─────────────────────────────────────────────────────────
export const WX_EMOJI: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️',
  Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️',
}

export interface WxChipStyle {
  background: string
  border:     string
  color:      string
}

export const WX_STYLE: Record<string, WxChipStyle> = {
  Sunny:  { background: '#FEF3C7', border: '#FCD34D', color: '#92400E' },
  Hot:    { background: '#FEE2E2', border: '#FCA5A5', color: '#991B1B' },
  Rainy:  { background: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
  Cloudy: { background: '#F3F4F6', border: '#D1D5DB', color: '#374151' },
  Windy:  { background: '#F1F5F9', border: '#CBD5E1', color: '#334155' },
  Mild:   { background: '#F0FDF4', border: '#86EFAC', color: '#166534' },
  Cool:   { background: '#EFF6FF', border: '#BAE6FD', color: '#0369A1' },
}
