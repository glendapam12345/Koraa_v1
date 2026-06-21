import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { PlanRealismResult, RealityCheckInput, VnextAvailableHours } from '@/lib/vnext/types';

const DEFAULT_TASK_MINUTES = 45;

function estimateTaskMinutes(item: EnrichedCaptureItem): number {
  if (item.effortFeel === 'heavy') return 90;
  if (item.effortFeel === 'light') return 25;
  if (item.effortFeel === 'medium') return 45;

  const lower = item.content.toLowerCase();
  if (/\b(pitch|presentación|presentation|estrategia|strategy|diseño|design)\b/.test(lower)) {
    return 90;
  }
  if (/\b(llamar|call|email|comprar|buy|pagar)\b/.test(lower)) return 20;
  return DEFAULT_TASK_MINUTES;
}

export function maxTasksForHours(hours: VnextAvailableHours): number {
  return Math.max(1, Math.floor((hours * 60) / DEFAULT_TASK_MINUTES));
}

export function itemBelongsToFront(
  item: EnrichedCaptureItem,
  front: CaptureFront,
): boolean {
  return front.tasks.some((task) => task.captureId === item.id);
}

export function applyRealityCheckToItems(
  items: EnrichedCaptureItem[],
  fronts: CaptureFront[],
  check: RealityCheckInput,
): EnrichedCaptureItem[] {
  const focusFront = fronts.find((front) => front.key === check.focusFrontKey);
  const maxToday = maxTasksForHours(check.availableHours);

  const focusIds = new Set(
    focusFront?.tasks.map((task) => task.captureId) ?? [],
  );

  const ranked = [...items].sort((a, b) => (a.captureRank ?? 0) - (b.captureRank ?? 0));

  let todaySlots = maxToday;
  return ranked.map((item) => {
    const inFocus = focusIds.has(item.id);
    const isPriority =
      inFocus || item.effortFeel === 'heavy' || Boolean(item.selectedDate);

    if (isPriority && todaySlots > 0) {
      todaySlots -= 1;
      return { ...item, timing: 'today' as const };
    }

    if (item.timing === 'today' && todaySlots <= 0) {
      return { ...item, timing: 'this_week' as const, selectedDate: null };
    }

    return item;
  });
}

export function assessPlanRealism(
  items: EnrichedCaptureItem[],
  fronts: CaptureFront[],
  check: RealityCheckInput,
): PlanRealismResult {
  const focusFront = fronts.find((front) => front.key === check.focusFrontKey);
  const focusItems = focusFront
    ? items.filter((item) => itemBelongsToFront(item, focusFront))
    : [];

  const requiredMinutes = items.reduce((sum, item) => sum + estimateTaskMinutes(item), 0);
  const requiredHours = Math.round((requiredMinutes / 60) * 10) / 10;
  const availableHours = check.availableHours;
  const maxToday = maxTasksForHours(availableHours);

  const todayCandidates = items.filter(
    (item) => item.timing === 'today' || focusItems.some((f) => f.id === item.id),
  );

  const todayTaskCount = Math.min(todayCandidates.length, maxToday);
  const postponedCount = Math.max(0, items.length - todayTaskCount);

  return {
    requiredHours,
    availableHours,
    isRealistic: requiredHours <= availableHours,
    todayTaskCount,
    postponedCount,
    focusTaskCount: focusItems.length,
  };
}
