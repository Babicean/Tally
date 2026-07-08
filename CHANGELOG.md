# Changelog

All notable changes to Tally, newest first. Each entry lists the app
version, the Android `versionCode` (what Google Play actually tracks),
and the date it was built.

Format loosely follows [Keep a Changelog](https://keepachangelog.com).
When cutting a new version: bump `package.json` and
`android/app/build.gradle` (`versionCode` always +1), add a section
here, and keep the "What's new" text for Play releases short enough to
paste straight from the summary line.

## 2.6-beta.2 — code 30 — 2026-07-08 (beta channel)

First real-server field test fixes.

- The waiting-for-verification screen gains "Wrong address? Start
  over" — a typo'd email no longer traps you; you can go back and
  create the account again or log in with another one.
- docs/verified.html: a Tally-styled landing page for the email
  verification link, replacing Supabase's default redirect to
  localhost:3000 (served via GitHub Pages; set as the Site URL in
  Supabase's auth settings).

## 2.6-beta.1 — code 29 — 2026-07-08 (beta channel)

Account sync, for real. First release on the `beta` channel from the
`claude/tally-sync` branch; docs/SYNC.md has the architecture.

- Accounts now live on the server (Supabase, Sydney): sign-up sends a
  real verification email, sign-in gets a real session, and the
  `verified` flag finally means something. The v2.3 local-only
  account record is retired and cleaned up on first sign-in.
- **Back up now** pushes the export-format backup to your account;
  "Last backed up" shows the real server timestamp. **Restore from
  backup** pulls, merges (union by id, local always wins), reports
  what was added, and pushes the union back.
- **Delete account** now truly deletes: a server-side function
  removes the account and the backup cascades away in the same
  transaction. On-device data is never touched.
- Honest copy everywhere: Settings footer and the History data card
  now say data stays on-device *unless you turn on sync*; the
  account panel states exactly what the server stores and where.
  docs/PRIVACY.md is the policy.
- Security: no SQL from the client (parameterized REST only), Row
  Level Security scopes every request to the signed-in user, the
  embedded key is the public project key (the privileged key never
  leaves the Supabase dashboard).

## 2.5.2 — code 28 — 2026-07-08

Graphite dark mode, inherited from Reps.

- Dark surfaces now separate by color, not by shadows that darkness
  swallows: page down to #0c0d10, cards up to #1e2126, a 1px light
  catch along every card and floating surface's top edge, brighter
  secondary text. Status bar, navigation bar, and PWA theme color
  follow. Light mode untouched; Azure and Emerald both sit fine.

## 2.5.1 — code 27 — 2026-07-08

One proportional design on every screen size.

- The fluid base unit now slides across the whole phone range instead
  of capping at 16px: the layout is anchored to a 412px-wide
  reference screen and every other device renders it at width/412
  scale — identical ratios, spacing, and typography, just linearly
  sized. Verified 0.00% ratio drift from 360px to 430px.
- Reference phones (412px) are pixel-identical to 2.5; narrow phones
  keep a readability floor; tablets/desktop cap at Pro-Max scale.
- Applies to iOS the same way (CSS pt widths: 375/390/430), so the
  TestFlight build inherits it.

## 2.5 — code 26 — 2026-07-06

Two little delighters.

- Tap the **Tally** wordmark at the top and it takes a smooth 3D
  spin — that's it, that's the feature.
- The protein-goal moment is now unmissable: a handful of little
  fire emoji flicker up off the protein line (with the haptic and
  "Protein target hit" toast as before). Skipped under
  reduced-motion, cleaned from the DOM when done.

## 2.4.1 — code 25 — 2026-07-06

Wording touch-ups.

- Track macros description tightened to "Adds protein and fat to
  menu items and entries." — one line on modern phones, and the
  "carbs are what's left" aside is gone.
- Calorie target sheet no longer calls the target "gentle".

## 2.4 — code 24 — 2026-07-06

Advanced tracking: fat joins protein, plus a protein-target
celebration and a cleaner fork icon.

- **Advanced tracking** (formerly "Track protein" in Settings) now
  covers protein *and* fat. Menu items, entries, the edit sheet, and
  backdated logs all take optional fat grams; carbs stay off the
  books because calories − protein − fat already implies them.
- Second hero line: fat logged today, with its own thin progress bar
  (neutral fill, so the protein bar keeps the accent) and an optional
  **daily fat target** in Settings.
- Hitting your protein target now earns a little celebration — a
  burst right on the protein line, a haptic tick, and a "Protein
  target hit" toast. Calorie-target and streak moments still win if
  they land on the same log.
- The Menu tab's fork icon was redrawn — smooth single-arc tines and
  a full-height handle replace the glitchy segmented path (same fix
  in the quick-add chip menu).
- Entry groups and menu rows show "· N g fat" alongside protein.
- Backups carry the fat target and per-entry/menu fat grams.

## 2.3.3 — code 23 — 2026-07-06

iOS-compatibility hardening ahead of the iPhone port (no visible
change on Android):

- vh fallbacks behind every dvh use, so pre-15.4 iOS engines still cap
  sheets and size pages correctly.
- Solid focus-ring fallback behind the color-mix() ring (iOS < 16.2).
- Inputs never render below 16px, preventing iOS's auto-zoom-on-focus
  on very narrow screens.
- Verified at iPhone 13 / mini / Pro Max dimensions: no overflow,
  sheets cap and sit on the bottom edge, inputs zoom-safe.

## 2.3.2 — code 22 — 2026-07-05

Same proportions on every phone.

- Text zoom locked to 100%: the app's own type scale is the design,
  identical on every device. (The system font-size setting no longer
  affects Tally; it was distorting layouts differently per phone.)
- Fluid base unit: the whole UI scales gently with viewport width, so
  narrower phones render the same proportions as big flagships
  instead of a zoomed-in crop. Large phones and desktop unchanged.

## 2.3.1 — code 21 — 2026-07-05

Fixes for phones with a large system font size, where WebView's text
zoom inflated every layout (full-screen settings sheet with no way
out, overflowing pages, visible scrollbars).

- System font size is honored up to 115%, then capped — beyond that
  the layouts broke apart instead of getting more readable.
- Sheets can never trap again: they cap below full-screen height and
  scroll internally, so the grabber and a slice of backdrop always
  stay reachable no matter how tall the content gets.
- Scrollbars disabled everywhere, natively and in CSS — the
  overscroll stretch is the only scroll signal.

## 2.3 — code 20 — 2026-07-05

**Optional account (beta), merged from the side branch** after three
beta rounds of on-device testing. Still local-only: nothing leaves
the device, and the privacy policy is unchanged until the sync server
exists. The revert point is the `stable-pre-account` branch.

- Settings gains an **Account** row (person icon on the right, your
  initial-letter avatar once signed in) that drills into its own
  panel — iOS-style slide, back button returns. No dedicated page,
  no first-open wall; the app stays instant.
- Create account / log in with just an email and a password — no
  username, no name, no photo. Show/hide password toggle. Passwords
  are salted and hashed even locally.
- Email checks that work offline: shape rules with specific messages,
  plus a typo catcher for classic domain slips (gmail.con,
  hotnail.com, yaho.com…) offering "Did you mean…?" with one tap to
  accept. True mailbox verification arrives with the server; records
  carry a `verified` flag (always false locally) ready for it.
- Signed-in panel: avatar, email, member-since date, an honest "Last
  backed up: not yet" row, Log out, and two-tap Delete account
  (deleting the account never touches entries or settings).
- Account record is mirrored to native storage like everything else,
  and clear BETA notes mark the feature until sync is real.

## 2.2.1 — code 19 — 2026-07-05

- Thin protein progress bar under the protein line on Today, filling
  toward the daily protein target in the accent color. Only shown when
  protein tracking is on and a target is set; caps at full — protein
  over target is a win, not a warning.

## 2.2 — code 18 — 2026-07-05

- **Menu, one tap closer.** The Today screen's chip row now leads with
  an accent-tinted Menu chip. Tapping it opens a "From the Menu" sheet
  listing every saved staple in the Menu tab's own row style; one tap
  logs it to today (fly animation, streak and target celebrations
  included) and the sheet slips away. Habit chips stay right where
  they were, after the Menu chip. The chip only appears once the Menu
  has at least one item, so day one stays clean.

## 2.1.2 — code 17 — 2026-07-05

- Today and Menu now have the same living pull-and-bounce as History.
  The stretch is Android's native overscroll, which only engages on
  scrollable pages; every tab now overflows the viewport by one
  invisible pixel so the physics work everywhere.

## 2.1.1 — code 16 — 2026-07-05

Feel tweaks to 2.1 from on-device testing.

- The add (+) button uses a lighter, fresher emerald; the rest of the
  emerald palette is unchanged.
- Pulling a sheet up now stretches it — the bottom edge stays glued to
  the screen instead of floating up and showing a gap.

## 2.1 — code 15 — 2026-07-05

- **Emerald accent.** Settings gains an Accent picker: Azure (default)
  or Emerald. The choice recolors the ring, streak, buttons, toggles,
  chips, sparkles, and focus rings; persists across restarts; syncs
  across open tabs; and travels inside backups. Both shades are
  contrast-validated in light and dark themes. The launcher icon and
  splash stay azure (Android can't swap those per-setting).
- **Swipe-to-dismiss sheets.** The grabber at the top of every bottom
  sheet is now real: pull up and it stretches with rubber-band
  resistance, drag down and it follows your finger, and a
  past-threshold drag or a downward flick dismisses it. Release after
  a pause snaps back — a hold is not a flick.

## 2.0.2 — code 14 — 2026-07-04

- One subtle focus ring on inputs instead of the doubled blue
  highlight.
- Em dashes removed from user-facing copy.
- Repo: Google Play publishing kit added (store listing copy, privacy
  policy, AAB build workflow, upload keystore handling).

## 2.0.1 — code 13 — 2026-07-04

- The logged amount flies into the total along a gentle arc as a
  rounded pill, instead of a straight line.
- Soft scrim behind the tab bar so History content fades out under it
  rather than colliding with it.

## 2.0 — code 12 — 2026-07-04

Milestone release: the 1.x line grew from a calorie counter into the
finished product — Menu with categories and pinning, opt-in protein
with targets, streaks and celebrations, weekly recap, backdating,
durable storage with backup/restore, settings with theming, Inter
typography, and the azure identity. The core loop is still two fields
and a button.

## 1.10 — code 11 — 2026-07-04

- Inter Variable typography, bundled with the app (no network fetch).
- Azure accent adopted as the app identity (chosen from rendered
  candidates), replacing the denim blue.
- The settings gear does a little spin when tapped.

## 1.9 — code 10 — 2026-07-04

- **Backdated entries.** Forgot to log? Add an entry to an earlier day
  from History, including a time, and it lands on the right tracking
  day.
- **Protein, opt-in.** A Settings switch adds optional grams to Menu
  items and entries, plus an optional daily protein target shown under
  the ring. Off by default for new installs; the app stays pure
  calories without it.

## 1.8 — code 9 — 2026-07-04

- Ambient sparkles gather around the progress ring as the day fills.
- Hitting the daily target earns a small, tasteful sparkle burst —
  once per day, never a nag.

## 1.7 — code 8 — 2026-07-04

- Cleaner gear icon in the top bar.
- Fresh installs start with a 2,000 cal daily target so the ring is
  there from the first open (still editable or removable).
- Target-related copy polished.

## 1.6 — code 7 — 2026-07-04

- Fixed edge-to-edge overlap on Android 15: content no longer collides
  with the status bar or gesture area.
- App version shown at the bottom of Settings.

## 1.5 — code 6 — 2026-07-04

- **Settings** sheet with a System / Light / Dark appearance override
  (the native status bar restyles to match).
- Repeat-with-count entry rows: tap ⊕ on an entry you had again and it
  counts ×2, ×3, … instead of duplicating rows.
- Repo: every push now publishes the APK to a rolling "latest" GitHub
  release.

## 1.4 — code 5 — 2026-07-04

- **Streaks.** Log at least once a day and the chain grows, with a
  little celebration each day it continues. Streaks reward logging,
  never restriction.
- **Weekly recap** row in History summarizing the last seven days.

## 1.3 — code 4 — 2026-07-04

- Theme refined to Denim, chosen from seven rendered slate variants.

## 1.2 — code 3 — 2026-07-04

- Adopted the Slate theme and ran a full design polish pass across
  every screen.

## 1.1 — code 2 — 2026-07-04

- **Durable storage.** localStorage is mirrored to native storage;
  if the WebView wipes its data, the app restores from the mirror on
  launch.
- **Backup & restore.** Export everything to a single JSON file and
  import it on a new phone; imports merge by id, never duplicate.

## 1.0 — code 1 — 2026-07-04

First complete version.

- Two fields and a button: calories plus an optional note, logged in
  seconds. Big animated running total for today.
- Days roll over at 2 AM, not midnight — the 1 AM snack counts toward
  tonight.
- Optional daily goal with a progress ring: green under target, calm
  amber over it, never red.
- Quick-add chips for things you've logged twice or more.
- **Menu:** saved staples with calories and category icons, logged
  with one tap.
- History with per-day summaries and a 7-day trend chart.
- Tap-to-edit any entry; undo toast for deletes; small haptic tick on
  supported phones.
- Installable PWA with offline support, and a sideloadable Android app
  via Capacitor.
- Everything stays on-device: no account, no ads, no cloud.
