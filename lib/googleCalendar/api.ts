import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeScheduledDate, parseLocalDateString } from '@/lib/dateLocal';
import { GOOGLE_CALENDAR_API_BASE } from '@/lib/googleCalendar/config';
import {
  loadGoogleCalendarTokens,
  saveGoogleCalendarTokens,
  type GoogleCalendarTokens,
} from '@/lib/googleCalendar/tokenStore';
import { getGoogleOAuthClientId } from '@/lib/googleCalendar/config';

const EVENT_STORAGE_PREFIX = 'koraa_google_calendar_event:';

export type AddTaskToGoogleCalendarInput = {
  userId: string;
  taskId: string;
  title: string;
  scheduledDate: string;
  eventNotes?: string;
};

export type AddTaskToGoogleCalendarResult =
  | { ok: true; eventId: string }
  | {
      ok: false;
      reason:
        | 'not_configured'
        | 'not_connected'
        | 'token_refresh_failed'
        | 'already_added'
        | 'error';
    };

async function wasTaskAddedToGoogleCalendar(taskId: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${EVENT_STORAGE_PREFIX}${taskId}`);
    return Boolean(value);
  } catch {
    return false;
  }
}

async function markTaskAddedToGoogleCalendar(taskId: string, eventId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${EVENT_STORAGE_PREFIX}${taskId}`, eventId);
  } catch {
    /* ignore */
  }
}

function buildAllDayEventPayload(title: string, scheduledDate: string, notes?: string) {
  const dateKey = normalizeScheduledDate(scheduledDate);
  if (!dateKey) throw new Error('invalid_date');

  const start = parseLocalDateString(dateKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  };

  return {
    summary: title.trim(),
    description: notes?.trim() || undefined,
    start: { date: formatDate(start) },
    end: { date: formatDate(end) },
  };
}

async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleCalendarTokens | null> {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) return null;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!data.access_token) return null;

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const stored = await loadGoogleCalendarTokens(userId);
  if (!stored?.accessToken) return null;

  const stillValid = stored.expiresAt - Date.now() > 60_000;
  if (stillValid) return stored.accessToken;

  if (!stored.refreshToken) return null;

  const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
  if (!refreshed) return null;

  await saveGoogleCalendarTokens(userId, {
    ...stored,
    ...refreshed,
  });

  return refreshed.accessToken;
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return undefined;
    const data = (await response.json()) as { email?: string };
    return data.email?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function addTaskToGoogleCalendar(
  input: AddTaskToGoogleCalendarInput,
  options?: { allowDuplicate?: boolean },
): Promise<AddTaskToGoogleCalendarResult> {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) {
    return { ok: false, reason: 'not_configured' };
  }

  const trimmedTitle = input.title.trim();
  const dateKey = normalizeScheduledDate(input.scheduledDate);
  if (!trimmedTitle || !dateKey) {
    return { ok: false, reason: 'error' };
  }

  if (!options?.allowDuplicate) {
    const alreadyAdded = await wasTaskAddedToGoogleCalendar(input.taskId);
    if (alreadyAdded) {
      return { ok: false, reason: 'already_added' };
    }
  }

  const accessToken = await getValidGoogleAccessToken(input.userId);
  if (!accessToken) {
    return { ok: false, reason: 'not_connected' };
  }

  try {
    const body = buildAllDayEventPayload(trimmedTitle, dateKey, input.eventNotes);
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (response.status === 401) {
      return { ok: false, reason: 'token_refresh_failed' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'error' };
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      return { ok: false, reason: 'error' };
    }

    await markTaskAddedToGoogleCalendar(input.taskId, data.id);
    return { ok: true, eventId: data.id };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function isGoogleCalendarConnected(userId: string): Promise<boolean> {
  const token = await getValidGoogleAccessToken(userId);
  return Boolean(token);
}
