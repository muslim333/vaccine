import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'SchoolHealthApp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  android: {
    useLegacyBridge: true,
    path: 'android',
  },
};

export default config;
