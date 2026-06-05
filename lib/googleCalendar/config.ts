import { Platform } from 'react-native';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'] as const;

export const GOOGLE_CALENDAR_SCOPES = [...SCOPES];

export function getGoogleOAuthClientId(): string | null {
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

  if (Platform.OS === 'ios' && ios) return ios;
  if (Platform.OS === 'android' && android) return android;
  if (web) return web;
  if (ios) return ios;
  if (android) return android;
  return null;
}

export function isGoogleCalendarConfigured(): boolean {
  return getGoogleOAuthClientId() != null;
}

export const GOOGLE_OAUTH_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
} as const;

export const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
