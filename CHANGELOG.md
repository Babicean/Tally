# Changelog

All notable changes to Tally, newest first. Each entry lists the app
version, the Android `versionCode` (what Google Play actually tracks),
and the date it was built.

Format loosely follows [Keep a Changelog](https://keepachangelog.com).
When cutting a new version: bump `package.json` and
`android/app/build.gradle` (`versionCode` always +1), add a section
here, and keep the "What's new" text for Play releases short enough to
paste straight from the summary line.

## Unreleased — account beta (side branch `claude/tally-account`)

Design pass for optional accounts, ahead of a future sync server.
Local-only: nothing leaves the device, and the privacy policy is
unchanged until real transmission exists.

- Settings gains an **Account** row that drills into its own panel
  (iOS-style slide, back button returns).
- Create account / log in with just an email and a password — no
  username, no name, no photo. Password is salted and hashed even
  locally.
- Signed-in panel: initial-letter avatar, email, member-since date, a
  "Last backed up" row (honest: "not yet — syncing arrives with the
  server update"), Log out, and two-tap Delete account.
- Clear "Beta — local only" notes wherever the account appears.
- Account record is mirrored to native storage like everything else.

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
