import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getDailyReminderTime } from '@/lib/notificationPreferences';

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
        // Importar router dinámicamente para evitar problemas de inicialización
        import('expo-router').then(({ router }) => {
          router.push('/(tabs)/sentir');
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
    cancelAllNotifications,
    checkNotificationPermissions,
  };
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

// Programar recordatorio diario inteligente
export async function scheduleDailyReminder() {
  if (Platform.OS === 'web') {
    console.log('Las notificaciones no están disponibles en web');
    return;
  }

  try {
    // Cancelar solo recordatorios diarios de check-in, no todas las notificaciones.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.type === DAILY_REMINDER_TYPE)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    // Verificar si ya hay check-in hoy
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
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
        title: '¿Cómo te sientes hoy?',
        body: 'Haz tu check-in diario y Koraa organizará tu día automáticamente 💭',
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
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.type === DAILY_REMINDER_TYPE)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

// Verificar permisos de notificación
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
