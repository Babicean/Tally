# Changelog

All notable changes to Tally, newest first. Each entry lists the app
version, the Android `versionCode` (what Google Play actually tracks),
and the date it was built.

Format loosely follows [Keep a Changelog](https://keepachangelog.com).
When cutting a new version: bump `package.json` and
`android/app/build.gradle` (`versionCode` always +1), add a section
here, and keep the "What's new" text for Play releases short enough to
paste straight from the summary line.

## 2.17.0 — code 57 — 2026-09-06

Electrolytes: sodium, potassium, magnesium and calcium, for the foods
that print them.

- A new "Track electrolytes" switch under Advanced tracking, with four
  editable daily figures prefilled with Australian adult reference
  values. Sodium is a stay-under limit; the others are targets to
  reach. Blank means none.
- With it on, the hero becomes two pages: swipe the ring (or tap the
  dots beneath it) to see today's sodium : potassium ratio and each
  electrolyte against its figure, with the same thin bars as the
  macros. Sodium turns the calm amber once past its limit.
- You enter electrolytes where the labels are: a "+ electrolytes"
  reveal on menu items, so anything logged from a chip, the picker, or
  a meal inherits them and meals sum their components. The edit sheet
  has the same reveal for one-off corrections. The quick-add card is
  untouched.
- Backups and sync carry electrolytes as an optional field; older
  backups import unchanged.

## 2.16.0 — code 56 — 2026-09-05

Carbs, derived. With macros on, Tally now works out carbohydrates from
what you already enter (4 kcal per gram of protein and carbs, 9 per gram
of fat; whatever is left is carbs).

- Today: the protein and fat lines under the ring become one compact
  row, protein | fat | carbs, each with its value, a quiet label, and
  the thin target bar where a target exists. Less height than before,
  one more macro.
- Carbs wear a "≈" because they are derived, and only entries carrying
  both protein and fat count toward them: an entry with no macros can't
  be assumed to be all carbs, so it contributes nothing rather than a
  wrong number. No derivable entry today means no carbs figure at all.
- Entry rows show "≈ N g carbs" beside protein and fat when derivable.
- History: the macro stat now cycles protein → fat → carbs per day.

## 2.15.0 — code 55 — 2026-07-14

Kilojoules, for the country whose packets print them.

- Tap the big number and it flips scoreboard-style between calories and
  kilojoules; the choice sticks and every number in the app follows —
  entries, chips, menu, meals, goal, insights, day list, the lot.
  There's a Units row in Settings too.
- On first open the number peeks at the other unit for a second and
  flips back, so the tap introduces itself once. Respects reduced
  motion; never replays.
- In kilojoule mode you also type kilojoules, straight off the packet:
  the add card, edit sheet, menu items, backdating, and both goal
  editors all read input in your unit. What you type is exactly what
  you see back — 500 kJ never comes home as 502.
- Under the hood nothing changed: data is stored unit-blind, so
  backups, sync, and merges are untouched and a backup restored on a
  calorie device just shows calories.

## 2.14.0 — code 54 — 2026-07-13

The audit's last four medium fixes. The findings list is now empty
except the landing page copy, which waits for the owner's words.

- The undo toast waits for you: touching or hovering it freezes the
  5-second timer (it restarts when you let go), and its announcement
  region is always mounted so screen readers reliably hear "Entry
  deleted".
- Backups live in Settings: a "Your data" section holds Export backup
  and Import right above the Account row, so keeping your data safe is
  one place, not two tabs cross-referencing each other. History is now
  purely days and trends.
- The calorie target has a Settings row beside the protein and fat
  targets. Blank removes it; the pill under the ring still works.
- Fresh installs see "2,000 remaining · tap to set your own" on the
  goal pill until they first open the goal sheet — the default number
  now explains itself. Existing installs never see the hint.

## 2.13.0 — code 53 — 2026-07-13

The UX audit's five structural fixes, the ones every auditor converged
on.

- Macros follow the happy path: learned quick-add chips now carry the
  protein and fat their food is usually logged with, and the add card
  grows a quiet "+ macros" reveal (when tracking) so new foods get
  protein in one pass instead of a detour through Edit.
- Backdating reaches empty days: holes in the log show as dimmed
  "nothing logged" rows in All days (one tap opens the add sheet), and
  Yesterday is always there, so day one can log last night's dinner.
- Weigh-ins live where you act: with weight tracking on, a hollow
  "log weight" chip sits at the end of the quick-add row until today's
  weigh-in exists; the chart stays in History.
- One weekly numbers card: the trend card merged into Insights — Week
  view carries the daily average, the bar chart, and "cal vs last
  week"; the same three stats no longer appear twice in one scroll.
- Entry rows: more room between log-again and delete, and removing one
  of a ×N row now says "Removed one" instead of claiming the entry was
  deleted.

## 2.12.0 — code 52 — 2026-07-13

The UX audit batch: five review agents combed the app for design,
usability, and accessibility issues; this release ships every quick win
plus three medium fixes. The bigger structural findings wait for 2.13.

- Edit entry: the date field now reads "Today · 5:49 PM" in the app's
  own style instead of raw system formatting (a tap still opens the
  system picker), and a typo in protein or fat now outlines the field
  that's actually wrong, with an error naming it.
- History: weight-chart labels no longer overlap when the peak sits
  next to the range's edge; day rows show their "cal" unit and
  note-less entries no longer leave a hole; "days under goal" replaces
  the ambiguous "on target" fraction and never judges the still-running
  day; the weekly delta is labeled "cal vs last week"; the "and N more"
  food expander is accent-colored like every other tappable text; the
  time-of-day ranges read "before 11 am / after 4 pm" instead of
  leaking the 2 AM boundary.
- Today: overlong pinned names no longer swallow the whole chip row;
  the note field suggests what it's for ("Chicken wrap"); learned chips
  keep one calorie variant per food instead of two near-identical
  chips; the protein stat's flip to fat has a visible cue.
- Sheets: every sheet has a small labeled close button; screen readers
  now announce chips and menu rows as buttons.
- Ergonomics: small controls (entry ⊕/✕, chips, tabs, toggles, segment
  buttons, Undo) gained invisible 44 px-class hit areas; the settings
  gear is bigger and darker; keyboard focus is a real outline that no
  card shadow can hide.
- Settings: the tracking toggles say where their result appears; the
  landing page's log-in path says "Back" instead of referencing a
  Settings screen you've never seen.

## 2.11.1 — code 51 — 2026-07-12

The hardening pass: 21 bugs found by systematic review, all fixed.
Nothing new to see; everything is sturdier.

- Data safety: a corrupt storage payload can no longer cascade into
  wiping the native mirror and the cloud backup; the app never
  persists a just-loaded state back over storage at boot; weights now
  sync between open tabs; duplicate ids inside a backup import once;
  restores from pre-2.4 backups keep protein tracking on.
- Backups: large backups no longer hit the browser's 64 KB keepalive
  cap (backups were failing permanently after roughly 500 entries); a
  server hiccup during token refresh no longer logs you out; two
  simultaneous refreshes can't cancel each other; restoring on a new
  phone no longer wipes cloud weight history; logging out clears the
  last-backed-up timestamp.
- Time: the day rollover fires at 2 AM sharp even on daylight-saving
  nights; editing an entry without touching its time keeps its exact
  timestamp and day; logging right at 2 AM shows up immediately.
- Interface: meals recompute when a contained food is edited or
  deleted; closing sheets ignore taps (no more double-submits);
  keyboard focus lands in sheets when they open and stays put while
  you type; the macro stat can't show a blank number; a double-tapped
  delete can't spawn a phantom undo; duplicate pinned foods render one
  chip.

## 2.11 — code 50 — 2026-07-12

iPhones can feel the app now.

- Every haptic in Tally reaches iOS through the native Taptic engine:
  logging ticks, quick-add chips, the macro flip, the wordmark spin,
  celebrations, and the landing page's tally strokes stroke by stroke.
- Android is untouched; it keeps the vibration timings it always had.
  The tuned durations map onto light, medium and heavy impacts on iOS.

## 2.10.2 — code 49 — 2026-07-12

Honey retires; three accents is the palette.

- The yellow theme never found a shade that was both yellow and
  legible, so it's gone. Azure, Emerald and Blush remain, one row of
  three in Settings.
- Anyone who had Honey selected falls back to Azure automatically.
- The --accent-text token stays; Blush uses it for small text.

## 2.10.1 — code 48 — 2026-07-12

Lighter Blush, true butter Honey.

- Blush fills lighten to soft pink; buttons keep the deeper pink so
  white text stays readable.
- Honey is now butter yellow on the ring, bars and buttons (buttons
  switch to dark text), with a dark golden yellow reserved for links
  and small accents so nothing becomes unreadable.
- New token: --accent-text, the text-sized accent every theme inherits
  and only Honey overrides.

## 2.10 — code 47 — 2026-07-12

Two new accents, by tester request: Blush and Honey.

- **Blush**: rose-tinted page with a pink accent. **Honey**: pale
  yellow page with an amber accent (yellow itself fails contrast, so
  the accent leans amber with a deeper shade on buttons).
- The pastel lives on the page background only; cards stay white and
  text stays dark. In dark mode both keep Graphite surfaces and only
  the accent changes.
- The accent picker in Settings is now a two by two grid of four:
  Azure, Emerald, Blush, Honey.
- The Android status bar follows the tinted background.

## 2.9.2 — code 46 — 2026-07-12

First tester feedback: the tally's slash sat wrong.

- The landing delighter's fifth stroke now cuts through the middle of
  the bars at the icon's angle and stays inside their span, instead of
  escaping high to the right. The whole mark re-centered to the pixel.

## 2.9.1 — code 45 — 2026-07-11

Insights follow-ups from field testing.

- Tap the protein/day stat and it flips over, scoreboard-style, to
  fat/day; tap again to flip back. Works on the trend recap and the
  Insights card, only when macros are tracked and fat has been logged.
  A small haptic tick per flip; reduced motion swaps instantly.
- "and N more this week" is now tappable: the top foods list expands
  in place, capped at 25 rows so a heavy month stays tidy, with a
  quiet "show less" to fold it back.

## 2.9 — code 44 — 2026-07-10

Insights. History answers "what have I actually been eating?"

- A new Insights card sits under the trend chart with a Week | Month
  toggle (rolling 7 tracking days, or the calendar month so far).
- Quiet numbers up top: days logged, calories per logged day, days on
  target when a goal is set, protein per day when tracking.
- **Top foods**: your most-logged items grouped by name, with times
  eaten and total calories. Same meal every day shows up as exactly
  that.
- **When you eat**: morning, afternoon and evening bars splitting the
  period's calories by time of day, 2 AM boundary respected (a 1 am
  snack counts as evening).
