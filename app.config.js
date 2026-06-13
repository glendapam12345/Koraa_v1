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

const enableOtaUpdates =
  process.env.EAS_BUILD_PROFILE === 'production' || process.env.EAS_BUILD === 'true';

requireForRelease('EXPO_PUBLIC_SUPABASE_URL', supabaseUrl);
requireForRelease('EXPO_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);
requireForRelease('EXPO_PUBLIC_REVENUECAT_API_KEY_IOS', revenueCatApiKeyIOS);
requireForRelease('EXPO_PUBLIC_PRIVACY_POLICY_URL', privacyPolicyUrl);
requireForRelease('EXPO_PUBLIC_TERMS_OF_SERVICE_URL', termsOfServiceUrl);

module.exports = {
  expo: {
    name: 'Koraa',
    slug: 'koraav1-1',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/images/koraa-logo.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    updates: {
      url: 'https://u.expo.dev/ef96554d-08d3-4cb6-a5fe-4217d7295541',
      enabled: enableOtaUpdates,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.impermanencecasaartisitca.koraav1',
      buildNumber: '32',
      entitlements: {
        'com.apple.developer.healthkit': true,
        // Tipos concretos en runtime (react-native-health SleepAnalysis); [] = permisos por uso en app.
        'com.apple.developer.healthkit.access': [],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'Koraa',
        NSCalendarsUsageDescription:
          'Koraa usa tu calendario para agregar tareas con fecha como eventos.',
        NSCalendarsWriteOnlyAccessUsageDescription:
          'Koraa usa tu calendario para agregar tareas con fecha como eventos.',
        NSPhotoLibraryUsageDescription:
          'Koraa puede acceder a fotos que elijas para tu kit de calma en Emergency Kit — solo cuando tú lo pidas.',
        NSPhotoLibraryAddUsageDescription:
          'Koraa puede guardar en tu biblioteca una imagen que elijas para tu kit de calma — solo cuando tú lo pidas.',
        LSApplicationQueriesSchemes: [
          'spotify',
          'music',
          'mobilenotes',
          'x-apple-notes',
          'x-apple-reminderkit',
          'x-apple-reminder',
          'x-apple-health',
          'messages',
          'sms',
          'maps',
          'clock-alarm',
          'clock-worldclock',
          'clock-timer',
        ],
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
          writeOnlyAccess: true,
          writeOnlyCalendarPermission:
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
      [
        'react-native-health',
        {
          healthSharePermission:
            'Koraa lee tus horas de sueño en Salud para suavizar los pasos sugeridos — sin metas ni culpa.',
          healthUpdatePermission:
            'Koraa no guarda datos de sueño en Salud; solo los lee si tú lo permites.',
        },
      ],
      [
        'expo-speech-recognition',
        {
          microphonePermission:
            'Koraa usa el micrófono solo para transcribir tareas que dictes — no guardamos grabaciones.',
          speechRecognitionPermission:
            'Koraa transcribe tu voz a texto cuando dictas una tarea en Tareas.',
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