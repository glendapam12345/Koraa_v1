import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';

const KEY = 'koraa_return_tomorrow_toast_v1';

type ReturnTomorrowToastPayload = {
  timeLabel: string;
  /** Día local en que se marcó el toast (YYYY-MM-DD). */
  markedOn: string;
};

function parsePayload(raw: string | null): ReturnTomorrowToastPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ReturnTomorrowToastPayload>;
    if (typeof parsed.timeLabel === 'string' && typeof parsed.markedOn === 'string') {
      return { timeLabel: parsed.timeLabel, markedOn: parsed.markedOn };
    }
  } catch {
    // Formato legacy: solo la hora como string plano
    if (raw.trim()) {
      return { timeLabel: raw, markedOn: getLocalDateString() };
    }
  }
  return null;
}

/** Tras check-in: Hoy muestra invitación suave a volver mañana a la hora del recordatorio. */
export async function markReturnTomorrowToast(timeLabel: string): Promise<void> {
  try {
    const payload: ReturnTomorrowToastPayload = {
      timeLabel,
      markedOn: getLocalDateString(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** Lee sin borrar. Ignora toasts de otro día calendario. */
export async function peekReturnTomorrowToast(): Promise<string | null> {
  try {
    const payload = parsePayload(await AsyncStorage.getItem(KEY));
    if (!payload) return null;
    if (payload.markedOn !== getLocalDateString()) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return payload.timeLabel;
  } catch {
    return null;
  }
}

export async function consumeReturnTomorrowToast(): Promise<string | null> {
  try {
    const timeLabel = await peekReturnTomorrowToast();
    if (!timeLabel) return null;
    await AsyncStorage.removeItem(KEY);
    return timeLabel;
  } catch {
    return null;
  }
}
