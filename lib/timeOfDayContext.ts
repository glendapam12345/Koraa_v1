export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export function getHourOfDay(date: Date = new Date()): number {
  return date.getHours();
}

/** Mañana 5–11 · Tarde 12–17 · Atardecer 18–21 · Noche 22–4 */
export function getTimeOfDayPeriod(hour: number = getHourOfDay()): TimeOfDayPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/** Madrugada o muy tarde — tono acompañante, sin empujar productividad. */
export function isLateNight(hour: number = getHourOfDay()): boolean {
  return hour >= 22 || hour < 5;
}

export function isNighttime(hour: number = getHourOfDay()): boolean {
  return hour >= 18 || hour < 6;
}

export type TimeOfDayGreetingKey =
  | 'hoy.greetingMorning'
  | 'hoy.greetingAfternoon'
  | 'hoy.greetingEvening'
  | 'hoy.greetingNight';

export function getTimeOfDayGreetingKey(period: TimeOfDayPeriod = getTimeOfDayPeriod()): TimeOfDayGreetingKey {
  switch (period) {
    case 'morning':
      return 'hoy.greetingMorning';
    case 'afternoon':
      return 'hoy.greetingAfternoon';
    case 'evening':
      return 'hoy.greetingEvening';
    case 'night':
      return 'hoy.greetingNight';
  }
}

export type TimeOfDayChipKey =
  | 'hoy.timeChipMorning'
  | 'hoy.timeChipAfternoon'
  | 'hoy.timeChipEvening'
  | 'hoy.timeChipNight';

export function getTimeOfDayChipKey(period: TimeOfDayPeriod = getTimeOfDayPeriod()): TimeOfDayChipKey {
  switch (period) {
    case 'morning':
      return 'hoy.timeChipMorning';
    case 'afternoon':
      return 'hoy.timeChipAfternoon';
    case 'evening':
      return 'hoy.timeChipEvening';
    case 'night':
      return 'hoy.timeChipNight';
  }
}
