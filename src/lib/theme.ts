// ─────────────────────────────────────────────────────────────────────────────
// lib/theme.ts — Theme tokens (mobile)
//
// The web app drives 20 themes via CSS custom properties. RN doesn't support
// CSS variables, so each theme is a static object. For the first release we
// ship a single "Navy & Gold" theme — multi-theme switching can come later
// via a ThemeContext.
// ─────────────────────────────────────────────────────────────────────────────

export interface Theme {
  primary:    string
  primaryDk:  string
  accent:     string
  bg:         string
  surface:    string
  border:     string
  text:       string
  muted:      string
  light:      string
}

export const navyGold: Theme = {
  primary:    '#1B3A5C',
  primaryDk:  '#14293F',
  accent:     '#C9A227',
  bg:         '#F4F1EB',
  surface:    '#FFFFFF',
  border:     '#E0DBD0',
  text:       '#1C2B3A',
  muted:      '#7A8594',
  light:      '#F9F7F3',
}

/** Single source of truth for the active theme. Kept as a function so a
 *  future ThemeContext can swap implementations without touching consumers. */
export function activeTheme(): Theme {
  return navyGold
}
