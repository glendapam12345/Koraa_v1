import { router } from 'expo-router';

export type OpenVaciarCaptureOptions = {
  date?: string;
  projectId?: string;
  suggestion?: string;
};

/** Abre la pestaña Tareas (sin forzar captura). */
export function openVaciarTab(): void {
  router.push('/(tabs)/vaciar');
}

/** Abre Tareas → Capturar con formulario limpio (desde Hoy, Semana, etc.). */
export function openVaciarCapture(options?: OpenVaciarCaptureOptions): void {
  const params: Record<string, string> = {
    segment: 'capture',
    fresh: '1',
  };
  if (options?.date) params.date = options.date;
  if (options?.projectId) params.projectId = options.projectId;
  if (options?.suggestion) params.suggestion = options.suggestion;

  router.push({
    pathname: '/(tabs)/vaciar',
    params,
  });
}
