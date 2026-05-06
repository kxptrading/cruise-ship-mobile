# Cruise Ship Journal — Mobile

Expo + React Native + TypeScript port of [cruise-ship-journal](../cruise-ship-journal).

This is the **vertical slice**: auth, public feed, and the daily log editor. It
talks to the same Supabase project as the web app, so logging in here uses the
same account and shows the same voyages.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Expo SDK 51, React Native 0.74 |
| Language | TypeScript (strictNullChecks on, full strict off) |
| Routing | Expo Router (file-based) |
| Backend | Same Supabase project as web (`dcsfglhvdxsgueuahzyu`) |
| Auth | Supabase Auth, AsyncStorage-persisted session |
| Storage | Supabase Storage `daily-photos` bucket, signed URLs |

## First run

```bash
# 1. Install deps. Note: a partial node_modules/ may already exist from
#    scaffolding — delete it first to get a clean install.
rm -rf node_modules package-lock.json
npm install

# 2. Confirm env is set
cat .env.local        # should have EXPO_PUBLIC_SUPABASE_URL + ANON_KEY

# 3. Start the dev server
npx expo start

# 4. Open the QR code in Expo Go on your phone (iOS App Store / Play Store)
#    or press `i` for the iOS simulator, `a` for an Android emulator.
```

Sign in with the same email/password you use on the web app.

## What works in the vertical slice

- Email/password auth (sign in + sign up) against the existing Supabase project.
- Tab navigation: **Feed** / **Journal** / **Profile**.
- **Feed** — public daily logs from any user, ship name + author chip, photo
  thumbnail, weather + star rating. Pull-to-refresh.
- **Journal** — list of days for your active voyage; tap to edit.
- **Daily Log editor** — date, port, weather chips, all four meal fields,
  activity, excursion cost/notes, entertainment, highlights, best moment, star
  rating, public toggle, photo upload via `expo-image-picker`.
- **Profile** — current email, sign out.
- Theme parity with the web app's Navy & Gold palette (single theme for now —
  multi-theme switching is a follow-up).

## What's intentionally not here yet

- Other 12 journal sections (voyage details, food, dining, entertainment,
  budget, shopping, packing, highlights, notes, etc.).
- Voyage create / switch UI — the mobile app loads the most recent voyage
  for the signed-in user. To create a new voyage, use the web app for now.
- Friends / chat / social profile.
- Photo viewer / lightbox / multi-photo on a day. Currently you can upload but
  not yet manage existing photos in the editor (they're already visible in the
  Feed once the day is public).
- Push notifications, offline cache.

## Project structure

```
app/                          — Expo Router file-based routes
  _layout.tsx                 — root layout, auth gate
  (auth)/login.tsx            — email + password sign in/up
  (tabs)/                     — bottom tab nav, only visible when authed
    _layout.tsx
    index.tsx                 — Feed
    profile.tsx               — Profile
    journal/
      _layout.tsx
      index.tsx               — Day list
      daily/[day].tsx         — Daily Log editor

src/
  components/                 — reusable UI (Field, StarRating, WeatherChips, PostCard)
  hooks/
    useVoyage.ts              — active voyage + daily logs (read + debounced upsert)
    useFeed.ts                — public daily logs across users + photo URLs
  lib/
    supabase.ts               — Supabase client (AsyncStorage persistence)
    auth.tsx                  — AuthProvider + useAuth() hook
    storage.ts                — AsyncStorage cache adapter
    photoStorage.ts           — Supabase Storage upload/fetch
    converters.ts             — DB ↔ app shape converters (copied from web)
    theme.ts                  — Navy & Gold theme tokens
  constants.ts                — palette, weather chip styles, section colours
  types.ts                    — shared domain types (copied from web)
```

## Sharing code with the web app

For now `src/types.ts`, `src/lib/converters.ts`, and the converter logic are
**copied** from `cruise-ship-journal/`. When the API surface stabilises we'll
extract a shared package. Until then, if you change a converter on the web,
copy the change here too.

## Scripts

```bash
npm start              # expo start
npm run ios            # run iOS simulator
npm run android        # run Android emulator
npm run typecheck      # tsc --noEmit
```

## Known follow-ups

- [ ] Run `tsc --noEmit` after dependencies are installed; the AsyncStorage and
      Supabase types need to be present in `node_modules` to type-check cleanly.
- [ ] Add a dev/prod env split for the Supabase URL.
- [ ] Add EAS Build config (`eas.json`) for TestFlight / Play internal track.
- [ ] Configure deep links via `expo-linking` for password reset emails.
