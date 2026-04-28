/**
 * Configuración única de Expo (sin app.json duplicado → expo-doctor OK).
 * Metro carga .env antes de evaluar este archivo.
 *
 * EAS Build: las variables deben existir en el entorno del build (EAS → Secrets)
 * con nombres EXPO_PUBLIC_* o los alias de abajo; .env no se sube al build por defecto.
 */
function firstTrimmed(...vals) {
  for (const v of vals) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s) return s;
  }
  return undefined;
}

module.exports = {
  expo: {
    name: 'Koraa',
    slug: 'koraav1-1',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/koraa-logo.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.impermanencecasaartisitca.koraav1',
      buildNumber: '8',
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
      supabaseUrl: firstTrimmed(
        process.env.EXPO_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_URL,
        process.env.API_Key,
      ),
      supabaseAnonKey: firstTrimmed(
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        process.env.SUPABASE_ANON_KEY,
        process.env.anon_key,
        process.env.ANON_KEY,
      ),
      revenueCatApiKeyIOS: firstTrimmed(
        process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
        process.env.REVENUECAT_API_KEY_IOS,
      ),
      revenueCatApiKeyAndroid: firstTrimmed(
        process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
        process.env.REVENUECAT_API_KEY_ANDROID,
      ),
    },
    owner: 'pamela.1234',
  },
};
