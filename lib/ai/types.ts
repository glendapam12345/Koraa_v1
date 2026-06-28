import type { AppLocale } from '@/lib/i18n';
import type { TipCategoryId } from '@/lib/tipsTypes';
import type { HoyCoachMessage } from '@/lib/hoyDailyCoach';

export type KoraaDayContextFocusTask = {
  id: string;
  content: string;
};

export type KoraaDayContext = {
  locale: AppLocale;
  date: string;
  displayName: string;
  checkIn: {
    emotionKey: string;
    emotionLabel: string;
    energyLevel: number;
    availableTime: string;
    focusLevel: string;
  };
  plan: {
    suggestion: string;
    focusCount: number;
    focusTasks: KoraaDayContextFocusTask[];
    pendingCount: number;
  };
};

export type TipCandidate = {
  id: string;
  category: TipCategoryId;
  title: string;
};

export type TaskCandidate = {
  id: string;
  content: string;
  category: string;
  score?: number;
};

export type KoraaDailyBrief = {
  coach: HoyCoachMessage;
  tipIds: string[];
  tipLead: string;
  /** Pasos sugeridos para hoy (orden importa). */
  focusTaskIds: string[];
  planHeadline: string;
  fromAi: boolean;
  focusFromAi: boolean;
};

export type KoraaWeekDaySummary = {
  date: string;
  dayName: string;
  openCount: number;
  isToday: boolean;
  checkIn?: {
    emotionKey: string;
    emotionLabel: string;
    energyLevel: number;
  };
};

export type KoraaWeekContext = {
  locale: AppLocale;
  displayName: string;
  weekStart: string;
  weekEnd: string;
  totals: {
    openTasks: number;
    completedTasks: number;
    checkInDays: number;
    busiestDay: string | null;
    busiestDayName: string | null;
    busiestDayCount: number;
  };
  today?: {
    emotionKey: string;
    emotionLabel: string;
    energyLevel: number;
  };
  days: KoraaWeekDaySummary[];
};

export type KoraaWeeklyBrief = {
  headline: string;
  summary: string;
  gentleAdvice: string;
  fromAi: boolean;
};
