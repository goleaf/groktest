import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.borrowed.local',
  appName: 'Borrowed',
  webDir: 'dist/borrowed/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
