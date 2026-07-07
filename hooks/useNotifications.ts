import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getDailyReminderTime, getTaskCaptureReminderTime, getTaskCaptureReminderEnabled } from '@/lib/notificationPreferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppLocale, translate } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { isCrisisModeActive } from '@/lib/emergencyKit/storage';
import {
  getNextTaskCaptureTriggerDate,
  hasCapturedTasksToday,
} from '@/lib/taskCaptureReminder';

const LOCALE_STORAGE_KEY = 'koraa_app_locale_v1';

async function getStoredLocale(): Promise<AppLocale> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Subscription = { remove: () => void };
const DAILY_REMINDER_TYPE = 'daily_checkin_reminder';
const RECHECK_REMINDER_TYPE = 'recheck_reminder';
const CARE_MODE_REMINDER_TYPE = 'care_mode_checkin_reminder';
const TASK_CAPTURE_REMINDER_TYPE = 'task_capture_reminder';

const RECHECK_HOURS_AFTER_CHECKIN = 3;

export function useNotifications() {
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // Solicitar permisos al montar
    registerForPushNotificationsAsync();

    // Listener para notificaciones recibidas cuando la app está en primer plano
    const subscription1 = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificación recibida:', notification);
    });
    notificationListener.current = subscription1;

    // Listener para cuando el usuario toca la notificación
    const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Usuario tocó la notificación:', response);
      const notificationData = response.notification.request.content.data;
      
      // Navegar a la pantalla correspondiente según el tipo de notificación
      if (notificationData?.type === 'daily_checkin_reminder') {
        import('expo-router').then(({ router }) => {
          router.push(CHECK_IN_ROUTE);
        });
      }
      if (notificationData?.type === CARE_MODE_REMINDER_TYPE) {
        import('expo-router').then(({ router }) => {
          router.push(CHECK_IN_ROUTE);
        });
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

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    scheduleDailyReminder,
    scheduleCareModeReminder,
    scheduleActiveReminders,
    scheduleRecheckReminder,
    scheduleTaskCaptureReminder,
    cancelTaskCaptureReminderForToday,
    cancelAllNotifications,
    checkNotificationPermissions,
  };
}

async function cancelNotificationsByType(type: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.type === type)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Recordatorio ~3 h después del check-in: «¿Cambió tu día?» */
export async function scheduleRecheckReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(RECHECK_REMINDER_TYPE);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getLocalDateString();
    const { data: checkIn } = await supabase
      .from('daily_check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!checkIn) return;

    const locale = localeOverride ?? (await getStoredLocale());
    const triggerDate = new Date();
    triggerDate.setHours(triggerDate.getHours() + RECHECK_HOURS_AFTER_CHECKIN);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate(locale, 'hooks.recheckNotifTitle'),
        body: translate(locale, 'hooks.recheckNotifBody'),
        sound: true,
        data: { type: RECHECK_REMINDER_TYPE },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (error) {
    console.error('Error programando recordatorio de re-check:', error);
  }
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: THEME.colors.gradient.pink,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permisos de notificación no otorgados');
    return null;
  }

  return token;
}

/** Programa el recordatorio adecuado según si el modo cuidado está activo. */
export async function scheduleActiveReminders(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  const crisisActive = await isCrisisModeActive();
  if (crisisActive) {
    await cancelNotificationsByType(DAILY_REMINDER_TYPE);
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
    await scheduleCareModeReminder(localeOverride);
    return;
  }

  await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);
  await scheduleDailyReminder(localeOverride);
  await scheduleTaskCaptureReminder(localeOverride);
}

/** Recordatorio diario suave mientras el modo cuidado está activo. */
export async function scheduleCareModeReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);

    const crisisActive = await isCrisisModeActive();
    if (!crisisActive) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { hour: reminderHour, minute: reminderMinute } = await getDailyReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());

    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate(locale, 'hooks.careModeNotifTitle'),
        body: translate(locale, 'hooks.careModeNotifBody'),
        sound: true,
        data: { type: CARE_MODE_REMINDER_TYPE },
      },
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

/** Reprograma el recordatorio diario (p. ej. tras cambiar idioma en Ajustes). */
export async function scheduleDailyReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }

  try {
    if (await isCrisisModeActive()) {
      await scheduleCareModeReminder(localeOverride);
      return;
    }

    // Cancelar solo recordatorios diarios de check-in, no todas las notificaciones.
    await cancelNotificationsByType(DAILY_REMINDER_TYPE);

    // Verificar si ya hay check-in hoy
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getLocalDateString();
    const { data: checkIn } = await supabase
      .from('daily_check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    // Si ya hay check-in hoy, no programar notificación
    if (checkIn) {
      return;
    }

    const { hour: reminderHour, minute: reminderMinute } = await getDailyReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());

    // Programar notificación para hoy si aún no pasó la hora
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(reminderHour, reminderMinute, 0, 0);

    // Si la hora ya pasó hoy, programar para mañana
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // Programar notificación diaria recurrente
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate(locale, 'hooks.notifTitle'),
        body: translate(locale, 'hooks.notifBody'),
        sound: true,
        data: { type: DAILY_REMINDER_TYPE },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderHour,
        minute: reminderMinute,
      } as Notifications.DailyTriggerInput,
    });

    console.log('Recordatorio diario programado para las', reminderHour + ':' + reminderMinute);
  } catch (error) {
    console.error('Error programando recordatorio:', error);
  }
}

/** Recordatorio vespertino suave para capturar pasos si aún no anotó nada hoy. */
export async function scheduleTaskCaptureReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') return;

  try {
    await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);

    if (await isCrisisModeActive()) return;

    const enabled = await getTaskCaptureReminderEnabled();
    if (!enabled) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (await hasCapturedTasksToday(user.id)) return;

    const { hour: reminderHour, minute: reminderMinute } = await getTaskCaptureReminderTime();
    const locale = localeOverride ?? (await getStoredLocale());
    const triggerDate = getNextTaskCaptureTriggerDate(reminderHour, reminderMinute);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate(locale, 'hooks.taskCaptureNotifTitle'),
        body: translate(locale, 'hooks.taskCaptureNotifBody'),
        sound: true,
        data: { type: TASK_CAPTURE_REMINDER_TYPE },
      },
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
  await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
}

// Cancelar todas las notificaciones
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }
  await cancelNotificationsByType(DAILY_REMINDER_TYPE);
  await cancelNotificationsByType(RECHECK_REMINDER_TYPE);
  await cancelNotificationsByType(CARE_MODE_REMINDER_TYPE);
  await cancelNotificationsByType(TASK_CAPTURE_REMINDER_TYPE);
}

// Verificar permisos de notificación
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
