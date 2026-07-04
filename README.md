# Tally

A calm, minimal daily calorie tracker. Log what you eat in two taps, watch the
day's total tick up, and let history collect itself.

Beyond the basics: an optional **daily goal** wraps the total in a progress
ring (green under target, calm amber over — never red), a **Menu** of your
saved staples logs the things you eat every day in one tap (with optional
protein and a small monochrome category icon per item — pinned favourites surface as chips on Today), **quick-add
chips** also learn your habitual entries automatically, deletions get a
5-second **undo**, entries are **tap-to-edit**, and the added amount visibly
flies into the total with a small "Logged ✓" confirmation. Installable as a
**PWA** with offline support.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm test         # unit tests (day-boundary logic, validation, grouping)
```

## How days work — the 2 AM boundary

A "day" in Tally starts at **2:00 AM local time**, not midnight. A snack at
1:15 AM counts toward the evening before, which is how most people actually
think about late nights. The rule lives in one place —
`src/lib/day.ts` (`trackingDayFor`) — and is covered by unit tests in
`src/lib/day.test.ts`, including month/year/leap-day rollovers. The UI also
rolls itself over automatically if it's open when 2 AM passes.

## Architecture

- **React + TypeScript + Vite**, no UI framework — the design system is
  ~600 lines of hand-written CSS (`src/styles.css`) with light/dark themes
  via `prefers-color-scheme`.
- **Persistence** is localStorage behind a small repository
  (`src/lib/store.ts`). The payload is versioned (`{ version, entries }`) so
  the engine can be swapped for IndexedDB or a synced backend, and new fields
  (protein, weight, goals) can be added without breaking old data.
- **Entries** are flat records: `id`, `calories`, `description`, `timestamp`,
  and the precomputed tracking `day` — so history grouping is a pure
  aggregation and never re-derives boundaries from raw timestamps.
- **State** flows through one hook (`src/hooks/useEntries.ts`): load, persist,
  cross-tab sync, and the 2 AM rollover timer.
- **Settings** (the daily goal) live in their own versioned localStorage key
  (`src/lib/settings.ts`), separate from entry data.
- **Menu items** (`src/lib/menu.ts`) get their own versioned key too; quick-add
  chips are pinned menu items merged with auto-learned frequents, deduped.
  Entries optionally carry `protein` grams — the model's first extra macro.
- **PWA**: `public/manifest.webmanifest` + a small hand-written service worker
  (`public/sw.js`) — cache-first for hashed assets, network-first navigations
  with an offline fallback.
- **Durability** (`src/lib/mirror.ts`): localStorage stays the synchronous
  source of truth, but every write is mirrored to Capacitor Preferences
  (SharedPreferences on Android — included in Android auto-backup, unlike
  WebView storage). If WebView data is ever wiped, the app restores from the
  mirror on launch.
- **Backup** (`src/lib/backup.ts`): the History screen can export everything
  as one JSON file and import it back; imports merge by id, so restoring an
  old backup never duplicates data.

```
src/
  lib/        day boundary, storage, validation, formatting  (+ tests)
  hooks/      useEntries — single source of truth
  components/ Today screen, History screen, chart, list, form
```

## Android app (no app store needed)

The same code ships as a native Android app via Capacitor (`android/`),
alongside the PWA.

**Getting the APK:** every push runs the "Android APK" GitHub Actions
workflow, which builds a signed release APK. Open the repo's **Actions** tab →
latest run → download the `tally-release-apk` artifact, copy it to your phone,
and open it (allow "install unknown apps" for your browser/file manager when
prompted). Pushing a `v*` tag also attaches the APK to a GitHub Release for a
cleaner download link.

**Signing:** the keystore in `android/keystore/` is a committed personal
sideload key — deliberate, so every CI build has the same signature and
updates install over the old version. Never reuse it for store distribution.
CI or a local build can swap in a private keystore via the
`TALLY_KEYSTORE_FILE` / `TALLY_KEYSTORE_PASSWORD` / `TALLY_KEY_ALIAS` /
`TALLY_KEY_PASSWORD` environment variables.

**Local build** (requires the Android SDK):

```sh
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

## Validation

Calorie input accepts `500`, `+500`, or `1,200`; rejects zero, negatives,
non-numbers, and anything over 20,000 with an inline error and a gentle shake.
Decimals are rounded to whole calories.
