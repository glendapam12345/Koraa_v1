/**
 * Sistema de logging para la aplicación Kora
 * 
 * Proporciona diferentes niveles de logging:
 * - debug: Solo en desarrollo
 * - info: Información general
 * - warn: Advertencias
 * - error: Errores críticos
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
}

const isDevelopment = __DEV__;

export const logger: Logger = {
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },

  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    // En producción, podrías enviar a un servicio de tracking
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error !== undefined ? error : '');
    // En producción, enviar a un servicio de tracking (Sentry, etc.)
    // if (!isDevelopment) {
    //   // Sentry.captureException(error);
    // }
  },
};