- Observations only; nothing scolds, nothing turns red.

## 2.8.4 — code 43 — 2026-07-10

Landing page type hierarchy.

- Only "A simple way to track calories" is the bold headline, sized to
  hold a single line; "Log calories in just a couple taps." follows as
  a regular line.
- All landing text is centered.

## 2.8.3 — code 42 — 2026-07-10

Landing page copy, verbatim this time.

- Headline and lines now read exactly as written: "A simple way to
  track calories - log them in just a couple taps." with the menu and
  history line and the weight and macros line as dictated.
- The logo lockup sits slightly lower.

## 2.8.2 — code 41 — 2026-07-10

Your first tally.

- Tapping "Start tallying" now draws the icon's tally in the middle of
  the screen, stroke by stroke with a haptic tick for each and a firmer
  one for the slash, then fades into Today. Optically centered, both
  themes, skipped under reduced motion.

## 2.8.1 — code 40 — 2026-07-10

Landing page polish.

- The app icon now sits centered in the top quarter, with the wordmark
  beneath it.
- Reworded the pitch: "A simple way to track calories." with three
  shorter lines about logging, the menu and History, and optional
  weight and macro tracking.

## 2.8 — code 39 — 2026-07-10

A front door. Fresh installs get a one-time landing page.

- One quiet screen on the very first open: the name, the pitch, three
  short facts, and a Start button. Dismiss it and it never comes back.
