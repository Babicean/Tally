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
green under, calm amber only past a 2% grace band, never red; quick-add chips learned from
habit; two-tap logging; entries tap-to-edit, 5-second undo, backdating),
**Menu** (saved foods with optional protein/fat and a category icon;
pinned items become Today chips; **Meals** bundle menu items and log as
one summed entry), **History** (day list with tappable
"nothing logged" gap rows for backdating, Insights card owning the
weekly average + bar chart + recap, logging streak with particle
celebration, weight card, export/import).

Opt-in extras (Settings gear): **kilojoules** (tap the hero number to
flip units, or the Settings Units row; input and display convert,
storage stays kcal), **protein/fat tracking** ("Track
macros", with carbs derived and shown with a ≈), **electrolytes**
("Track electrolytes": sodium/potassium/magnesium/calcium in mg on
menu items, inherited by entries; the hero gains a swipeable second
page with the Na:K ratio and each against its target), **daily protein target** with its own bar and a fire-emoji
celebration on hitting it, **weight tracking** (one weigh-in a day,
logged from the History weight card, ~60-point SVG trend, 30-day
change), theme System/Light/Dark, accent Azure/Emerald/Blush (Blush
tints the light background; dark stays Graphite). Yellow was tried
and retired: no shade is both yellow and legible.

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
  `<html>`. Accent families: Azure (default), Emerald and Blush via
  `data-accent`; Blush also tints `--bg` in light. `--accent-text`
  carries accent-colored small text. Never hardcode colors in components; use the tokens.
- **Proportional scaling**: root font is
  `clamp(13.5px, 3.8835vw, 16.7px)` — 16px at the 412px reference
  width. EVERYTHING is in rem, so one design scales to every phone.
  New CSS must follow (px only for sub-pixel hairlines).
- **Safe areas**: `--sat`/`--sab` wrap Android 15 injected vars with
  `env(safe-area-inset-*)` fallbacks (that fallback chain is what makes
  iPhones work). Fixed/bottom UI must include them.
- **Feel**: bottom sheets (`Sheet.tsx`) with swipe-to-dismiss, 200–400ms
  cubic-bezier motion, `prefers-reduced-motion` respected everywhere,
  haptics via `haptic()` in `src/lib/fly.ts` (navigator.vibrate on
  Android, @capacitor/haptics impacts on iOS),
  delighters small and rare (top-bar greeting icon, wordmark spin
  easter egg, streak burst, protein fire, tally strokes). Calm > flashy; nothing shouts.

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
  (vitest, node env, no DOM). 110 tests at last count. UI logic that
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

- v2.18.2, code 61: goal pill culled (owner's call; the ring caption
  and amber say it all). `Hero` keeps only the no-goal ghost prompt
  (`.goal-pill.ghost`); goal editing lives in Settings. `goalSeen`
  stays in settings/backup for compat but nothing reads it now. E2E:
  `verify-2182.mjs` (also emits the steps-placement mocks). NEXT UP,
  owner-approved: steps (v2.19) — Health Connect / HealthKit via
  `@capgo/capacitor-health`, opt-in "Show steps", display only, no
  storage, no calories burned; Today shows one small number, Insights
  gets a weekly average. Placement pending his pick (A: on the streak
  line in ink-3; B: inside the ring under the caption).
- v2.18.1, code 60: Today tab icon is live — `components/TabRing.tsx`
  draws the day's tally against the goal (`lib/goal.ts` ringProgress,
  amber via withinGoal, resting 0.64 arc when no goal, arc hidden at 0
  so the round cap doesn't paint a dot). Streak copy is "24 day
  streak" (no dash). E2E: `verify-2181.mjs`.
- v2.18.0, code 59: `components/TopBar.tsx` replaces the "Tally"
  wordmark — time-of-day greeting (`lib/greeting.ts`, deterministic
  per period, accent period icon) for ~3.8 s, then the tracking day's
  weekday (`formatWeekday`); replays after ≥5 min hidden; the spin
  easter egg lives on it. Hero date dropped the weekday
  (`formatHeroDate` → "6 September"). Active tab = `--accent-text`.
  Today tab icon = mini ring (static then; live since 2.18.1). E2E:
  `verify-218.mjs`.
- v2.17.1, code 58: Settings target fields are compact two-up grids
  (`.target-grid`); the calorie goal has a 2% grace band
  (`lib/goal.ts` withinGoal) used by the hero ring/pill colour and by
  "days under goal" — the pill's WORDS stay factual ("3 over goal"),
  only the amber waits. E2E: `verify-2171.mjs`.
- v2.17.0, code 57 (electrolytes: `lib/micros.ts` — fixed set sodium /
  potassium / magnesium / calcium in mg as an optional `micros` map on
  entries and menu items; meals sum components; chips carry them;
  settings `trackMicros` + `microTargets` (sodium is a limit, others
  goals, AU adult defaults); hero becomes a two-page scroll-snap
  carousel with dots when on, page 2 = Na:K ratio + rows vs targets;
  "+ electrolytes" reveal on MenuItemSheet and EditEntrySheet; the
  quick-add card deliberately has no micro fields). E2E:
  `verify-micros217.mjs`. Owner is field-testing; the Insights weekly
  electrolyte averages are a natural follow-up if he wants them.
- v2.16.0, code 56 (derived carbs: `lib/macros.ts` carbsOf/carbsForDay,
  4/9/4 kcal per gram, only entries with BOTH protein and fat count,
  null when nothing derivable; hero macro row protein | fat | carbs;
  entry rows + insights MacroStat cycle include carbs). Container was
  rebuilt Sept 2026: old scratchpad E2E scripts are gone; the current
  suite is `verify-carbs216.mjs` — rebuild older ones as needed.
- v2.15.0, code 55 (kilojoules: hero tap-flip + Settings Units row;
  display/input converts everywhere, storage stays kcal — kJ entries
  keep exact float kcal so typed values round-trip; teach-flip plays
  once via `unitHintSeen`). TestFlight live (first builds July 11); owner tests
  Android personally; a friend field-tests via TestFlight. A five-agent
  UX audit (July 13) produced a ranked findings report; v2.12 shipped
  every quick win plus three mediums (styled edit date field, sheet
  close buttons, 44px-class hit areas); v2.13 shipped the five
  convergent findings (chip/add-form macros, gap-day backdating, Today
  weigh-in chip, entry-row spacing + honest decrement toast, trend card
  merged into Insights); v2.14 shipped the last four mediums (undo
  toast hold-to-pause + always-mounted live region, backups moved into a
  Settings "Your data" section, a Daily goal row in Settings, first-run
  goal-pill hint via `goalSeen` in settings).
- Auth email flow LIVE and field-tested (July 12): GitHub Pages serves
  docs/ from the release branch; Supabase Site URL / Redirect URLs
  point at the hosted `verified.html` / `reset.html`; verify, reset
  and delete-account all confirmed on device. Shelved: branded email
  templates (`docs/emails/*`) — Supabase now locks template editing
  behind custom SMTP, so they wait for a Resend + owner-domain setup.
  The privacy policy is now public at
  https://babicean.github.io/Tally/PRIVACY.html (Beta App Review
  needs it).
- iOS field-tested on the owner's iPhone 13 Pro Max (July 14, v2.14):
  haptics confirmed working, no notable bugs. One open item: a minor
  keyboard hiccup when first typing a calorie — the view jumps off
  screen and back (screenshot pending from owner; likely the Keyboard
  plugin's native resize + scroll-into-view double-step). External
  TestFlight group (public link) not yet set up — needs Beta App
  Review; the privacy policy URL it requires is live.
- Tester requests (July 14): kilojoules (SHIPPED, v2.15) and a
  recipes section — likely batch-cooking math (ingredients + serves →
  per-serve menu item); owner is gathering more feedback before we
  design it. Do not build until he picks a shape.
- Agreed next: meal polish (reactive to tester feedback),
  calories-vs-weight overlay on the insights card (wait for a few weeks
  of weigh-in data). Last audit leftover: landing copy loop-closing —
  owner is mulling the wording (his verbatim words required, do not
  draft-and-ship). Shelved by owner: browser
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
