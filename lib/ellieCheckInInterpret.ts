export function energyBand(energyLevel: number): 'low' | 'ok' | 'high' {
  if (energyLevel <= 2) return 'low';
  if (energyLevel >= 4) return 'high';
  return 'ok';
}

export function mindBand(focusLevel: string): 'foggy' | 'cloudy' | 'ok' | 'clear' {
  const f = focusLevel.trim().toLowerCase();
  if (/muy distra|scattered|foggy|niebla/.test(f)) return 'foggy';
  if (/algo distra|somewhat|nubl|cloud/.test(f)) return 'cloudy';
  if (/s[uú]per enfoc|very focus|clara|clear|presente|present/.test(f)) return 'clear';
  if (/^enfocada$|^focused$/.test(f) || /enfocad|focus/.test(f)) return 'clear';
  return 'ok';
}

export function timeBand(availableTime: string): 'little' | 'some' | 'plenty' | 'allDay' {
  const t = availableTime.trim().toLowerCase();
  if (/poco|little|1-2/.test(t)) return 'little';
  if (/bastante|plenty|4-6/.test(t)) return 'plenty';
  if (/todo el d[ií]a|all.?day|whole day/.test(t)) return 'allDay';
  return 'some';
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
