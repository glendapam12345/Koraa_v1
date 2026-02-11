import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Solicitar permisos al montar
    registerForPushNotificationsAsync();

    // Listener para notificaciones recibidas cuando la app está en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    // Listener para cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario tocó la notificación:', response);
      // Aquí podrías navegar a la pantalla de check-in
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
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
      lightColor: '#FF6B6B',
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
  try {
    // Cancelar notificaciones anteriores
    await Notifications.cancelAllScheduledNotificationsAsync();

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

    // Obtener hora preferida del usuario (por ahora, 9 AM por defecto)
    // TODO: Permitir al usuario configurar su hora preferida
    const reminderHour = 9;
    const reminderMinute = 0;

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
        body: 'Haz tu check-in diario y Kora organizará tu día automáticamente 💭',
        sound: true,
        data: { type: 'daily_checkin_reminder' },
      },
      trigger: {
        hour: reminderHour,
        minute: reminderMinute,
        repeats: true,
      },
    });

    console.log('Recordatorio diario programado para las', reminderHour + ':' + reminderMinute);
  } catch (error) {
    console.error('Error programando recordatorio:', error);
  }
}

// Cancelar todas las notificaciones
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Verificar permisos de notificación
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
