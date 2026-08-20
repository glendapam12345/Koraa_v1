import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { THEME } from '@/constants/theme';
import { supabase, getCachedAuthUser } from '@/lib/supabase';
import {
  formatReminderTime,
  getDailyReminderTime,
  getTaskCaptureReminderTime,
  getTaskCaptureReminderEnabled,
  getDailyReminderOptedIn,
} from '@/lib/notificationPreferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppLocale } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';
import { goToCheckIn } from '@/lib/checkInNavigation';
import { isCrisisModeActive } from '@/lib/emergencyKit/storage';
import {
  getNextTaskCaptureTriggerDate,
  hasCapturedTasksToday,
} from '@/lib/taskCaptureReminder';
import { resolveDailyReminderSchedulePlan } from '@/lib/dailyReminderSchedule';
import { markReturnTomorrowToast } from '@/lib/returnTomorrowToast';
import { track } from '@/lib/analytics';
import { pickNotificationCopy } from '@/lib/notificationCopyBank';
import { loadNotificationContext } from '@/lib/notificationContext';
import { buildEllieNotificationContent } from '@/lib/notificationEllieAttachment';
import { logger } from '@/lib/logger';

const LOCALE_STORAGE_KEY = 'koraa_app_locale_v1';

async function getStoredLocale(): Promise<AppLocale> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

function configureForegroundNotificationHandler() {
  if (Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    /* Expo Go / missing native module */
  }
}

type Subscription = { remove: () => void };
const DAILY_REMINDER_TYPE = 'daily_checkin_reminder';
const RECHECK_REMINDER_TYPE = 'recheck_reminder';
const CARE_MODE_REMINDER_TYPE = 'care_mode_checkin_reminder';
const TASK_CAPTURE_REMINDER_TYPE = 'task_capture_reminder';

const RECHECK_HOURS_AFTER_CHECKIN = 3;

export type EnsureReturnTomorrowResult = {
  scheduled: boolean;
  timeLabel: string | null;
  permissionGranted: boolean;
  mode: 'daily_recurring' | 'tomorrow_once' | null;
};

export function useNotifications() {
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    configureForegroundNotificationHandler();

    void (async () => {
      if (await getDailyReminderOptedIn()) {
        await registerForPushNotificationsAsync();
      }
    })();

    try {
      const subscription1 = Notifications.addNotificationReceivedListener((notification) => {
        logger.debug('Notificación recibida');
      });
      notificationListener.current = subscription1;

      const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
        logger.debug('Usuario tocó la notificación');
        const notificationData = response.notification.request.content.data;

        if (notificationData?.type === 'daily_checkin_reminder') {
          goToCheckIn();
        }
        if (notificationData?.type === CARE_MODE_REMINDER_TYPE) {
          goToCheckIn();
        }
        if (notificationData?.type === RECHECK_REMINDER_TYPE) {
          import('@/lib/recheckCheckInBridge').then(({ openRecheckCheckIn }) => {
            openRecheckCheckIn('notification');
          });
        }
        if (notificationData?.type === TASK_CAPTURE_REMINDER_TYPE) {
          import('@/lib/vaciarNavigation').then(({ openVaciarCapture }) => {
            openVaciarCapture();
          });
        }
      });
      responseListener.current = subscription2;
    } catch {
      /* Expo Go / missing native module */
    }

    return () => {
      try {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    scheduleDailyReminder,
    scheduleCareModeReminder,
    scheduleActiveReminders,
    scheduleRecheckReminder,
    scheduleTaskCaptureReminder,
    ensureReturnTomorrowReminder,
    cancelTaskCaptureReminderForToday,
    cancelAllNotifications,
    checkNotificationPermissions,
  };
}

async function cancelNotificationsByType(type: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.type === type)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* native module missing or Expo Go */
  }
}

