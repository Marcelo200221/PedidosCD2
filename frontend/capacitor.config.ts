import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.dd.pedidoscd',
  appName: 'Pedidos CD',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#f8f7f6',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
