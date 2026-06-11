import { Alert, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import type { TranslationKey } from '@/lib/i18n';
import { openAppleHealthSleep } from '@/lib/appleHealth';

export type TipAction =
  | 'spotify'
  | 'apple_music'
  | 'focus_session'
  | 'notes'
  | 'reminders'
  | 'health_mindfulness'
  | 'health_sleep'
  | 'health'
  | 'messages'
  | 'maps'
  | 'clock'
  | 'hoy'
  | 'vaciar';

type MusicAppChoice = 'spotify' | 'apple_music';

type OpenAppOptions = {
  urls: string[];
  webFallback?: string;
  errorKey: TranslationKey;
  t: (key: TranslationKey) => string;
};

/** iOS exige LSApplicationQueriesSchemes; en Expo Go canOpenURL a veces falla aunque openURL sí abre la app. */
async function openNativeApp({ urls, webFallback, errorKey, t }: OpenAppOptions): Promise<void> {
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      /* intentar openURL directo */
    }
  }

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      /* siguiente scheme */
    }
  }

  if (webFallback) {
    try {
      await Linking.openURL(webFallback);
      return;
    } catch {
      /* mostrar alerta */
    }
  }

  Alert.alert(t('tips.actionUnavailableTitle'), t(errorKey));
}

async function openSpotifyApp(t: (key: TranslationKey) => string): Promise<void> {
  await openNativeApp({
    urls: ['spotify://', 'spotify://open'],
    webFallback: 'https://open.spotify.com/',
    errorKey: 'tips.actionSpotifyError',
    t,
  });
}

async function openAppleMusicApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['music://', 'music://music.apple.com', 'https://music.apple.com/']
      : ['https://music.apple.com/'];
  await openNativeApp({
    urls,
    webFallback: 'https://music.apple.com/',
    errorKey: 'tips.actionMusicError',
    t,
  });
}

function showMusicAppPicker(
  t: (key: TranslationKey) => string,
  onSelect: (choice: MusicAppChoice) => void,
): void {
  Alert.alert(t('tips.musicPickerTitle'), t('tips.musicPickerBody'), [
    {
      text: t('tips.musicPickerSpotify'),
      onPress: () => onSelect('spotify'),
    },
    {
      text: t('tips.musicPickerAppleMusic'),
      onPress: () => onSelect('apple_music'),
    },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}

function executeMusicAction(t: (key: TranslationKey) => string): void {
  showMusicAppPicker(t, (choice) => {
    if (choice === 'spotify') {
      void openSpotifyApp(t);
      return;
    }
    void openAppleMusicApp(t);
  });
}

async function openNotesApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['mobilenotes://', 'x-apple-notes://']
      : ['https://keep.google.com/'];
  await openNativeApp({
    urls,
    webFallback: Platform.OS === 'ios' ? undefined : 'https://keep.google.com/',
    errorKey: 'tips.actionNotesError',
    t,
  });
}

async function openRemindersApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['x-apple-reminderkit://', 'x-apple-reminder://']
      : ['https://calendar.google.com/calendar/'];
  await openNativeApp({
    urls,
    webFallback: Platform.OS === 'ios' ? undefined : 'https://calendar.google.com/calendar/',
    errorKey: 'tips.actionRemindersError',
    t,
  });
}

async function openMessagesApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['messages://', 'sms://']
      : ['https://messages.google.com/web'];
  await openNativeApp({
    urls,
    webFallback: Platform.OS === 'ios' ? undefined : 'https://messages.google.com/web',
    errorKey: 'tips.actionMessagesError',
    t,
  });
}

async function openMapsApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['maps://', 'http://maps.apple.com/']
      : ['geo:0,0', 'https://maps.google.com/'];
  await openNativeApp({
    urls,
    webFallback: 'https://maps.apple.com/',
    errorKey: 'tips.actionMapsError',
    t,
  });
}

async function openClockApp(t: (key: TranslationKey) => string): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? ['clock-alarm://', 'clock-worldclock://', 'clock-timer://']
      : ['https://clock.google.com/'];
  await openNativeApp({
    urls,
    webFallback: Platform.OS === 'ios' ? undefined : 'https://clock.google.com/',
    errorKey: 'tips.actionClockError',
    t,
  });
}

async function openHealthApp(
  t: (key: TranslationKey) => string,
  section?: 'mindfulness' | 'sleep',
): Promise<void> {
  const urls =
    Platform.OS === 'ios'
      ? section === 'sleep'
        ? ['x-apple-health://Sleep', 'x-apple-health://com.apple.Health.Sleep', 'x-apple-health://']
        : section === 'mindfulness'
          ? ['x-apple-health://com.apple.Health.Mindfulness', 'x-apple-health://']
          : ['x-apple-health://']
      : ['https://www.google.com/fit/'];
  await openNativeApp({
    urls,
    webFallback:
      Platform.OS === 'ios'
        ? 'https://support.apple.com/guide/iphone/iph3e0ca2db/ios'
        : 'https://www.google.com/fit/',
    errorKey: 'tips.actionHealthError',
    t,
  });
}

function openHoyTab(): void {
  router.replace('/(tabs)');
}

function openVaciarTab(): void {
  router.replace('/(tabs)/vaciar');
}

export async function executeTipAction(
  action: TipAction,
  t: (key: TranslationKey) => string,
): Promise<void> {
  switch (action) {
    case 'focus_session':
      router.push({ pathname: '/focus-session', params: { minutes: '5' } });
      return;
    case 'spotify':
    case 'apple_music':
      executeMusicAction(t);
      return;
    case 'notes':
      await openNotesApp(t);
      return;
    case 'reminders':
      await openRemindersApp(t);
      return;
    case 'messages':
      await openMessagesApp(t);
      return;
    case 'maps':
      await openMapsApp(t);
      return;
    case 'clock':
      await openClockApp(t);
      return;
    case 'health_mindfulness':
      await openHealthApp(t, 'mindfulness');
      return;
    case 'health_sleep':
      await openAppleHealthSleep({ t, errorKey: 'tips.actionHealthSleepError' });
      return;
    case 'health':
      await openHealthApp(t);
      return;
    case 'hoy':
      openHoyTab();
      return;
    case 'vaciar':
      openVaciarTab();
      return;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function getTipActionLabel(
  action: TipAction,
  t: (key: TranslationKey) => string,
): string {
  switch (action) {
    case 'spotify':
    case 'apple_music':
      return t('tips.actionOpenMusic');
    case 'notes':
      return t('tips.actionOpenNotes');
    case 'reminders':
      return t('tips.actionOpenReminders');
    case 'messages':
      return t('tips.actionOpenMessages');
    case 'maps':
      return t('tips.actionOpenMaps');
    case 'clock':
      return t('tips.actionOpenClock');
    case 'health_mindfulness':
      return t('tips.actionOpenMindfulness');
    case 'health_sleep':
      return t('tips.actionOpenHealthSleep');
    case 'health':
      return t('tips.actionOpenHealth');
    case 'hoy':
      return t('tips.actionOpenHoy');
    case 'vaciar':
      return t('tips.actionOpenVaciar');
    case 'focus_session':
      return t('tips.actionStartFocus');
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
