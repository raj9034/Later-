import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.later.mobile',
  appName: 'Later',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
