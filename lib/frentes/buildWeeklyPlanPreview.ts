import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';
import {
  buildAdaptiveReorganizePlan,
  buildWeekPlannerDays,
  getCurrentWeekDates,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { ProjectMeta } from '@/lib/captureProjectFronts';
import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import { topPriorityCaptureIds } from '@/lib/frentes/reorderCapturePriority';
import type { WeekPlannerDay } from '@/lib/lifeAreas/types';
import type { RealityCheckInput } from '@/lib/vnext/types';
import {
  applyRealityCheckToItems,
  assessPlanRealism,
} from '@/lib/vnext/planRealism';
import { energyToReorganizeReason } from '@/lib/vnext/types';

export type WeeklyPlanPreview = {
  days: WeekPlannerDay[];
  movedCount: number;
  freedHours?: string;
  assignments: { id: string; scheduled_date: string }[];
  realism?: ReturnType<typeof assessPlanRealism>;
  focusFrontName?: string;
};

export function buildWeeklyPlanPreview(
  items: EnrichedCaptureItem[],
  projects: ProjectMeta[],
  locale: AppLocale,
  looseLabel: string,
  realityCheck?: RealityCheckInput,
): WeeklyPlanPreview {
  const today = getLocalDateString();
  const weekDates = getCurrentWeekDates(today);
  const frontsResult = buildCaptureFronts(items, projects);
  const calibratedItems = realityCheck
    ? applyRealityCheckToItems(items, frontsResult.fronts, realityCheck)
    : items;
  const topPriorityIds = topPriorityCaptureIds(calibratedItems, projects);
  const focusFrontKey = realityCheck?.focusFrontKey;

  const tasks: ExperienceTask[] = calibratedItems.map((item) => ({
    id: item.id,
    content: item.content,
    project_id: item.selectedProjectId,
    scheduled_date: item.selectedDate,
    is_completed: false,
    is_priority: Boolean(
      topPriorityIds.has(item.id) ||
        item.effortFeel === 'heavy' ||
        (focusFrontKey
          ? frontsResult.fronts
              .find((front) => front.key === focusFrontKey)
              ?.tasks.some((task) => task.captureId === item.id)
          : false),
    ),
  }));

  const areaIndex = buildLifeAreaIndex(
    projects.map((p) => ({ id: p.id, name: p.name, color: null })),
    looseLabel,
  );

  const reason = realityCheck
    ? energyToReorganizeReason(realityCheck.energy, realityCheck.availableHours)
    : 'less_time';
  const plan = buildAdaptiveReorganizePlan(tasks, areaIndex, reason, locale, today);
  const withAssignments = tasks.map((task) => {
    const assignment = plan.assignments.find((entry) => entry.id === task.id);
    return assignment ? { ...task, scheduled_date: assignment.scheduled_date } : task;
  });

  const days = buildWeekPlannerDays(withAssignments, weekDates, today, areaIndex, locale);

  const realism = realityCheck
    ? assessPlanRealism(calibratedItems, frontsResult.fronts, realityCheck)
    : undefined;

  return {
    days,
    movedCount: plan.proposal.moved.length,
    freedHours: plan.proposal.freedHoursLabel,
    assignments: plan.assignments,
    realism,
    focusFrontName: realityCheck?.focusFrontName,
  };
}
