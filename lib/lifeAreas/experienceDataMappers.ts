import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { getProjectEmoji } from '@/lib/projectEmoji';
import { redistributeLooseTasks } from '@/lib/redistributeWorkload';
import type {
  DayTimelineModel,
  FloatingThoughtCard,
  LifeArea,
  ReorganizeWeekProposal,
  TimelineBlock,
  WeekPlannerDay,
  WeekPlannerTask,
  WhatChangedReason,
} from '@/lib/lifeAreas/types';
import { LOOSE_LIFE_AREA_ID, resolveLifeArea } from '@/lib/lifeAreas/projectToLifeArea';

export type ExperienceTask = {
  id: string;
  content: string;
  project_id: string | null;
  scheduled_date: string | null;
  is_completed: boolean;
  is_priority: boolean;
};

const FLOAT_LAYOUTS: FloatingThoughtCard['layout'][] = [
  { top: 8, left: 8, rotate: '-4deg', zIndex: 4, width: 148 },
  { top: 48, left: 162, rotate: '5deg', zIndex: 5, width: 132 },
  { top: 118, left: 20, rotate: '3deg', zIndex: 3, width: 128 },
  { top: 96, left: 172, rotate: '-6deg', zIndex: 6, width: 120 },
  { top: 188, left: 82, rotate: '-2deg', zIndex: 2, width: 140 },
  { top: 168, left: 4, rotate: '6deg', zIndex: 7, width: 136 },
  { top: 248, left: 150, rotate: '4deg', zIndex: 1, width: 124 },
];

export function tasksToFloatingThoughts(
  tasks: ExperienceTask[],
  areaIndex: Map<string, LifeArea>,
): FloatingThoughtCard[] {
  const open = tasks.filter((task) => !task.is_completed);
  return open.slice(0, FLOAT_LAYOUTS.length).map((task, index) => {
    const areaId = task.project_id ?? LOOSE_LIFE_AREA_ID;
    const area = resolveLifeArea(areaIndex, task.project_id);
    return {
      id: task.id,
      title: task.content,
      areaId,
      iconEmoji: area.emoji || getProjectEmoji(task.content),
      layout: { ...FLOAT_LAYOUTS[index], zIndex: FLOAT_LAYOUTS[index].zIndex + index },
    };
  });
}

function addDays(iso: string, days: number): string {
  const date = parseLocalDateString(iso);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

function dayLabel(iso: string, locale: AppLocale): string {
  return formatProposalScheduleLabel(iso, locale);
}

/** Etiqueta legible para propuestas: «vie 20 jun» / «Fri, Jun 20». */
export function formatProposalScheduleLabel(iso: string, locale: AppLocale): string {
  const date = parseLocalDateString(iso);
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatProposalDeadlineLabel(
  iso: string | null | undefined,
  locale: AppLocale,
): string | undefined {
  if (!iso?.trim()) return undefined;
  const date = parseLocalDateString(iso.trim());
  const formatted = date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    day: 'numeric',
    month: 'short',
  });
  return locale === 'en' ? `Due ${formatted}` : `Límite ${formatted}`;
}

function resolveTaskDeadline(
  task: ExperienceTask,
  projectDueDates?: Record<string, string | null>,
): string | undefined {
  if (!task.project_id || !projectDueDates) return undefined;
  return projectDueDates[task.project_id] ?? undefined;
}

const PROPOSAL_COPY: Record<
  WhatChangedReason,
  { headline: Record<AppLocale, string>; subline: Record<AppLocale, string> }
> = {
  new_event: {
    headline: { es: 'Acomodé espacio para lo inesperado', en: 'I made room for the unexpected' },
    subline: {
      es: 'Moví lo flexible; lo urgente se queda. Revisa en Calendario.',
      en: 'I moved flexible items; urgent ones stay. Check Calendar.',
    },
  },
  less_time: {
    headline: { es: 'Repartí con más calma', en: 'I spread things more gently' },
    subline: {
      es: 'Menos por día, sin perder de vista los límites.',
      en: 'Less per day, without losing sight of deadlines.',
    },
  },
  tired: {
    headline: { es: 'Suavicé tu semana', en: 'I softened your week' },
    subline: {
      es: 'Solo lo esencial queda cerca; el resto puede esperar.',
      en: 'Only essentials stay close; the rest can wait.',
    },
  },
  priorities_changed: {
    headline: { es: 'Enfocamos lo que importa', en: 'We focused on what matters' },
    subline: {
      es: 'Prioridades cerca; lo demás se movió con cuidado.',
      en: 'Priorities stay close; the rest moved gently.',
    },
  },
  more_energy: {
    headline: { es: 'Adelanté lo que puedes', en: 'I pulled forward what you can tackle' },
    subline: {
      es: 'Aprovechaste el impulso — sin sobrecargar hoy.',
      en: 'You had momentum — without overloading today.',
    },
  },
};

