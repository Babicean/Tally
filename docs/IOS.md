# Tally on iOS — Mac-day guide

The iOS project is already generated and committed (`ios/`), synced
with the v2.3.2 web build, stamped with the right version, display
name, and app icon. Capacitor 8 uses Swift Package Manager, so there
is **no CocoaPods to install**. Everything below happens on the Mac.

## One-time setup

1. Install **Xcode** from the Mac App Store (big download — start it
   first). Open it once and accept the license / install components.
2. Install Node (if the Mac doesn't have it): https://nodejs.org LTS.

## Build and run on your own iPhone (free Apple ID is enough)

```sh
git clone https://github.com/Babicean/Tally && cd Tally
npm ci
npm run build
npx cap sync ios
npx cap open ios        # opens the project in Xcode
```

In Xcode:

1. Click the **App** project in the sidebar → target **App** →
   **Signing & Capabilities** tab.
2. Tick **Automatically manage signing** and pick your **Team**
   (add your Apple ID under Xcode → Settings → Accounts if empty).
   A free Apple ID works for this step.
3. If Xcode complains the bundle id is taken, change it to something
   personal, e.g. `com.babicean.tally.ios`.
4. Plug in your iPhone (enable Developer Mode on the phone when
   prompted: Settings → Privacy & Security → Developer Mode).
5. Select your iPhone in the device dropdown, press **Run** (▶).

First run on-device with a free Apple ID: the phone will ask you to
trust the developer certificate (Settings → General → VPN & Device
Management). Free-account installs expire after 7 days — fine for
your own testing, useless for friends. Which brings us to:

## Sending it to iPhone friends — TestFlight

There is no iOS equivalent of "download the APK". To put Tally on
friends' iPhones you need the **Apple Developer Program**
(US$99/year), which unlocks **TestFlight**:

1. Enroll at https://developer.apple.com (takes up to ~48 h).
2. In Xcode: Product → **Archive**, then in the Organizer window
   **Distribute App → TestFlight & App Store → Upload**.
3. In App Store Connect (https://appstoreconnect.apple.com):
   create the app record (bundle id `com.babicean.tally`, name Tally),
   wait for the build to process (~15 min), answer the export
   compliance question (uses only standard encryption → exempt).
4. TestFlight tab → add testers:
   - **Internal testers** (you + up to 100 App Store Connect users):
     instant, no review.
   - **External testers / public link** (up to 10,000): needs a light
     Beta App Review the first time (~1 day), then you just share a
     link. Friends install the TestFlight app, tap your link, done.
   Builds expire after 90 days; upload a new one any time.

## Updating later

After any web-side change:

```sh
npm run build && npx cap sync ios
```

then Run (own phone) or Archive → Upload (TestFlight). Bump
`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in Xcode (or
`ios/App/App.xcodeproj/project.pbxproj`) for each TestFlight upload —
build numbers must increase.

## Notes

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
