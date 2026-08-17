export function energyBand(energyLevel: number): 'low' | 'ok' | 'high' {
  if (energyLevel <= 2) return 'low';
  if (energyLevel >= 4) return 'high';
  return 'ok';
}

export function mindBand(focusLevel: string): 'foggy' | 'cloudy' | 'ok' | 'clear' {
  const f = focusLevel.trim().toLowerCase();
  if (/niebla|foggy|muy/.test(f) && /nubl|cloud|fog/.test(f)) return 'foggy';
  if (/niebla|foggy|muy nubl/.test(f)) return 'foggy';
  if (/nubl|cloud/.test(f)) return 'cloudy';
  if (/clara|clear|presente|present/.test(f)) return 'clear';
  return 'ok';
}

/**
 * One Ellie line after check-in: what she understood + what Koraa will do.
 */
export function buildEllieAdaptMessage(params: {
  emotionLabel: string;
  energyLevel: number;
  focusLevel: string;
  hasTasks: boolean;
  gotYou: string;
  summary: string;
  lighter: string;
  freeDay: string;
}): string {
  const parts = [params.gotYou.trim(), params.summary.trim()].filter(Boolean);
  parts.push(params.hasTasks ? params.lighter.trim() : params.freeDay.trim());
  return parts.filter(Boolean).join(' ');
}
