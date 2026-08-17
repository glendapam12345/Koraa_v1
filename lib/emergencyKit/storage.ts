import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ComfortItem,
  EmergencyKitPreferences,
  EmergencyKitSessionState,
  NewComfortItem,
  SelfLetter,
} from './types';

const ITEMS_KEY = '@koraa/emergency_kit/items';
const PREFS_KEY = '@koraa/emergency_kit/preferences';
const CRISIS_KEY = '@koraa/emergency_kit/crisis_mode';
const CRISIS_UNTIL_KEY = '@koraa/emergency_kit/crisis_until';
const LAST_SESSION_KEY = '@koraa/emergency_kit/last_session';

const CRISIS_DURATION_MS = 48 * 60 * 60 * 1000;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadComfortItems(): Promise<ComfortItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ComfortItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveComfortItems(items: ComfortItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function addComfortItem(item: NewComfortItem): Promise<ComfortItem> {
  const items = await loadComfortItems();
  const next = { ...item, id: uid(), createdAt: new Date().toISOString() } as ComfortItem;
  items.unshift(next);
  await saveComfortItems(items);
  return next;
}

export async function removeComfortItem(id: string): Promise<void> {
  const items = await loadComfortItems();
  await saveComfortItems(items.filter((i) => i.id !== id));
}

export async function loadPreferences(): Promise<EmergencyKitPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as EmergencyKitPreferences;
  } catch {
    return {};
  }
}

export async function savePreferences(prefs: EmergencyKitPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function setCrisisMode(active: boolean): Promise<void> {
  if (active) {
    await AsyncStorage.multiSet([
      [CRISIS_KEY, '1'],
      [CRISIS_UNTIL_KEY, String(Date.now() + CRISIS_DURATION_MS)],
    ]);
    return;
  }
  await AsyncStorage.multiRemove([CRISIS_KEY, CRISIS_UNTIL_KEY]);
}

export async function clearCrisisMode(): Promise<void> {
  await setCrisisMode(false);
}

export async function isCrisisModeActive(): Promise<boolean> {
  try {
    const [flag, untilRaw] = await AsyncStorage.multiGet([CRISIS_KEY, CRISIS_UNTIL_KEY]);
    if (flag[1] !== '1') return false;
    const until = untilRaw[1] ? Number(untilRaw[1]) : 0;
    if (until > 0 && Date.now() > until) {
      await clearCrisisMode();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function saveLastSession(session: EmergencyKitSessionState): Promise<void> {
  await AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session));
}

export async function loadLastSession(): Promise<EmergencyKitSessionState | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmergencyKitSessionState;
  } catch {
    return null;
  }
}

export function filterLettersForEvent(
  letters: SelfLetter[],
  eventId: string
): SelfLetter[] {
  return letters.filter(
    (l) => l.eventTags.includes(eventId as SelfLetter['eventTags'][number]) || l.eventTags.length === 0
  );
}

export function getItemTitle(item: ComfortItem): string {
  if (item.type === 'letters') return item.content.slice(0, 48);
  if (item.type === 'support_circle') return item.name;
  return item.title;
}
