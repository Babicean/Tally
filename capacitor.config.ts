import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.babicean.tally",
  appName: "Tally",
  webDir: "dist",
  android: {
    // The web app handles its own safe areas; keep the system bars styled
    // by the theme rather than overlaying the webview.
    backgroundColor: "#f5f6f8",
  },
  plugins: {
    Keyboard: {
      // iOS only: shrink the webview when the keyboard opens so fixed
      // bottom sheets ride above it, matching Android's adjustResize.
      resize: "native",
    },
  },
};

export default config;