/** Recordatorio ~3 h después del check-in: «¿Cambió tu día?» */
export async function scheduleRecheckReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(RECHECK_REMINDER_TYPE);

    const user = await getCachedAuthUser();
    if (!user) return;

    const today = getLocalDateString();
    const { data: checkIn } = await supabase
      .from('daily_check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!checkIn) return;

    if (await isCrisisModeActive()) return;

    const locale = localeOverride ?? (await getStoredLocale());
    const triggerDate = new Date();
    triggerDate.setHours(triggerDate.getHours() + RECHECK_HOURS_AFTER_CHECKIN);
    const ctx = await loadNotificationContext(user.id);
    const copy = await pickNotificationCopy(locale, 'recheck', ctx);
    const content = await buildEllieNotificationContent({
      title: copy.title,
      body: copy.body,
      data: { type: RECHECK_REMINDER_TYPE, copyId: copy.id },
      kind: 'recheck',
      ctx,
    });

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (error) {
    console.error('Error programando recordatorio de re-check:', error);
  }
}

async function ensureNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Koraa',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: THEME.colors.calm.lavender,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return existingStatus;

  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

async function registerForPushNotificationsAsync() {
  const finalStatus = await ensureNotificationPermissionStatus();

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificación no otorgados');
    return null;
  }

  return null;
}

/** Programa el recordatorio adecuado según si el modo cuidado está activo. */
export async function scheduleActiveReminders(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    const crisisActive = await isCrisisModeActive();
    if (crisisActive) {
      await cancelNotificationsByType(DAILY_REMINDER_TYPE);
      await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
      await cancelNotificationsByType(RECHECK_REMINDER_TYPE);
      await scheduleCareModeReminder(localeOverride);
      return;
    }

    await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
    await scheduleDailyReminder(localeOverride);
  } catch {
    /* native module missing or Expo Go */
  }
}

/** Recordatorio diario suave mientras el modo cuidado está activo. */
export async function scheduleCareModeReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);

    const crisisActive = await isCrisisModeActive();
    if (!crisisActive) return;

    const user = await getCachedAuthUser();
    if (!user) return;

    const { hour: reminderHour, minute: reminderMinute } = await getDailyReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());
    const ctx = await loadNotificationContext(user.id);
    const copy = await pickNotificationCopy(locale, 'care', ctx);
    const content = await buildEllieNotificationContent({
      title: copy.title,
      body: copy.body,
      data: { type: CARE_MODE_REMINDER_TYPE, copyId: copy.id },
      kind: 'care',
      ctx,
    });

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderHour,
        minute: reminderMinute,
      } as Notifications.DailyTriggerInput,
    });
  } catch (error) {
    console.error('Error programando recordatorio de modo cuidado:', error);
  }
}

/**
 * Tras un check-in: asegura permiso + recordatorio para mañana y deja toast suave en Hoy.
 * Corrige el hueco donde scheduleDailyReminder salía temprano si ya había check-in hoy.
 */
export async function ensureReturnTomorrowReminder(
  localeOverride?: AppLocale,
): Promise<EnsureReturnTomorrowResult> {
  if (Platform.OS === 'web') {
    return { scheduled: false, timeLabel: null, permissionGranted: false, mode: null };
  }

  const time = await getDailyReminderTime();
  const timeLabel = formatReminderTime(time);

  try {
    const optedIn = await getDailyReminderOptedIn();
    if (!optedIn) {
      return { scheduled: false, timeLabel, permissionGranted: false, mode: null };
    }

    const permissionStatus = await ensureNotificationPermissionStatus();
    const permissionGranted = permissionStatus === 'granted';

    if (!permissionGranted) {
      void track('return_reminder_scheduled', {
        scheduled: false,
        permission_granted: false,
      });
      return { scheduled: false, timeLabel, permissionGranted: false, mode: null };
    }

    const mode = await scheduleDailyReminder(localeOverride);
    if (mode) {
      await markReturnTomorrowToast(timeLabel);
    }

    void track('return_reminder_scheduled', {
      scheduled: Boolean(mode),
      permission_granted: true,
      mode: mode ?? 'none',
    });

    return {
      scheduled: Boolean(mode),
      timeLabel,
      permissionGranted: true,
      mode,
    };
  } catch (error) {
    console.error('Error asegurando recordatorio de retorno:', error);
    return { scheduled: false, timeLabel, permissionGranted: false, mode: null };
  }
}

