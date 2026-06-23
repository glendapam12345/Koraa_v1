import { router } from 'expo-router';

export type OpenVaciarCaptureOptions = {
  date?: string;
  projectId?: string;
  suggestion?: string;
};

/** Abre Tareas → Capturar (mismo flujo que brain dump + preview por áreas). */
export function openVaciarTab(): void {
  openVaciarCapture();
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

  router.navigate({
    pathname: '/(tabs)/vaciar',
    params,
  });
}
