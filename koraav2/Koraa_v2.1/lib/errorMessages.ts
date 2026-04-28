interface ErrorMapping {
  pattern: string;
  message: string;
}

/** Mensajes claros (español) para errores de auth / red comunes. */
const errorMappings: ErrorMapping[] = [
  { pattern: 'user already registered', message: 'Este correo ya está registrado' },
  { pattern: 'invalid login credentials', message: 'Correo o contraseña incorrectos' },
  { pattern: 'email not confirmed', message: 'Debes confirmar tu correo antes de entrar' },
  { pattern: 'user not found', message: 'No hay una cuenta con este correo' },
  { pattern: 'password should be at least', message: 'La contraseña debe tener al menos 8 caracteres' },
  { pattern: 'password is too weak', message: 'La contraseña es demasiado débil' },
  {
    pattern: 'token has expired or is invalid',
    message: 'El código expiró o no es válido. Solicita uno nuevo',
  },
  { pattern: 'otp_expired', message: 'El código expiró. Solicita uno nuevo' },
  { pattern: 'invalid otp', message: 'Código incorrecto. Revísalo e inténtalo de nuevo' },
  { pattern: 'too many requests', message: 'Demasiados intentos. Espera un momento' },
  { pattern: 'rate limit', message: 'Demasiados intentos. Espera un momento' },
  { pattern: 'email rate limit', message: 'Se enviaron demasiados correos. Espera unos minutos' },
  {
    pattern: 'over_email_send_rate_limit',
    message: 'Se enviaron demasiados correos. Espera antes de pedir otro código',
  },
  { pattern: 'fetch failed', message: 'Error de conexión. Comprueba tu internet' },
  { pattern: 'network', message: 'Error de conexión. Comprueba tu internet' },
  { pattern: 'timeout', message: 'La solicitud tardó demasiado. Inténtalo de nuevo' },
  { pattern: 'session expired', message: 'Tu sesión expiró. Inicia sesión otra vez' },
  { pattern: 'refresh token', message: 'Sesión no válida. Inicia sesión otra vez' },
];

export function translateError(error: string | Error | unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  for (const mapping of errorMappings) {
    if (lowerMessage.includes(mapping.pattern.toLowerCase())) {
      return mapping.message;
    }
  }

  if (__DEV__) {
    console.warn('Error de auth sin mapear:', errorMessage);
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo';
}
