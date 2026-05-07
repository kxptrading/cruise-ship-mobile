// Colour palette — mirrors the web app's Ocean Blue default theme.
export const OCEAN   = '#0EA5E9'
export const NAVY    = '#0369A1'
export const NAVY2   = '#0284C7'
export const GOLD    = '#F59E0B'
export const CREAM   = '#F8F9FA'
export const WHITE   = '#FFFFFF'
export const BORDER  = '#E5E7EB'
export const TEXT    = '#1C2B3A'
export const MUTED   = '#6B7280'
export const LIGHT   = '#F9FAFB'
export const TEAL    = '#10B981'
export const ROSE    = '#F97316'
export const PLUM    = '#8B5CF6'

export const SECTION_COLORS: Record<string, string> = {
  feed:          OCEAN,
  voyage:        OCEAN,
  itinerary:     TEAL,
  daily:         OCEAN,
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