- "Already have an account? Log in" on the same screen jumps straight
  to the account login form, so a new phone can pull its backup before
  any tallying starts.
- Updating the app never shows the page; anyone with existing data is
  marked as welcomed silently.

## 2.7.2 — code 38 — 2026-07-09

Two anticipated iOS fixes ahead of TestFlight testing.

- Locked viewport zoom so iPhones no longer zoom the whole layout when
  focusing a text field (our scaled type sits under the 16px threshold
  that triggers it). No change on Android, which never zoomed.
- Added the Capacitor keyboard plugin with the webview-resize mode on
  iOS, so bottom sheets ride above the keyboard the way they already
  do on Android instead of being covered by it.

## 2.7.1 — code 37 — 2026-07-09

Weight moves fully into History.

- The weight pill left the Today screen; logging now happens on the
  History weight card itself (a pill in its header — "Log weight"
  until you do, then today's number). Today stays purely calories.
- Settings wording: "Track your weight and view trends over time."

## 2.7 — code 36 — 2026-07-09

Weight tracking and Meals.

- **Track weight** (Settings, opt-in): a quiet pill under the hero —
  "Log weight" until you do, then today's number. One field, one
  number a day, prefilled with your last weigh-in. History gains a
  weight card: a line of your last ~60 weigh-ins with the current
  number and the change, no colors for up or down. Weigh-ins are
  mirrored, in file backups, and sync with your account.
- **Meals** (Menu → "+ New meal"): bundle saved foods into one row —
  "Usual breakfast" logs one entry with the summed calories and
  macros. Editing a meal recomputes its totals; pin one and it's a
  chip on Today like anything else.
- Branded verification/reset email templates in docs/emails/ (paste
  into Supabase → Authentication → Email Templates).

## 2.6 — code 35 — 2026-07-09

**Account sync, stable.** Six beta rounds (beta.1-beta.6 below)
merged to the release line. Optional accounts back up your data to
the cloud automatically and restore it on any device; delete removes
everything server-side instantly. Without an account, nothing ever
leaves your phone. Revert point: `stable-pre-sync` branch.

## 2.6-beta.6 — code 34 — 2026-07-09 (beta channel)

Less reading, same app.

- The account panel's privacy explanations (what's stored, where,
  encryption, deletion behavior) moved out of the app and into the
  privacy policy, where that detail belongs. The panel is back to
  buttons and one-line pitches.
