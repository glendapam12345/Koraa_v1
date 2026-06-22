import { useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import {
  getTimeOfDayChipKey,
  getTimeOfDayGreetingKey,
  getTimeOfDayPeriod,
  isLateNight,
  isNighttime,
  type TimeOfDayPeriod,
} from '@/lib/timeOfDayContext';

export function useKoraaGreeting() {
  const { t } = useI18n();

  return useMemo(() => {
    const period = getTimeOfDayPeriod();
    const lateNight = isLateNight();
    const nighttime = isNighttime();

    return {
      period,
      lateNight,
      nighttime,
      greeting: t(getTimeOfDayGreetingKey(period)),
      timeChipLabel: t(getTimeOfDayChipKey(period)),
      greetingSubline: lateNight ? t('hoy.greetingSublineNight') : t('hoy.greetingSubline'),
      headerSubtitle: lateNight ? t('hoy.headerSubtitleNight') : t('hoy.headerSubtitle'),
    };
  }, [t]);
}

export type KoraaGreetingContext = ReturnType<typeof useKoraaGreeting>;

export function formatGreetingWithName(
  t: (key: string, params?: Record<string, string | number>) => string,
  greeting: string,
  name: string,
): string {
  return t('hoy.inicio.greetingWithName', { greeting, name });
}

export function formatNightReturnGreeting(
  t: (key: string, params?: Record<string, string | number>) => string,
  name: string,
  period: TimeOfDayPeriod,
): string {
  const greeting = t(getTimeOfDayGreetingKey(period));
  return t('hoy.nightReturnGreeting', { greeting, name });
}
