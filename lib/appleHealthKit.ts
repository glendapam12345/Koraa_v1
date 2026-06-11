import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import {
  getLastNightSleepWindow,
  isShortSleep,
  summarizeLastNightSleep,
  type LastNightSleepSummary,
  type SleepSample,
} from '@/lib/appleHealthSleep';

const SLEEP_CACHE_KEY = 'koraa_last_night_sleep_hours';
const SLEEP_CACHE_DATE_KEY = 'koraa_last_night_sleep_cached_on';

type HealthKitModule = {
  initHealthKit: (
    permissions: { permissions: { read: string[]; write: string[] } },
    callback: (error: string) => void,
  ) => void;
  getSleepSamples: (
    options: { startDate: string; endDate: string; ascending?: boolean },
    callback: (error: string, results: SleepSample[]) => void,
  ) => void;
  Constants: { Permissions: { SleepAnalysis: string } };
};

let healthKitModule: HealthKitModule | null | undefined;

function loadHealthKitModule(): HealthKitModule | null {
  if (healthKitModule !== undefined) return healthKitModule;
  if (Platform.OS !== 'ios') {
    healthKitModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-health') as HealthKitModule & { default?: HealthKitModule };
    const kit = mod.default ?? mod;
    if (!kit?.initHealthKit || !kit.Constants?.Permissions?.SleepAnalysis) {
      healthKitModule = null;
      return null;
    }
    healthKitModule = kit;
    return kit;
  } catch {
    healthKitModule = null;
    return null;
  }
}

export function isHealthKitNativeAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (!NativeModules.AppleHealthKit) return false;
  return loadHealthKitModule() !== null;
}

function promisifyInit(kit: HealthKitModule): Promise<void> {
  return new Promise((resolve, reject) => {
    kit.initHealthKit(
      {
        permissions: {
          read: [kit.Constants.Permissions.SleepAnalysis],
          write: [],
        },
      },
      (error: string) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve();
      },
    );
  });
}

function promisifySleepSamples(
  kit: HealthKitModule,
  startDate: Date,
  endDate: Date,
): Promise<SleepSample[]> {
  return new Promise((resolve, reject) => {
    kit.getSleepSamples(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: true,
      },
      (error: string, results: SleepSample[]) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve(results ?? []);
      },
    );
  });
}

function todayCacheKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export async function readCachedLastNightSleep(): Promise<number | null> {
  try {
    const cachedOn = await AsyncStorage.getItem(SLEEP_CACHE_DATE_KEY);
    if (cachedOn !== todayCacheKey()) return null;
    const raw = await AsyncStorage.getItem(SLEEP_CACHE_KEY);
    if (!raw) return null;
    const hours = Number.parseFloat(raw);
    return Number.isFinite(hours) && hours > 0 ? hours : null;
  } catch {
    return null;
  }
}

async function cacheLastNightSleep(hours: number): Promise<void> {
  await AsyncStorage.multiSet([
    [SLEEP_CACHE_KEY, String(hours)],
    [SLEEP_CACHE_DATE_KEY, todayCacheKey()],
  ]);
}

export async function clearSleepCache(): Promise<void> {
  await AsyncStorage.multiRemove([SLEEP_CACHE_KEY, SLEEP_CACHE_DATE_KEY]);
}

export type HealthKitSleepAccessResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'denied' | 'error'; message?: string };

export async function requestHealthKitSleepAccess(): Promise<HealthKitSleepAccessResult> {
  const kit = loadHealthKitModule();
  if (!kit || !isHealthKitNativeAvailable()) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    await promisifyInit(kit);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('denied') || message.includes('1')) {
      return { ok: false, reason: 'denied', message };
    }
    return { ok: false, reason: 'error', message };
  }
}

export async function fetchLastNightSleepFromHealthKit(): Promise<LastNightSleepSummary | null> {
  const kit = loadHealthKitModule();
  if (!kit || !isHealthKitNativeAvailable()) return null;

  try {
    await promisifyInit(kit);
    const { start, end } = getLastNightSleepWindow();
    const samples = await promisifySleepSamples(kit, start, end);
    const summary = summarizeLastNightSleep(samples);
    if (summary) {
      await cacheLastNightSleep(summary.hours);
    }
    return summary;
  } catch {
    return readCachedLastNightSleep().then((hours) =>
      hours != null
        ? {
            hours,
            isShort: isShortSleep(hours),
            windowStart: '',
            windowEnd: '',
          }
        : null,
    );
  }
}