- Em dashes removed from account copy; "I have an account" is now
  just "Log in", and the verify screen's button reads "Verified?
  Log in".
- "Keep your tally safe" reads "Keep your data safe".
- docs/PRIVACY.md gains the automatic-backup detail.

## 2.6-beta.5 — code 33 — 2026-07-09 (beta channel)

Lost verification emails are no longer a dead end.

- Logging in with an unverified account now routes straight back to
  the verify-email screen — with its Resend button — instead of just
  refusing. Deleted the email? Restarted the app? Try to log in and
  tap Resend.

## 2.6-beta.4 — code 32 — 2026-07-08 (beta channel)

Forgot password + invisible sync.

- **Forgot password?** on the log-in form sends a reset email; the
  link opens a Tally-styled page (docs/reset.html on GitHub Pages)
  where you set a new password against the one-hour recovery token.
  Expired or reused links get a clear dead-end page.
- **Auto-backup.** Signed in, your changes back themselves up: edits
  mark the data dirty, a quiet minute later it pushes — and leaving
  the app flushes immediately (with keepalive, so backgrounding
  mid-push doesn't lose it). Failures stay silent and retry on the
  next change; Back up now remains for the impatient.

## 2.6-beta.3 — code 31 — 2026-07-08 (beta channel)

Restore brings your whole setup back.

- Restoring from your account now applies the backup's settings too —
  theme, accent, calorie goal, macro tracking and targets — not just
  entries and menu. Your dark theme follows you to the new phone.
- File imports in the History tab stay conservative on settings (the
  file might be someone else's); only your account restore assumes
  the backup is *your* setup.

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
