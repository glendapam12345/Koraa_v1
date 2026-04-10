/**
 * Configuración única de Expo (sin app.json duplicado → expo-doctor OK).
 * Metro carga .env antes de evaluar este archivo.
 */
module.exports = {
  expo: {
    name: 'Koraa',
    slug: 'koraav1-1',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.impermanencecasaartisitca.koraav1',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'Koraa',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', 'expo-font', 'expo-web-browser', 'expo-secure-store'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'ef96554d-08d3-4cb6-a5fe-4217d7295541',
      },
      supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() || undefined,
      supabaseAnonKey: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim() || undefined,
    },
    owner: 'pamela.1234',
  },
};
