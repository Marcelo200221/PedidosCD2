import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuapp.app',
  appName: 'TuApp',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // tiempo que se mostrará (ms)
      launchAutoHide: true,     // si se oculta automáticamente
      backgroundColor: '#f8f7f6', // color de fondo
      androidScaleType: 'CENTER_CROP', // escala de imagen en Android
    }
  }
};

export default config;
