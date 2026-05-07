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

/** Ocean Blue — mirrors the web app's default theme. */
export const ocean: Theme = {
  primary:    '#0EA5E9',
  primaryDk:  '#0369A1',
  primaryMid: '#0284C7',
  primaryLt:  '#38BDF8',
  accent:     '#F59E0B',
  bg:         '#F8F9FA',
  surface:    '#FFFFFF',
  border:     '#E5E7EB',
  text:       '#1C2B3A',
  muted:      '#6B7280',
  light:      '#F9FAFB',
}

export function activeTheme(): Theme {
  return ocean
}
