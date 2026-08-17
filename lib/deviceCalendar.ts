import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { normalizeScheduledDate, parseLocalDateString } from '@/lib/dateLocal';

const STORAGE_PREFIX = 'koraa_device_calendar_event:';

export type AddTaskToDeviceCalendarInput = {
  taskId: string;
  title: string;
  scheduledDate: string;
  /** Notas del evento (p. ej. i18n). */
  eventNotes?: string;
};

export type AddTaskToDeviceCalendarResult =
  | { ok: true; eventId: string }
  | {
      ok: false;
      reason:
        | 'unavailable'
        | 'native_module_missing'
        | 'permission_denied'
        | 'no_calendar'
        | 'already_added'
        | 'error';
    };

type CalendarModule = typeof import('expo-calendar');

let calendarModulePromise: Promise<CalendarModule | null> | null = null;

/** Módulo nativo enlazado (build 27+ o Expo Go con SDK actual). */
export function isDeviceCalendarNativeLinked(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return requireOptionalNativeModule('ExpoCalendar') != null;
  } catch {
    return false;
  }
}

export function isDeviceCalendarSupported(): boolean {
  return (
    (Platform.OS === 'ios' || Platform.OS === 'android') && isDeviceCalendarNativeLinked()
  );
}

async function loadCalendarModule(): Promise<CalendarModule | null> {
  if (!isDeviceCalendarNativeLinked()) return null;
  if (!calendarModulePromise) {
    calendarModulePromise = import('expo-calendar')
      .then((mod) => mod)
      .catch(() => null);
  }
  return calendarModulePromise;
}

export async function wasTaskAddedToDeviceCalendar(taskId: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${STORAGE_PREFIX}${taskId}`);
    return value === '1';
  } catch {
    return false;
  }
}

async function markTaskAddedToDeviceCalendar(taskId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${taskId}`, '1');
  } catch {
    /* ignore */
  }
}

async function resolveWritableCalendarId(Calendar: CalendarModule): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  if (Platform.OS === 'ios') {
    try {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      if (defaultCalendar?.id) return defaultCalendar.id;
    } catch {
      /* fallback to writable list below */
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  const primary =
    writable.find((calendar) => calendar.isPrimary) ??
    writable.find((calendar) => calendar.source?.isLocalAccount) ??
    writable[0];

  return primary?.id ?? null;
}

export async function addTaskToDeviceCalendar(
  input: AddTaskToDeviceCalendarInput,
  options?: { allowDuplicate?: boolean },
): Promise<AddTaskToDeviceCalendarResult> {
  if (!isDeviceCalendarSupported()) {
    return {
      ok: false,
      reason: isDeviceCalendarNativeLinked() ? 'unavailable' : 'native_module_missing',
    };
  }

  const Calendar = await loadCalendarModule();
  if (!Calendar) {
    return { ok: false, reason: 'native_module_missing' };
  }

  const trimmedTitle = input.title.trim();
  const dateKey = normalizeScheduledDate(input.scheduledDate);
  if (!trimmedTitle || !dateKey) {
    return { ok: false, reason: 'error' };
  }

  if (!options?.allowDuplicate) {
    const alreadyAdded = await wasTaskAddedToDeviceCalendar(input.taskId);
    if (alreadyAdded) {
      return { ok: false, reason: 'already_added' };
    }
  }

  try {
    const calendarId = await resolveWritableCalendarId(Calendar);
    if (calendarId === null) {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        return { ok: false, reason: 'permission_denied' };
      }
      return { ok: false, reason: 'no_calendar' };
    }

    const startDate = parseLocalDateString(dateKey);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: trimmedTitle,
      startDate,
      endDate,
      allDay: true,
      notes: input.eventNotes?.trim() || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    await markTaskAddedToDeviceCalendar(input.taskId);
    return { ok: true, eventId };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export type SyncSavedTaskToDeviceCalendarResult =
  | 'added'
  | 'skipped'
  | 'permission_denied'
  | 'failed';

/** Tras guardar una tarea con fecha: crea el evento en el Calendario del dispositivo. */
export async function syncSavedTaskToDeviceCalendar(input: {
  taskId: string | undefined;
  title: string;
  scheduledDate: string | null;
  eventNotes: string;
}): Promise<SyncSavedTaskToDeviceCalendarResult> {
  if (!input.taskId || !input.scheduledDate || !isDeviceCalendarSupported()) {
    return 'skipped';
  }

  const result = await addTaskToDeviceCalendar({
    taskId: input.taskId,
    title: input.title,
    scheduledDate: input.scheduledDate,
    eventNotes: input.eventNotes,
  });

  if (result.ok || result.reason === 'already_added') return 'added';
  if (result.reason === 'permission_denied') return 'permission_denied';
  return 'failed';
}

type DeviceCalendarAlertCopy = {
  permissionTitle: string;
  permissionBody: string;
  cancel: string;
  openSettings: string;
};

export function promptDeviceCalendarPermission(copy: DeviceCalendarAlertCopy): void {
  Alert.alert(copy.permissionTitle, copy.permissionBody, [
    { text: copy.cancel, style: 'cancel' },
    { text: copy.openSettings, onPress: () => void Linking.openSettings() },
  ]);
}