function shortDayLabel(iso: string, locale: AppLocale): string {
  const date = parseLocalDateString(iso);
  const weekday = date
    .toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase();
  const day = date.getDate();
  return `${weekday} ${day}`;
}

function formatDuration(_task: ExperienceTask): string {
  return '45 min';
}

function formatTime(index: number): string {
  const hour = 9 + index * 2;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${suffix}`;
}

function taskStatus(task: ExperienceTask): WeekPlannerTask['status'] {
  if (task.is_completed) return 'done';
  if (task.is_priority) return 'star';
  return 'pending';
}

export function buildWeekPlannerDays(
  tasks: ExperienceTask[],
  weekDayDates: string[],
  today: string,
  areaIndex: Map<string, LifeArea>,
  locale: AppLocale,
): WeekPlannerDay[] {
  return weekDayDates.map((dateStr) => {
    const dayTasks = tasks.filter(
      (task) => !task.is_completed && task.scheduled_date === dateStr,
    );
    const isToday = dateStr === today;
    const fullLabel = isToday
      ? locale === 'en'
        ? `Today · ${dayLabel(dateStr, locale)}`
        : `Hoy · ${dayLabel(dateStr, locale)}`
      : dayLabel(dateStr, locale);

    const plannerTasks: WeekPlannerTask[] = dayTasks.map((task, index) => {
      const area = resolveLifeArea(areaIndex, task.project_id);
      return {
        id: task.id,
        title: task.content,
        areaId: area.id,
        iconEmoji: area.emoji,
        timeLabel: formatTime(index),
        durationLabel: formatDuration(task),
        status: taskStatus(task),
        scheduledDate: dateStr,
      };
    });

    const summary =
      plannerTasks.length === 0
        ? locale === 'en'
          ? 'No steps'
          : 'Sin pasos'
        : locale === 'en'
          ? `${plannerTasks.length} steps`
          : `${plannerTasks.length} pasos`;

    return {
      id: dateStr,
      shortLabel: shortDayLabel(dateStr, locale),
      fullLabel,
      isToday,
      summary,
      tasks: plannerTasks,
    };
  });
}

export function getCurrentWeekDates(today: string): string[] {
  const anchor = parseLocalDateString(today);
  const dayOfWeek = anchor.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(getLocalDateString(d));
  }
  return dates;
}

export type ReorganizePlan = {
  proposal: ReorganizeWeekProposal;
  assignments: { id: string; scheduled_date: string }[];
};

export function buildAdaptiveReorganizePlan(
  tasks: ExperienceTask[],
  areaIndex: Map<string, LifeArea>,
  reason: WhatChangedReason,
  locale: AppLocale,
  today: string = getLocalDateString(),
  projectDueDates?: Record<string, string | null>,
): ReorganizePlan {
  const open = tasks.filter((task) => !task.is_completed);
  const weekDates = getCurrentWeekDates(today);
  const todayTasks = open.filter((task) => task.scheduled_date === today);
  const unscheduled = open.filter((task) => !task.scheduled_date);

  const assignments = new Map<string, string>();
  const movedIds = new Set<string>();
  const keptIds = new Set<string>();

  const assign = (taskId: string, date: string) => {
    assignments.set(taskId, date);
    movedIds.add(taskId);
  };

  const keep = (taskId: string) => {
    keptIds.add(taskId);
  };

  if (reason === 'new_event') {
    for (const task of todayTasks) {
      if (task.is_priority) {
        keep(task.id);
        continue;
      }
      assign(task.id, addDays(today, 1));
    }
    for (const task of unscheduled.slice(0, 3)) {
      assign(task.id, addDays(today, 1));
    }
  } else if (reason === 'less_time' || reason === 'tired') {
    const maxPerDay = reason === 'tired' ? 1 : 2;
    const spreadDays = reason === 'tired' ? 7 : 5;
    const priorityKeepCount = reason === 'tired' ? 1 : 2;
    const movable = open.filter((task) => task.scheduled_date === today || !task.scheduled_date);
    const priorityKeep = movable.filter((task) => task.is_priority).slice(0, priorityKeepCount);
    priorityKeep.forEach((task) => keep(task.id));

    const toMove = movable.filter((task) => !priorityKeep.some((entry) => entry.id === task.id));
    const { assignments: spread } = redistributeLooseTasks(
      toMove.map((task) => task.id),
      spreadDays,
      today,
      maxPerDay,
      locale,
    );
    spread.forEach((entry) => assign(entry.id, entry.scheduled_date));
  } else if (reason === 'priorities_changed') {
    for (const task of open) {
      if (task.is_priority) {
        assign(task.id, today);
      } else if (task.scheduled_date === today) {
        assign(task.id, addDays(today, 2));
      } else {
        keep(task.id);
      }
    }
  } else if (reason === 'more_energy') {
    const targetToday = 4;
    let slots = Math.max(0, targetToday - todayTasks.length);

    const later = open
      .filter((task) => task.scheduled_date && task.scheduled_date > today)
      .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1));

    for (const task of later) {
      if (slots <= 0) break;
      assign(task.id, today);
      slots -= 1;
    }

    const unscheduledRanked = [
      ...unscheduled.filter((task) => task.is_priority),
      ...unscheduled.filter((task) => !task.is_priority),
    ];
    for (const task of unscheduledRanked) {
      if (slots <= 0) break;
      if (assignments.has(task.id) || keptIds.has(task.id)) continue;
      assign(task.id, today);
      slots -= 1;
    }

    todayTasks.forEach((task) => keep(task.id));
  }

  // Ensure unassigned open tasks without explicit keep get a gentle spread
  for (const task of open) {
    if (assignments.has(task.id) || keptIds.has(task.id)) continue;
    if (task.scheduled_date) {
      keep(task.id);
      continue;
    }
    assign(task.id, today);
  }

  const moved = [...movedIds].map((taskId) => {
    const task = open.find((entry) => entry.id === taskId)!;
    const area = resolveLifeArea(areaIndex, task.project_id);
    const from = task.scheduled_date ? dayLabel(task.scheduled_date, locale) : undefined;
    const to = dayLabel(assignments.get(taskId)!, locale);
    const deadline = formatProposalDeadlineLabel(
      resolveTaskDeadline(task, projectDueDates),
      locale,
    );
    return {
      taskId,
      title: task.content,
      areaEmoji: area.emoji,
      areaColor: area.color,
      fromLabel: from,
      toLabel: to,
      deadlineLabel: deadline,
    };
  });

  const kept = [...keptIds].map((taskId) => {
    const task = open.find((entry) => entry.id === taskId)!;
    const area = resolveLifeArea(areaIndex, task.project_id);
    const dateLabel = task.scheduled_date
      ? dayLabel(task.scheduled_date, locale)
      : undefined;
    const deadline = formatProposalDeadlineLabel(
      resolveTaskDeadline(task, projectDueDates),
      locale,
    );
    return {
      taskId,
      title: task.content,
      areaEmoji: area.emoji,
      areaColor: area.color,
      dateLabel,
      deadlineLabel: deadline,
    };
  });

  const freedHours = Math.max(0, Math.round(moved.length * 0.75));
  const copy = PROPOSAL_COPY[reason];

  return {
    proposal: {
      headline: copy.headline[locale],
      subline: copy.subline[locale],
      moved,
      kept,
      freedHoursLabel: freedHours > 0 ? `${freedHours}h` : undefined,
    },
    assignments: [...assignments.entries()].map(([id, scheduled_date]) => ({
      id,
      scheduled_date,
    })),
  };
}

export function applyAssignmentsToTasks(
  tasks: ExperienceTask[],
  assignments: { id: string; scheduled_date: string }[],
): ExperienceTask[] {
  const byId = new Map(assignments.map((entry) => [entry.id, entry.scheduled_date]));
  return tasks.map((task) =>
    byId.has(task.id) ? { ...task, scheduled_date: byId.get(task.id)! } : task,
  );
}

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 21;
const HOUR_HEIGHT = 52;

export function getTimelineHourHeight(): number {
  return HOUR_HEIGHT;
}

export function buildDayTimeline(
  day: WeekPlannerDay,
  areaIndex: Map<string, LifeArea>,
  locale: AppLocale,
  options?: { showNewEventAnnotation?: boolean },
): DayTimelineModel {
  let cursorHour = 9;
  const blocks: TimelineBlock[] = day.tasks.map((task) => {
    const area = resolveLifeArea(areaIndex, task.areaId === LOOSE_LIFE_AREA_ID ? null : task.areaId);
    const block: TimelineBlock = {
      id: task.id,
      title: task.title,
      areaColor: area.color,
      startHour: cursorHour,
      durationHours: 1,
    };
    cursorHour += 1;
    if (cursorHour > 18) cursorHour = 18;
    return block;
  });

  if (options?.showNewEventAnnotation) {
    blocks.push({
      id: 'new-event',
      title: locale === 'en' ? 'Movie with friends' : 'Cine con amigas',
      areaColor: '#B39DDB',
      startHour: 19,
      durationHours: 1.5,
      isNewEvent: true,
    });
  }

  return {
    dateLabel: day.fullLabel,
    blocks,
    annotation: options?.showNewEventAnnotation
      ? locale === 'en'
        ? 'Koraa moved these tasks so your movie fits ❤️'
        : 'Koraa movió estas tareas para que quepa tu cine ❤️'
      : undefined,
  };
}

export { TIMELINE_START_HOUR, TIMELINE_END_HOUR };
