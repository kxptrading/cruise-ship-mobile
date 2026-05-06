// ─────────────────────────────────────────────────────────────────────────────
// app/(auth)/_layout.tsx — Stack for the unauthenticated flow
// ─────────────────────────────────────────────────────────────────────────────

import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
