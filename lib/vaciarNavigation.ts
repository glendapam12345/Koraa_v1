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
  router.navigate({
    pathname: '/(tabs)/vaciar',
    params: {
      segment: 'capture',
      fresh: '1',
      // Limpiar params viejos cuando no se pasan de nuevo (navigate hace merge).
      date: options?.date ?? '',
      projectId: options?.projectId ?? '',
      suggestion: options?.suggestion ?? '',
    },
  });
}
