export type VaciarCaptureSource = 'hoy' | 'semana' | 'tips' | 'project' | '';

export type OpenVaciarCaptureOptions = {
  date?: string;
  projectId?: string;
  suggestion?: string;
  source?: Exclude<VaciarCaptureSource, ''>;
};

export type VaciarCaptureParams = {
  segment: 'capture';
  fresh: '1';
  stamp: string;
  date: string;
  projectId: string;
  suggestion: string;
  source: VaciarCaptureSource;
};

export function firstSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function isFreshCaptureRequest(fresh: string | string[] | undefined): boolean {
  return firstSearchParam(fresh) === '1';
}

export function isHoyCaptureSource(source: string | string[] | undefined): boolean {
  return firstSearchParam(source) === 'hoy';
}

/** Params para abrir Tareas limpio. `undefined` no borra query params en Expo Router. */
export function buildVaciarCaptureParams(
  options?: OpenVaciarCaptureOptions,
  stamp: string = String(Date.now()),
): VaciarCaptureParams {
  return {
    segment: 'capture',
    fresh: '1',
    stamp,
    date: options?.date ?? '',
    projectId: options?.projectId ?? '',
    suggestion: options?.suggestion ?? '',
    source: options?.source ?? '',
  };
}
