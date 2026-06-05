import { Alert, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import type { TranslationKey } from '@/lib/i18n';

export type TipAction =
  | 'spotify'
  | 'apple_music'
  | 'focus_session'
  | 'reminders'
  | 'health_mindfulness';

async function openFirstSupported(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

export async function executeTipAction(
  action: TipAction,
  t: (key: TranslationKey) => string,
): Promise<void> {
  if (action === 'focus_session') {
    router.push('/focus-session');
    return;
  }

  if (action === 'spotify') {
    const urls =
      Platform.OS === 'ios'
        ? ['spotify://', 'music://', 'https://open.spotify.com/']
        : ['spotify://', 'https://open.spotify.com/'];

    const opened = await openFirstSupported(urls);
    if (!opened) {
      try {
        await Linking.openURL('https://open.spotify.com/');
      } catch {
        Alert.alert(t('tips.actionUnavailableTitle'), t('tips.actionSpotifyError'));
      }
    }
    return;
  }

  if (action === 'apple_music') {
    const urls =
      Platform.OS === 'ios'
        ? ['music://', 'https://music.apple.com/']
        : ['https://music.apple.com/'];
    const opened = await openFirstSupported(urls);
    if (!opened) {
      Alert.alert(t('tips.actionUnavailableTitle'), t('tips.actionMusicError'));
    }
    return;
  }

  if (action === 'reminders') {
    const urls =
      Platform.OS === 'ios'
        ? ['x-apple-reminderkit://', 'mobilenotes://']
        : ['https://calendar.google.com/calendar/'];
    const opened = await openFirstSupported(urls);
    if (!opened) {
      Alert.alert(t('tips.actionUnavailableTitle'), t('tips.actionRemindersError'));
    }
    return;
  }

  if (action === 'health_mindfulness') {
    const urls =
      Platform.OS === 'ios'
        ? ['x-apple-health://', 'https://support.apple.com/guide/iphone/use-mindfulness-iphe36cfe7c9/ios']
        : ['https://www.google.com/fit/'];
    const opened = await openFirstSupported(urls);
    if (!opened) {
      try {
        await Linking.openURL('https://support.apple.com/guide/iphone/use-mindfulness-iphe36cfe7c9/ios');
      } catch {
        Alert.alert(t('tips.actionUnavailableTitle'), t('tips.actionHealthError'));
      }
    }
  }
}

export function getTipActionLabel(
  action: TipAction,
  t: (key: TranslationKey) => string,
): string {
  switch (action) {
    case 'spotify':
      return t('tips.actionOpenSpotify');
    case 'apple_music':
      return t('tips.actionOpenMusic');
    case 'reminders':
      return t('tips.actionOpenReminders');
    case 'health_mindfulness':
      return t('tips.actionOpenMindfulness');
    default:
      return t('tips.actionStartFocus');
  }
}
