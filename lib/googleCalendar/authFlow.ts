import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_OAUTH_DISCOVERY,
  getGoogleOAuthClientId,
  isGoogleCalendarConfigured,
} from '@/lib/googleCalendar/config';
import {
  fetchGoogleAccountEmail,
  getValidGoogleAccessToken,
} from '@/lib/googleCalendar/api';
import {
  clearGoogleCalendarTokens,
  loadGoogleCalendarTokens,
  saveGoogleCalendarTokens,
  type GoogleCalendarTokens,
} from '@/lib/googleCalendar/tokenStore';

try {
  WebBrowser.maybeCompleteAuthSession();
} catch {
  /* Expo Go / missing native module */
}

export type GoogleCalendarConnectResult =
  | { ok: true; email?: string }
  | { ok: false; reason: 'not_configured' | 'cancelled' | 'error' };

export function getGoogleOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'myapp',
    path: 'oauth/google',
  });
}

function tokensFromAuthResponse(
  authentication: AuthSession.TokenResponse,
): GoogleCalendarTokens | null {
  const accessToken = authentication.accessToken;
  if (!accessToken) return null;

  const expiresIn =
    typeof authentication.expiresIn === 'number' ? authentication.expiresIn : 3600;

  return {
    accessToken,
    refreshToken: authentication.refreshToken ?? null,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export async function connectGoogleCalendar(userId: string): Promise<GoogleCalendarConnectResult> {
  if (!userId || !isGoogleCalendarConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }

  const clientId = getGoogleOAuthClientId();
  if (!clientId) {
    return { ok: false, reason: 'not_configured' };
  }

  const redirectUri = getGoogleOAuthRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: [...GOOGLE_CALENDAR_SCOPES],
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  await request.makeAuthUrlAsync(GOOGLE_OAUTH_DISCOVERY);

  const result = await request.promptAsync(GOOGLE_OAUTH_DISCOVERY, {
    showInRecents: true,
  });

  if (result.type !== 'success') {
    return { ok: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : 'error' };
  }

  const code = result.params.code;
  if (!code) {
    return { ok: false, reason: 'error' };
  }

  try {
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier ?? '',
        },
      },
      GOOGLE_OAUTH_DISCOVERY,
    );

    const tokens = tokensFromAuthResponse(tokenResult);
    if (!tokens) {
      return { ok: false, reason: 'error' };
    }

    const email = await fetchGoogleAccountEmail(tokens.accessToken);
    await saveGoogleCalendarTokens(userId, { ...tokens, email });

    return { ok: true, email };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  if (!userId) return;

  const stored = await loadGoogleCalendarTokens(userId);
  if (stored?.accessToken) {
    try {
      await fetch(
        `${GOOGLE_OAUTH_DISCOVERY.revocationEndpoint}?token=${encodeURIComponent(stored.accessToken)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
    } catch {
      /* ignore revoke errors */
    }
  }

  await clearGoogleCalendarTokens(userId);
}

export async function getGoogleCalendarConnectionInfo(userId: string): Promise<{
  connected: boolean;
  email?: string;
}> {
  if (!userId || !isGoogleCalendarConfigured()) {
    return { connected: false };
  }

  const stored = await loadGoogleCalendarTokens(userId);
  if (!stored) {
    return { connected: false };
  }

  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) {
    return { connected: false };
  }

  return {
    connected: true,
    email: stored.email,
  };
}
