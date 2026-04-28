import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'koraa.dailyReminderTime';

export type DailyReminderTime = { hour: number; minute: number };

const DEFAULT: DailyReminderTime = { hour: 9, minute: 0 };

function clampHour(h: number): number {
  if (Number.isNaN(h) || h < 0) return DEFAULT.hour;
  return Math.min(23, Math.max(0, Math.floor(h)));
}

function clampMinute(m: number): number {
  if (Number.isNaN(m) || m < 0) return DEFAULT.minute;
  return Math.min(59, Math.max(0, Math.floor(m)));
}

export async function getDailyReminderTime(): Promise<DailyReminderTime> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as { hour?: number; minute?: number };
    return {
      hour: clampHour(parsed.hour ?? DEFAULT.hour),
      minute: clampMinute(parsed.minute ?? DEFAULT.minute),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export async function setDailyReminderTime(time: DailyReminderTime): Promise<void> {
  const normalized = {
    hour: clampHour(time.hour),
    minute: clampMinute(time.minute),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export const DAILY_REMINDER_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: '7:00', hour: 7, minute: 0 },
  { label: '8:00', hour: 8, minute: 0 },
  { label: '8:30', hour: 8, minute: 30 },
  { label: '9:00', hour: 9, minute: 0 },
  { label: '12:00', hour: 12, minute: 0 },
  { label: '18:00', hour: 18, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
];

export function formatReminderTime(t: DailyReminderTime): string {
  const h = t.hour.toString().padStart(2, '0');
  const m = t.minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}