/** Reprograma el recordatorio diario (p. ej. tras cambiar idioma en Ajustes). */
export async function scheduleDailyReminder(
  localeOverride?: AppLocale,
): Promise<'daily_recurring' | 'tomorrow_once' | null> {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return null;
  }

  try {
    if (await isCrisisModeActive()) {
      await scheduleCareModeReminder(localeOverride);
      return null;
    }

    const optedIn = await getDailyReminderOptedIn();
    if (!optedIn) {
      await cancelNotificationsByType(DAILY_REMINDER_TYPE);
      await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
      await cancelNotificationsByType(RECHECK_REMINDER_TYPE);
      return null;
    }

    await cancelNotificationsByType(DAILY_REMINDER_TYPE);

    const user = await getCachedAuthUser();
    if (!user) return null;

    const today = getLocalDateString();
    const { data: checkIn } = await supabase
      .from('daily_check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const { hour: reminderHour, minute: reminderMinute } = await getDailyReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());
    const baseCtx = await loadNotificationContext(user.id);

    const plan = resolveDailyReminderSchedulePlan({
      hasCheckInToday: Boolean(checkIn),
      now: new Date(),
      reminderHour,
      reminderMinute,
    });

    const copy = await pickNotificationCopy(locale, 'daily', baseCtx);
    const content = await buildEllieNotificationContent({
      title: copy.title,
      body: copy.body,
      data: { type: DAILY_REMINDER_TYPE, copyId: copy.id },
      kind: 'daily',
      ctx: baseCtx,
    });

    if (plan.mode === 'tomorrow_once' && plan.triggerDate) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.triggerDate,
        },
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminderHour,
          minute: reminderMinute,
        } as Notifications.DailyTriggerInput,
      });
    }

    logger.debug(
      'Recordatorio diario programado',
      plan.mode,
      reminderHour + ':' + String(reminderMinute).padStart(2, '0'),
    );
    return plan.mode;
  } catch (error) {
    console.error('Error programando recordatorio:', error);
    return null;
  }
}

/** Recordatorio vespertino suave para capturar pasos si aún no anotó nada hoy. */
export async function scheduleTaskCaptureReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);

    if (await isCrisisModeActive()) return;

    const optedIn = await getDailyReminderOptedIn();
    if (!optedIn) return;

    const enabled = await getTaskCaptureReminderEnabled();
    if (!enabled) return;

    const user = await getCachedAuthUser();
    if (!user) return;

    if (await hasCapturedTasksToday(user.id)) return;

    const { hour: reminderHour, minute: reminderMinute } = await getTaskCaptureReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());
    const triggerDate = getNextTaskCaptureTriggerDate(reminderHour, reminderMinute);
    const ctx = await loadNotificationContext(user.id);
    const copy = await pickNotificationCopy(locale, 'capture', ctx);
    const content = await buildEllieNotificationContent({
      title: copy.title,
      body: copy.body,
      data: { type: TASK_CAPTURE_REMINDER_TYPE, copyId: copy.id },
      kind: 'capture',
      ctx,
    });

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (error) {
    console.error('Error programando recordatorio de captura:', error);
  }
}

/** Tras guardar un paso hoy: cancela el aviso vespertino pendiente. */
export async function cancelTaskCaptureReminderForToday() {
  if (Platform.OS === 'web') return;
  try {
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
  } catch {
    /* ignore */
  }
}

export async function cancelAllNotifications() {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }
  try {
    await cancelNotificationsByType(DAILY_REMINDER_TYPE);
    await cancelNotificationsByType(RECHECK_REMINDER_TYPE);
    await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const status = await ensureNotificationPermissionStatus();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
