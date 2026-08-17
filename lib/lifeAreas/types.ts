/** Área de vida personalizada — modelo visual (fase prototipo). */

export type LifeArea = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

/** Nivel de flexibilidad — sin presión de “prioridad productiva”. */
export type TaskFlexLevel = 'suggested' | 'soon' | 'flexible';

export type TaskLifeCardData = {
  id: string;
  title: string;
  areaId: string;
  flexLevel: TaskFlexLevel;
  dueDate?: string | null;
};

export type ReorganizeMoveItem = {
  taskId: string;
  title: string;
  areaEmoji: string;
  areaColor: string;
  fromLabel?: string;
  toLabel: string;
  fromDate?: string;
  toDate?: string;
  /** Fecha límite del proyecto o entrega, si aplica. */
  deadlineLabel?: string;
};

export type ReorganizeKeepItem = {
  taskId: string;
  title: string;
  areaEmoji: string;
  areaColor: string;
  dateLabel?: string;
  date?: string;
  deadlineLabel?: string;
};

export type ReorganizeWeekProposal = {
  headline: string;
  subline: string;
  moved: ReorganizeMoveItem[];
  kept: ReorganizeKeepItem[];
  freedHoursLabel?: string;
};

export type WhatChangedReason =
  | 'new_event'
  | 'less_time'
  | 'tired'
  | 'priorities_changed'
  | 'more_energy'
  | 'week_balance';

export type FloatingThoughtCard = {
  id: string;
  title: string;
  areaId: string;
  iconEmoji: string;
  layout: {
    top: number;
    left: number;
    rotate: string;
    scale?: number;
    zIndex: number;
    width?: number;
  };
};

export type WeekPlannerTaskStatus = 'done' | 'star' | 'pending';

export type WeekPlannerTask = {
  id: string;
  title: string;
  areaId: string;
  iconEmoji: string;
  timeLabel: string;
  durationLabel: string;
  status: WeekPlannerTaskStatus;
  scheduledDate: string;
};

export type TimelineBlock = {
  id: string;
  title: string;
  areaColor: string;
  startHour: number;
  durationHours: number;
  isNewEvent?: boolean;
};

export type DayTimelineModel = {
  dateLabel: string;
  blocks: TimelineBlock[];
  annotation?: string;
};

export type WeekPlannerDay = {
  id: string;
  shortLabel: string;
  fullLabel: string;
  isToday: boolean;
  summary: string;
  tasks: WeekPlannerTask[];
};

export type KoraaExperienceStep = 'brain_dump' | 'what_changed' | 'reorganizing' | 'success' | 'week';
