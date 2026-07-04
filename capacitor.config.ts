import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.babicean.tally",
  appName: "Tally",
  webDir: "dist",
  android: {
    // The web app handles its own safe areas; keep the system bars styled
    // by the theme rather than overlaying the webview.
    backgroundColor: "#f4f5f7",
  },
};

export default config;
