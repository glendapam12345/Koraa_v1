import { buildCaptureFronts, type ProjectMeta } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type CapturePriorityDirection = 'up' | 'down';

function rankForItem(item: EnrichedCaptureItem, fallback: number): number {
  return item.captureRank ?? fallback;
}

export function moveCaptureItemPriority(
  items: EnrichedCaptureItem[],
  frontKey: string,
  captureId: string,
  direction: CapturePriorityDirection,
  projects: ProjectMeta[] = [],
): EnrichedCaptureItem[] {
  const { fronts } = buildCaptureFronts(items, projects);
  const front = fronts.find((entry) => entry.key === frontKey);
  if (!front || front.tasks.length < 2) return items;

  const orderedIds = front.tasks.map((task) => task.captureId);
  const index = orderedIds.indexOf(captureId);
  if (index < 0) return items;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= orderedIds.length) return items;

  const idA = orderedIds[index];
  const idB = orderedIds[swapIndex];
  const itemA = items.find((entry) => entry.id === idA);
  const itemB = items.find((entry) => entry.id === idB);
  if (!itemA || !itemB) return items;

  const rankA = rankForItem(itemA, index * 10);
  const rankB = rankForItem(itemB, swapIndex * 10);

  return items.map((item) => {
    if (item.id === idA) return { ...item, captureRank: rankB };
    if (item.id === idB) return { ...item, captureRank: rankA };
    return item;
  });
}

/** Al mover a otro frente, el paso queda al final de ese frente. */
export function nextCaptureRankInFront(
  items: EnrichedCaptureItem[],
  frontKey: string,
  projects: ProjectMeta[] = [],
): number {
  const { fronts } = buildCaptureFronts(items, projects);
  const front = fronts.find((entry) => entry.key === frontKey);
  if (!front || front.tasks.length === 0) return 0;

  const ranks = front.tasks.map((task, index) => {
    const item = items.find((entry) => entry.id === task.captureId);
    return rankForItem(item ?? { id: task.captureId } as EnrichedCaptureItem, index * 10);
  });

  return Math.max(...ranks) + 10;
}

export function reorderCaptureItemsInFront(
  items: EnrichedCaptureItem[],
  orderedCaptureIds: string[],
): EnrichedCaptureItem[] {
  const rankMap = new Map(orderedCaptureIds.map((id, index) => [id, index * 10]));
  return items.map((item) =>
    rankMap.has(item.id) ? { ...item, captureRank: rankMap.get(item.id)! } : item,
  );
}

export function topPriorityCaptureIds(
  items: EnrichedCaptureItem[],
  projects: ProjectMeta[] = [],
): Set<string> {
  const { fronts } = buildCaptureFronts(items, projects);
  return new Set(
    fronts
      .map((front) => front.tasks[0]?.captureId)
      .filter((id): id is string => Boolean(id)),
  );
}
