import { Asset } from 'expo-asset';
import type { NotificationContentInput } from 'expo-notifications';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { isExpoGoClient } from '@/lib/subscriptionEnvironment';
import {
  resolveNotifPatternTags,
  type NotifKind,
  type NotificationContext,
} from '@/lib/notificationCopyBank';
import { resolveEllieNotifMood, type EllieNotifMood } from '@/lib/notificationEllieMood';

const ELLIE_NOTIF_ASSETS: Record<EllieNotifMood, number> = {
  default: require('@/assets/images/ellie-notif-default.png'),
  happy: require('@/assets/images/ellie-notif-happy.png'),
  breathing: require('@/assets/images/ellie-notif-breathing.png'),
  sleepy: require('@/assets/images/ellie-notif-sleepy.png'),
  grateful: require('@/assets/images/ellie-notif-grateful.png'),
};

async function localEllieUri(mood: EllieNotifMood): Promise<string | null> {
  try {
    const asset = Asset.fromModule(ELLIE_NOTIF_ASSETS[mood]);
    await asset.downloadAsync();
    const uri = asset.localUri ?? null;
    if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) {
      return null;
    }
    return uri;
  } catch {
    return null;
  }
}

/** Título + cuerpo + retrato de Ellie en lila (iOS). Sin fondo negro. */
export async function buildEllieNotificationContent(params: {
  title: string;
  body: string;
  data: Record<string, unknown>;
  kind: NotifKind;
  ctx: NotificationContext;
}): Promise<NotificationContentInput> {
  const tags = resolveNotifPatternTags(params.ctx);
  const mood = resolveEllieNotifMood(params.kind, tags, params.ctx.salt ?? 0);

  const content: NotificationContentInput = {
    title: params.title,
    body: params.body,
    sound: true,
    color: THEME.colors.calm.lavenderDeep,
    data: { ...params.data, ellieMood: mood },
  };

  if (Platform.OS === 'ios' && !isExpoGoClient()) {
    const url = await localEllieUri(mood);
    if (url) {
      content.attachments = [
        {
          identifier: `ellie-${mood}`,
          url,
          type: 'image/png',
          typeHint: 'public.png',
          hideThumbnail: false,
        },
      ];
    }
  }

  return content;
}
