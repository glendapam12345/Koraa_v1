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

/** Solo builds App Store / Play con perfil production (no confundir con export de `eas update`). */
const isProductionRelease = process.env.EAS_BUILD_PROFILE === 'production';

function requireForRelease(name, value) {
  if (isProductionRelease && !value) {
    throw new Error(`Missing required env var for release: ${name}`);
  }
  return value;
}

const supabaseUrl = firstTrimmed(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_URL,
  process.env.API_Key,
);
const supabaseAnonKey = firstTrimmed(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_ANON_KEY,
  process.env.anon_key,
  process.env.ANON_KEY,
);
const revenueCatApiKeyIOS = firstTrimmed(
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  process.env.REVENUECAT_API_KEY_IOS,
);
const revenueCatApiKeyAndroid = firstTrimmed(
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  process.env.REVENUECAT_API_KEY_ANDROID,
);
const privacyPolicyUrl = firstTrimmed(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
const termsOfServiceUrl = firstTrimmed(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL);

requireForRelease('EXPO_PUBLIC_SUPABASE_URL', supabaseUrl);
requireForRelease('EXPO_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);
requireForRelease('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS', revenueCatApiKeyIOS);
requireForRelease('EXPO_PUBLIC_PRIVACY_POLICY_URL', privacyPolicyUrl);
requireForRelease('EXPO_PUBLIC_TERMS_OF_SERVICE_URL', termsOfServiceUrl);

module.exports = {
  expo: {
    name: 'Koraa',
    slug: 'koraav1-1',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/images/koraa-logo.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    updates: {
      url: 'https://u.expo.dev/ef96554d-08d3-4cb6-a5fe-4217d7295541',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.impermanencecasaartisitca.koraav1',
      buildNumber: '27',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'Koraa',
      },
    },
    android: {
      package: 'com.impermanencecasaartisitca.koraav1',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-localization',
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      [
        'expo-calendar',
        {
          calendarPermission:
            'Koraa usa tu calendario para agregar tareas con fecha como eventos.',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#6A8DFF',
          defaultChannel: 'default',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'ef96554d-08d3-4cb6-a5fe-4217d7295541',
      },
      supabaseUrl,
      supabaseAnonKey,
      revenueCatApiKeyIOS,
      revenueCatApiKeyAndroid,
    },
    owner: 'pamela.1234',
  },
};