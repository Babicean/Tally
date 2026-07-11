# Tally — agent onboarding

Tally is a calm, minimal, Apple-inspired daily calorie tracker: React web
app wrapped in Capacitor, shipped as an Android APK (sideload), an iOS
TestFlight build, and an installable PWA. One person owns it (Babicean);
agents do the building. This file is the map. Read it before touching
anything.

There is a sibling app, **Reps** (workout tracker, `Babicean/Reps`),
forked from this codebase with the same conventions. This repo is Tally
only.

## The rules that must never break

1. **Never push to `main`.** It also publishes the rolling "latest" APK
   and it is STALE — pushing it would replace the current app with old
   code. All work lands on **`claude/tally-delighters`** (the release
   branch; every push publishes). `claude/tally-sync` publishes the beta
   channel. `stable-pre-sync` is a frozen revert point.
2. **Version ritual on every app-visible release** (all four, always):
   `package.json` version; `android/app/build.gradle` `versionName` and
   `versionCode` (**+1 every release, no exceptions**); iOS
   `MARKETING_VERSION` (two occurrences in
   `ios/App/App.xcodeproj/project.pbxproj`); a new `CHANGELOG.md`
   section (`## X.Y.Z — code N — date`, newest first). Docs/CI-only
   commits skip the bump.
3. **Secrets.** The committed `keystore/tally-release.keystore` is a
   public sideload key, on purpose — never use it for Play. The Play
   upload keystore lives ONLY in GitHub secrets (`PLAY_UPLOAD_*`). The
   Supabase URL + publishable key in `src/lib/syncConfig.ts` are public
   by design. The Supabase `service_role` key must never appear in the
   repo, CI, chat, or the app. The App Store Connect API `.p8` lives
   only in Codemagic.
4. **Owner's voice.** No em dashes in user-facing copy (app UI,
   account/auth screens). No AI-sounding marketing prose. When the owner
   quotes exact wording, use it verbatim — he has corrected paraphrases
   more than once. Copy is brief, accurate, lowercase-calm.
5. **Privacy promise** (docs/PRIVACY.md is the policy): without an
   account nothing leaves the device; with one, only email + the backup
   payload, gone instantly on account deletion. Don't add telemetry,
   analytics, or third-party services.

## Product, in one pass

Three tabs: **Today** (hero ring of calories against an optional goal —
green under, calm amber over, never red; quick-add chips learned from
habit; two-tap logging; entries tap-to-edit, 5-second undo, backdating),
**Menu** (saved foods with optional protein/fat and a category icon;
pinned items become Today chips; **Meals** bundle menu items and log as
one summed entry), **History** (day list, trend chart, weekly recap,
logging streak with particle celebration, weight card, export/import).

