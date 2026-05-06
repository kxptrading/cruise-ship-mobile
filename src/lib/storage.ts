// ─────────────────────────────────────────────────────────────────────────────
// lib/storage.ts — AsyncStorage-backed cache (mirrors web app's storage.ts)
//
// Same `get<T>(key, fallback)` / `set(key, value)` interface as the web,
// but async because AsyncStorage is async on RN. Used for fast-render cache
// before Supabase round-trips return.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage'

export const db = {
  async get<T>(k: string, fb: T): Promise<T> {
    try {
      const r = await AsyncStorage.getItem(k)
      return r ? (JSON.parse(r) as T) : fb
    } catch {
      return fb
    }
  },

  async set(k: string, v: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(k, JSON.stringify(v))
    } catch {
      // swallow — cache is best-effort
    }
  },

  async remove(k: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(k)
    } catch {
      // swallow
    }
  },
}
