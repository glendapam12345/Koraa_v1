import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import type { ExperienceTask, ReorganizePlan } from '@/lib/lifeAreas/experienceDataMappers';
import {
  formatProposalDeadlineLabel,
  formatProposalScheduleLabel,
} from '@/lib/lifeAreas/experienceDataMappers';
import type { LifeArea } from '@/lib/lifeAreas/types';
import type { KoraaWeekContext } from '@/lib/ai/types';
import { LOOSE_LIFE_AREA_ID, resolveLifeArea } from '@/lib/lifeAreas/projectToLifeArea';

function resolveTaskDeadline(
  task: ExperienceTask,
  projectDueDates?: Record<string, string | null>,
): string | undefined {
  if (!task.project_id || !projectDueDates) return undefined;
  return projectDueDates[task.project_id] ?? undefined;
}

/** Fallback local: reparte pasos desde días cargados hacia días livianos. */
export function buildWeekBalanceReorganizePlan(
  tasks: ExperienceTask[],
  areaIndex: Map<string, LifeArea>,
  context: KoraaWeekContext,
  locale: AppLocale,
  projectDueDates?: Record<string, string | null>,
): ReorganizePlan {
  const today = getLocalDateString();
  const open = tasks.filter((task) => !task.is_completed);
  const weekDates = context.days.map((day) => day.date);
  const maxPerDay = context.today && context.today.energyLevel <= 2 ? 2 : 3;

  const countByDate = new Map<string, number>();
  for (const date of weekDates) countByDate.set(date, 0);
  for (const task of open) {
    const date = task.scheduled_date && weekDates.includes(task.scheduled_date)
      ? task.scheduled_date
      : today;
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  const assignments = new Map<string, string>();
  const movedIds = new Set<string>();
  const keptIds = new Set<string>();

  const tasksByDate = (date: string) =>
    open.filter(
      (task) =>
        (task.scheduled_date === date || (!task.scheduled_date && date === today)) &&
        !assignments.has(task.id) &&
        !keptIds.has(task.id),
    );

  const lightestDate = (): string | null => {
    let best: string | null = null;
    let bestCount = Infinity;
    for (const date of weekDates) {
      if (date < today) continue;
      const count = countByDate.get(date) ?? 0;
      if (count < bestCount) {
        bestCount = count;
        best = date;
      }
    }
    return best;
  };

  const busiestDate = context.totals.busiestDay ?? today;
  let busiestCount = countByDate.get(busiestDate) ?? 0;

  while (busiestCount > maxPerDay) {
    const candidates = tasksByDate(busiestDate)
      .filter((task) => !task.is_priority)
      .slice(0, 1);
    if (candidates.length === 0) break;

    const target = lightestDate();
    if (!target || target === busiestDate) break;

    const task = candidates[0];
    assignments.set(task.id, target);
    movedIds.add(task.id);
    countByDate.set(busiestDate, (countByDate.get(busiestDate) ?? 1) - 1);
    countByDate.set(target, (countByDate.get(target) ?? 0) + 1);
    busiestCount = countByDate.get(busiestDate) ?? 0;
  }

  for (const task of open) {
    if (assignments.has(task.id) || movedIds.has(task.id)) continue;
    keptIds.add(task.id);
  }

  const moved = [...movedIds].map((taskId) => {
    const task = open.find((entry) => entry.id === taskId)!;
    const area = resolveLifeArea(areaIndex, task.project_id);
    const fromIso = task.scheduled_date ?? undefined;
    const toIso = assignments.get(taskId)!;
    return {
      taskId,
      title: task.content,
      areaEmoji: area.emoji,
      areaColor: area.color,
      fromLabel: fromIso ? formatProposalScheduleLabel(fromIso, locale) : undefined,
      toLabel: formatProposalScheduleLabel(toIso, locale),
      deadlineLabel: formatProposalDeadlineLabel(
        resolveTaskDeadline(task, projectDueDates),
        locale,
      ),
    };
  });

  const kept = [...keptIds].slice(0, 6).map((taskId) => {
    const task = open.find((entry) => entry.id === taskId)!;
    const area = resolveLifeArea(areaIndex, task.project_id);
    return {
      taskId,
      title: task.content,
      areaEmoji: area.emoji,
      areaColor: area.color,
      dateLabel: task.scheduled_date
        ? formatProposalScheduleLabel(task.scheduled_date, locale)
        : undefined,
      deadlineLabel: formatProposalDeadlineLabel(
        resolveTaskDeadline(task, projectDueDates),
        locale,
      ),
    };
  });

  const headline =
    locale === 'en' ? 'A gentler balance for your week' : 'Un equilibrio más suave para tu semana';
  const subline =
    locale === 'en'
      ? 'Steps moved away from the fullest day — adjust before accepting.'
      : 'Pasos movidos del día más lleno — ajusta antes de aceptar.';

  return {
    proposal: { headline, subline, moved, kept },
    assignments: [...assignments.entries()].map(([id, scheduled_date]) => ({
      id,
      scheduled_date,
    })),
  };
}

export function getWeekDatesForStart(weekStart: string): string[] {
  const monday = parseLocalDateString(weekStart);
  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(getLocalDateString(d));
  }
  return dates;
}
