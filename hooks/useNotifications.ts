import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getDailyReminderTime } from '@/lib/notificationPreferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppLocale, translate } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';

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
          router.push('/(tabs)/sentir');
        });
      }
      if (notificationData?.type === RECHECK_REMINDER_TYPE) {
        import('expo-router').then(({ router }) => {
          router.push({ pathname: '/(tabs)', params: { openRecheck: '1' } });
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
    scheduleRecheckReminder,
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

/** Reprograma el recordatorio diario (p. ej. tras cambiar idioma en Ajustes). */
export async function scheduleDailyReminder(localeOverride?: AppLocale) {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }

  try {
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

// Cancelar todas las notificaciones
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }
  await cancelNotificationsByType(DAILY_REMINDER_TYPE);
  await cancelNotificationsByType(RECHECK_REMINDER_TYPE);
}

// Verificar permisos de notificación
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
