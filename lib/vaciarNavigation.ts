import { router } from 'expo-router';
import {
  buildVaciarCaptureParams,
  type OpenVaciarCaptureOptions,
} from '@/lib/vaciarCaptureParams';

export type { OpenVaciarCaptureOptions } from '@/lib/vaciarCaptureParams';
export { goToHoyTab, HOY_TAB_HREF } from '@/lib/tabNavigation';

/** Abre Tareas → Capturar (mismo flujo que brain dump + preview por áreas). */
export function openVaciarTab(): void {
  openVaciarCapture();
}

/** Abre Tareas → Capturar con formulario limpio (desde Hoy, Semana, etc.). */
export function openVaciarCapture(options?: OpenVaciarCaptureOptions): void {
  router.navigate({
    pathname: '/(tabs)/vaciar',
    params: buildVaciarCaptureParams(options),
  });
}

