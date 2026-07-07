# Tally on iOS — Mac-day guide

The iOS project is already generated and committed (`ios/`), stamped
to v2.5 (build 26), with the right display name and app icon. The web
build is produced fresh on the Mac (`npm run build`), so whatever the
repo is at ships. Capacitor 8 uses Swift Package Manager, so there is
**no CocoaPods to install**. Everything below happens on the Mac.

## Read this first (no iPhone + rented Mac)

Two facts change the plan:

1. **TestFlight requires the paid Apple Developer Program ($99/yr),
   and approval can take up to ~48 hours** (new accounts sometimes
   longer, with identity verification). You **cannot finish today**.
   So the single most important thing to do *first*, before anything
   else, is start that enrollment so the clock is running.
2. **You have no iPhone.** That's fine — you don't need one. The
   **iOS Simulator** (built into Xcode) lets you see and drive Tally
   as an iPhone app on the Mac today, which is all the testing you
   need before your friends get it. Your friends' phones are the
   real test devices, via TestFlight.

**What you can actually get done on the library Mac today:**
enroll in the Developer Program (starts the ~48h clock), install
Xcode, get Tally building and running in the Simulator, and archive
the build. The one step that must wait for approval is the final
*upload* to TestFlight. Realistically this is a two-visit job: today
= setup + prove it runs; after approval = upload + invite friends.

> Note: the library Mac is shared and wiped. Sign into **your own**
> Apple ID, and remember to sign out of Xcode (Xcode → Settings →
> Accounts) and the browser before you leave.

## Step 0 — enroll in the Apple Developer Program (do this FIRST)

Because approval is the long pole, kick it off before the Xcode
download even finishes.

1. Go to https://developer.apple.com/programs/enroll and sign in with
   the Apple ID you'll use as the developer account (make one at
   https://appleid.apple.com if needed; use your own, not a library
   account). Enable two-factor auth if prompted.
2. Enroll as an **Individual** ($99/yr). You'll verify your identity
   (they may ask for a government ID). Pay.
3. You'll get an email when it's approved — anywhere from a few hours
   to ~48h. Everything in "Ship to TestFlight" below waits on this
   email. The rest of today's steps do not.

## One-time setup

1. Install **Xcode** from the Mac App Store (big download — start it
   right after Step 0). Open it once and accept the license / install
   components.
2. Install Node (if the Mac doesn't have it): https://nodejs.org LTS.

## Today — build it and see it run in the Simulator (no iPhone, no paid account)

```sh
git clone https://github.com/Babicean/Tally && cd Tally
npm ci
npm run build
npx cap sync ios
npx cap open ios        # opens the project in Xcode
```

In Xcode:

1. In the device dropdown at the top, pick a simulator, e.g.
   **iPhone 15**. Press **Run** (▶). Xcode builds and launches Tally
   in a simulated iPhone on screen — swipe, log an entry, toggle
   dark mode. This confirms the port works without any device or
   paid account.
2. Then set up signing (needed later for archiving): click the
   **App** project in the sidebar → target **App** → **Signing &
   Capabilities**. Tick **Automatically manage signing** and pick
   your **Team** (add your Apple ID under Xcode → Settings →
   Accounts if it's empty — a free Apple ID is fine to *archive*;
   uploading is what needs the paid account).
3. If Xcode complains the bundle id is taken, change it to something
   personal, e.g. `com.babicean.tally.ios`, and use that same id in
   App Store Connect later.

That's the productive end of today. When the enrollment email lands,
come back for the upload.

## Ship to TestFlight (after the enrollment email arrives)

There is no iOS equivalent of "download the APK". TestFlight is the
only way onto friends' iPhones, and it needs the paid account from
Step 0.

1. In Xcode, device dropdown → **Any iOS Device (arm64)** (you can't
   archive while a simulator is selected). Product → **Archive**.
2. When the Organizer window opens: **Distribute App → TestFlight &
   App Store → Upload**. Xcode signs and uploads.
3. In App Store Connect (https://appstoreconnect.apple.com): create
   the app record (**+ → New App**, bundle id `com.babicean.tally`
   or whatever you set, name "Tally", primary language English).
   Wait for the build to finish processing (~15 min). Answer the
   export-compliance question: Tally uses only standard encryption
   (HTTPS) → **exempt**.
4. TestFlight tab → add testers:
   - **Internal testers** (up to 100 people you add as users on your
     App Store Connect account): instant, no review. If a friend is
     willing to be added this way it's the fastest path.
   - **External testers / public link** (up to 10,000): needs a
     one-time **Beta App Review** (~1 day). After it passes you get a
     shareable link — friends install the **TestFlight** app from the
     App Store, tap your link, and Tally installs. This is the
     "send it to a couple of friends" path.
   Each friend just needs the free TestFlight app and your link.
   Builds expire after 90 days; upload a fresh one any time.

## Updating later

After any web-side change:

```sh
npm run build && npx cap sync ios
```

then Run (Simulator) or Archive → Upload (TestFlight). Bump
`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in Xcode (or
`ios/App/App.xcodeproj/project.pbxproj`) for each TestFlight upload —
**build numbers (`CURRENT_PROJECT_VERSION`) must strictly increase**
or App Store Connect rejects the upload. Currently at 2.5 / build 26.

## Notes

- **Minimum iOS: 16.0** (set in the Xcode project). Everything Tally
  uses is native to iOS 16; the CSS fallbacks for older engines remain
  as free insurance but 15.x is unsupported. iOS 16 covers roughly
  95%+ of active iPhones, including iPhone 8/X on their final OS.

- Safe areas (notch / home indicator) are already handled: the app
  uses `viewport-fit=cover` plus `env(safe-area-inset-*)` fallbacks.
- The status-bar plugin's `setBackgroundColor` is Android-only; on
  iOS it throws inside the existing try/catch and is harmless. If the
  status bar text color ever looks wrong on iOS, that's the first
  place to look.
- The App Store icon (1024 px, no alpha) is already in
  `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
- iOS WebKit ignores Android-style text zoom entirely; the fluid
  root-unit sizing from v2.3.2 applies as-is.