Opt-in extras (Settings gear): **protein/fat tracking** ("Track
macros"), **daily protein target** with its own bar and a fire-emoji
celebration on hitting it, **weight tracking** (one weigh-in a day,
logged from the History weight card, ~60-point SVG trend, 30-day
change), theme System/Light/Dark, accent Azure/Emerald.

**Accounts (optional)**: email+password via Supabase; verified email
required; backup = the export JSON pushed to one row per user;
auto-backup (60s settle after any change, immediate flush on
backgrounding); restore merges union-by-id with local winning, and an
account restore also applies settings/theme; two-tap delete truly
deletes server-side. Forgot-password emails to a hosted reset page.

**One-time landing page** (v2.8+): fresh installs only — logo lockup,
verbatim owner copy, "Start tallying" plays the tally-strokes delighter
(the icon's four bars + slash draw in, haptic tick per stroke, fade into
Today), plus an "Already have an account? Log in" path straight into
the account form. Existing installs are silently marked welcomed —
updates must never show it (`src/lib/welcome.ts` decides; flag is
mirrored).

**The 2 AM day boundary**: a "day" starts at 02:00 local, so a 1 a.m.
snack belongs to the evening before. Single source of truth
`trackingDayFor` in `src/lib/day.ts`; entries store their precomputed
`day` so aggregation never re-derives it. The UI rolls over live at 2 AM.

## Design system (src/styles.css, ~2,600 lines, hand-written)

- **No UI framework, no CSS framework, no component library.** Inter
  variable font. Everything keys off CSS custom properties defined at
  `:root`: `--bg --card --card-press --ink --ink-2 --ink-3 --accent
  --accent-strong --accent-ink --accent-soft --danger --warn --hairline
  --shadow-card --shadow-float --blur-bg --focus-ring`.
- **Themes**: light (porcelain #f5f6f8) and **Graphite dark** (bg
  #0c0d10, card #1e2126, hairline at 0.09 alpha, inset top light-catch
  shadows) via `prefers-color-scheme` plus `data-theme` override on
  `<html>`. Accent families: Azure (default) and Emerald via
  `data-accent`. Never hardcode colors in components; use the tokens.
- **Proportional scaling**: root font is
  `clamp(13.5px, 3.8835vw, 16.7px)` — 16px at the 412px reference
  width. EVERYTHING is in rem, so one design scales to every phone.
  New CSS must follow (px only for sub-pixel hairlines).
- **Safe areas**: `--sat`/`--sab` wrap Android 15 injected vars with
  `env(safe-area-inset-*)` fallbacks (that fallback chain is what makes
  iPhones work). Fixed/bottom UI must include them.
- **Feel**: bottom sheets (`Sheet.tsx`) with swipe-to-dismiss, 200–400ms
  cubic-bezier motion, `prefers-reduced-motion` respected everywhere,
  haptics via `haptic()` in `src/lib/fly.ts` (no-op on iOS for now),
  delighters small and rare (wordmark spin easter egg, streak burst,
  protein fire, tally strokes). Calm > flashy; nothing shouts.

## Architecture

React 18 + TypeScript + Vite; Capacitor 8 wraps the built `dist/` for
Android and iOS (iOS uses **SPM, not CocoaPods**). No router, no state
library, no backend SDK — the biggest JS dependency is React itself.

- **Persistence**: localStorage, versioned payloads
  (`{version, ...}`), one key per concern: `tally.store` (entries),
  `tally.menu`, `tally.settings`, `tally.session` (auth tokens),
  `tally.weights`, `tally.welcomed`. Every write is mirrored to
  Capacitor Preferences (`src/lib/mirror.ts`, `MIRRORED_KEYS`) and
  restored at boot if the WebView wiped storage — new persistent keys
  MUST be added to `MIRRORED_KEYS` and to the backup format if they're
  user data.
- **State hub**: `src/hooks/useEntries.ts` — loads everything, persists
  on change, cross-tab sync, 2 AM rollover timer, and exposes every
  mutation the UI uses. `App.tsx` wires it into the three screens plus
  `SettingsSheet` and `Welcome`.
- **Backup format** (`src/lib/backup.ts`): the export JSON is ALSO the
  sync payload — one format everywhere. `parseBackup` is tolerant
  (filters invalid rows), `mergeBackup` unions by id with local
  winning; weights merge by day, local wins. Extending the format:
  optional field + default, keep old files importable.
- **Sync client** (`src/lib/sync.ts`): dependency-free fetch wrapper
  over Supabase GoTrue (`/auth/v1/*`) and PostgREST (`/rest/v1/*`).
  Sessions auto-refresh 60s before expiry (`freshSession`); backup push
  is an upsert on `user_id` with `keepalive: true` so backgrounding
  doesn't lose it; `friendlyAuthProblem` maps server error codes to
  human copy; `deleteAccount` calls the `delete_account()` RPC.
  `useAutoBackup.ts` debounces pushes (60s settle, flush on
  `visibilitychange→hidden`, silent failures retry on next change).
- **Server** (docs/SYNC.md): Supabase free tier, Sydney. One table
  `public.backups(user_id uuid PK → auth.users ON DELETE CASCADE,
  payload jsonb, updated_at)` with RLS limiting every op to
  `auth.uid() = user_id`, no delete policy; `delete_account()` is a
  security-definer function granted to `authenticated`. No SQL from the
  client, parameterized REST only. Email verification/reset pages are
  static files in `docs/` served by GitHub Pages; branded email
  templates in `docs/emails/` get pasted into the Supabase dashboard.
- **Native chrome**: `src/lib/theme.ts` stamps `data-theme`/`data-accent`
  and syncs the Android status bar; `capacitor.config.ts` sets the
  Keyboard plugin to iOS `resize: native` (bottom sheets ride above the
  keyboard). `index.html` locks viewport zoom (iOS input-focus zoom).

### File map (src/)

- `lib/day.ts` — 2 AM boundary; `lib/store.ts` — entry records +
  validation + grouping; `lib/menu.ts` — menu/meals; `lib/weight.ts` —
  weigh-ins; `lib/settings.ts` — preferences; `lib/streak.ts`,
  `lib/stats.ts` — derived numbers; `lib/format.ts` — display helpers;
  `lib/account.ts` — email/password validation + typo suggestions;
  `lib/welcome.ts` — landing-page gate; `lib/fly.ts` — fly-to-total
  animation + haptic; `lib/burst.ts` — particle celebrations;
  `lib/exportFile.ts` — native share/export; `lib/theme.ts`,
  `lib/mirror.ts`, `lib/sync.ts`, `lib/syncConfig.ts`, `lib/backup.ts`
  — described above.
- `components/` — one file per screen or sheet. `Sheet.tsx` is the
  bottom-sheet primitive every dialog uses. `SettingsSheet.tsx` (~800
  lines) contains the whole account panel (drill navigation, login /
  create / verify-wait / logged-in states). `Welcome.tsx` is the
  landing page + tally-strokes delighter.
- Tests live next to the code: `src/lib/*.test.ts`, pure-function only
  (vitest, node env, no DOM). 62 tests at last count. UI logic that
  needs testing gets extracted into a pure lib function first (see
  `welcomeDecision`).

## Verification culture (do this, the owner expects it)

- `npm test` and `npm run build` green before every commit.
- Real-flow proof over claims: run `npx vite preview --port 4173
  --strictPort` (launch with `setsid nohup … &` or it dies with the
  shell; it also dies on rebuild — restart it), drive the built app
  with Playwright (chromium at `/opt/pw-browsers/chromium`), assert the
  flow, and screenshot for the owner. Supabase is UNREACHABLE from the
  sandbox (proxy 403) — stub `**/auth/v1/**` and `**/rest/v1/**` with
  `page.route`; live auth is field-tested on the owner's phone.
- Animations: capture deterministically by starting the animation, then
  scrubbing `document.getAnimations()` (`pause()` +
  `currentTime = t`) frame by frame; assemble GIFs with Pillow.
- Release proof: after CI finishes, download the APK from the release
  URL and grep the bundled JS for the new version string.
- Playwright gotchas already learned: strict-mode violations (scope
  selectors), CSS `text-transform` breaks `includes()` (match with
  /i regex), `pkill` exits 144 in compound commands (separate it).

## CI / releases

- **Android** (`.github/workflows/android.yml`): every push to `main`
  or `claude/**` runs tests, builds, signs with the committed sideload
  key, and updates the rolling GitHub release **`latest`**
  (`…/releases/download/latest/app-release.apk`); pushes to
  `claude/tally-sync` also update the **`beta`** release; `v*` tags get
  a versioned release. So: **every push to the release branch ships.**
- **Play** (`play-bundle.yml`): manual dispatch, signs an .aab with the
  PRIVATE upload keystore from secrets. Not part of daily flow.
- **iOS** (`codemagic.yaml`, workflow `ios-testflight`): owner presses
  "Start new build" in Codemagic (no auto-trigger). Hosted M2 Mac,
  Node 22, `npx cap sync ios`, build number = Codemagic's counter
  (`agvtool new-version -all $BUILD_NUMBER`, never bump manually).
  Signing is a visible first script step: it revokes leftover
  distribution certificates (their keys die with each build machine —
  Apple caps at two), mints a fresh key + certificate + App Store
  profile via `app-store-connect fetch-signing-files --create`, then
  `keychain initialize` / `add-certificates`. The App Store Connect
  integration in Codemagic MUST be named **`tally_app_store`** and live
  in the same Codemagic team as the app. Publishing uploads to
  TestFlight and auto-distributes to the Internal group named
  **`Internal`**. Bundle id `com.babicean.tally`; the ASC app record is
  named **"Calorie Tally"** ("Tally" was taken — display name on device
  is still Tally). Encryption exemption is declared in Info.plist.
- Android install channel is the rolling APK link; iOS is TestFlight;
  the PWA works from any static host.

## Current state & open threads (July 2026)

- v2.8.4, code 43. TestFlight live (first builds July 11); owner tests
  Android personally; a friend field-tests via TestFlight.
- Owner-side config still pending: enable GitHub Pages (branch
  `claude/tally-delighters`, `/docs`) and set Supabase Site URL /
  Redirect URLs to the hosted `verified.html` / `reset.html`, paste
  `docs/emails/*` into Supabase templates. Until then verification
  links land on localhost:3000 (verification itself still works).
- Known gaps: no iOS haptics (`navigator.vibrate` is a no-op there —
  `@capacitor/haptics` is the parity fix); keyboard/zoom fixes (2.7.2)
  await real-iPhone confirmation; External TestFlight group (public
  link) not yet set up — needs Beta App Review, privacy policy URL is
  ready once Pages is on.
- Agreed next candidates: insights (weekly averages, streak stats,
  calories-vs-weight overlay), meal polish. Shelved by owner: browser
  hosting on his own site, copy-yesterday (rejected), Reps Notion
  import, Reps sync (needs per-app schema change first — one row per
  user per app, or Tally/Reps would overwrite each other).

## Working with this owner

Ship complete: build, test, verify end-to-end, THEN show — screenshots
or GIFs attached, version bumped, changelog written, pushed. He reads
proof, not promises. Propose options with a recommendation when the
call is his (he picks fast). Match the app's calm register in
everything user-facing, and when he dictates copy, ship his exact
words.
