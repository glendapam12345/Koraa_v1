import type { AppLocale } from '@/lib/i18n';

interface ErrorMapping {
  pattern: string;
  messageEs: string;
  messageEn: string;
}

const errorMappings: ErrorMapping[] = [
  { pattern: 'user already registered', messageEs: 'Este correo ya está registrado', messageEn: 'This email is already registered' },
  { pattern: 'invalid login credentials', messageEs: 'Correo o contraseña incorrectos', messageEn: 'Incorrect email or password' },
  { pattern: 'email not confirmed', messageEs: 'Debes confirmar tu correo antes de entrar', messageEn: 'Confirm your email before signing in' },
  { pattern: 'user not found', messageEs: 'No hay una cuenta con este correo', messageEn: 'No account found with this email' },
  {
    pattern: 'password should be at least',
    messageEs: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
    messageEn: 'Password must be at least 8 characters with a letter and a number.',
  },
  {
    pattern: 'password is too weak',
    messageEs: 'Contraseña débil. Usa al menos 8 caracteres, una letra y un número.',
    messageEn: 'Weak password. Use at least 8 characters, a letter, and a number.',
  },
  {
    pattern: 'password has been found in an online data breach',
    messageEs: 'Esa contraseña es insegura (filtrada). Elige otra más fuerte.',
    messageEn: 'That password is unsafe (leaked). Choose a stronger one.',
  },
  {
    pattern: 'auth session missing',
    messageEs: 'Tu sesión de recuperación caducó. Solicita un nuevo código.',
    messageEn: 'Your recovery session expired. Request a new code.',
  },
  {
    pattern: 'session not found',
    messageEs: 'Tu sesión de recuperación caducó. Solicita un nuevo código.',
    messageEn: 'Your recovery session expired. Request a new code.',
  },
  {
    pattern: 'token has expired or is invalid',
    messageEs: 'El código expiró o no es válido. Solicita uno nuevo',
    messageEn: 'The code expired or is invalid. Request a new one',
  },
  { pattern: 'otp_expired', messageEs: 'El código expiró. Solicita uno nuevo', messageEn: 'The code expired. Request a new one' },
  { pattern: 'invalid otp', messageEs: 'Código incorrecto. Revísalo e inténtalo de nuevo', messageEn: 'Incorrect code. Check it and try again' },
  { pattern: 'too many requests', messageEs: 'Demasiados intentos. Espera un momento', messageEn: 'Too many attempts. Wait a moment' },
  { pattern: 'rate limit', messageEs: 'Demasiados intentos. Espera un momento', messageEn: 'Too many attempts. Wait a moment' },
  { pattern: 'email rate limit', messageEs: 'Se enviaron demasiados correos. Espera unos minutos', messageEn: 'Too many emails sent. Wait a few minutes' },
  {
    pattern: 'over_email_send_rate_limit',
    messageEs: 'Se enviaron demasiados correos. Espera antes de pedir otro código',
    messageEn: 'Too many emails sent. Wait before requesting another code',
  },
  { pattern: 'fetch failed', messageEs: 'Error de conexión. Comprueba tu internet', messageEn: 'Connection error. Check your internet' },
  { pattern: 'network', messageEs: 'Error de conexión. Comprueba tu internet', messageEn: 'Connection error. Check your internet' },
  { pattern: 'timeout', messageEs: 'La solicitud tardó demasiado. Inténtalo de nuevo', messageEn: 'The request took too long. Please try again' },
  { pattern: 'session expired', messageEs: 'Tu sesión expiró. Inicia sesión otra vez', messageEn: 'Your session expired. Sign in again' },
  { pattern: 'refresh token', messageEs: 'Sesión no válida. Inicia sesión otra vez', messageEn: 'Invalid session. Sign in again' },
];

const fallback: Record<AppLocale, string> = {
  es: 'Ocurrió un error inesperado. Inténtalo de nuevo',
  en: 'Something went wrong. Please try again',
};

export function translateError(error: string | Error | unknown, locale: AppLocale = 'es'): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  for (const mapping of errorMappings) {
    if (lowerMessage.includes(mapping.pattern.toLowerCase())) {
      return locale === 'en' ? mapping.messageEn : mapping.messageEs;
    }
  }

  if (__DEV__) {
    console.warn('Error de auth sin mapear:', errorMessage);
  }
  return fallback[locale];
}
