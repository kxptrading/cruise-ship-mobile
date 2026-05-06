// ─────────────────────────────────────────────────────────────────────────────
// lib/supabase.ts — Supabase client for React Native
//
// Differences from the web app's client:
//   • Uses AsyncStorage instead of localStorage for session persistence
//   • Disables URL session detection (RN has no URL bar; deep links go via
//     expo-linking and are handled at the auth screen level)
//   • Reads env via process.env.EXPO_PUBLIC_* (Expo's runtime convention)
// ─────────────────────────────────────────────────────────────────────────────

import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars.\n' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
