import type { CaptureFront } from '@/lib/captureProjectFronts';

export type CaptureReliefBucket = 'project' | 'lifeArea' | 'standalone';

const INFERRED_PROJECT_KEYS = new Set(['koraa', 'impermanence', 'marathon']);

export type ReliefSummaryRow =
  | {
      kind: 'project' | 'lifeArea';
      front: CaptureFront;
      itemCount: number;
    }
  | {
      kind: 'standalone';
      front: CaptureFront;
      content: string;
    };

export type ReliefReviewModel = {
  rows: ReliefSummaryRow[];
  counts: {
    projects: number;
    lifeAreas: number;
    standalone: number;
  };
  /** Solo proyectos — única pregunta permitida en revisión. */
  deadlineFronts: CaptureFront[];
};

function frontDisplayName(name: string): string {
  return name.replace(/\s+App$/i, '');
}

export function classifyCaptureFront(front: CaptureFront): CaptureReliefBucket {
  if (front.key.startsWith('loose:')) return 'standalone';
  if (front.tasks.length === 1 && front.key !== 'personal') {
    if (front.isExistingProject || front.projectId) return 'project';
    return 'standalone';
  }

  if (front.key === 'loose-group') return 'lifeArea';

  if (front.isExistingProject || front.projectId || front.key.startsWith('project:')) {
    return 'project';
  }

  if (INFERRED_PROJECT_KEYS.has(front.key)) return 'project';

  if (front.key === 'personal') {
    return front.tasks.length > 1 ? 'lifeArea' : 'standalone';
  }

  if (front.suggestedNewProject) return 'project';

  if (front.tasks.length > 1) return 'lifeArea';

  return 'standalone';
}

export function asksDeadlineInReview(front: CaptureFront): boolean {
  return classifyCaptureFront(front) === 'project';
}

export function buildReliefReviewModel(fronts: CaptureFront[]): ReliefReviewModel {
  const active = fronts.filter((front) => front.tasks.length > 0);
  const rows: ReliefSummaryRow[] = [];
  const counts = { projects: 0, lifeAreas: 0, standalone: 0 };
  const deadlineFronts: CaptureFront[] = [];

  for (const front of active) {
    const bucket = classifyCaptureFront(front);
    if (bucket === 'standalone') {
      counts.standalone += 1;
      rows.push({
        kind: 'standalone',
        front,
        content: front.tasks[0]?.content ?? '',
      });
      continue;
    }

    if (bucket === 'project') {
      counts.projects += 1;
      rows.push({ kind: 'project', front, itemCount: front.tasks.length });
      deadlineFronts.push(front);
      continue;
    }

    counts.lifeAreas += 1;
    rows.push({ kind: 'lifeArea', front, itemCount: front.tasks.length });
  }

  return { rows, counts, deadlineFronts };
}

export function reliefRowLabel(
  row: ReliefSummaryRow,
  t: (key: string, params?: Record<string, string | number>) => string,
): { emoji: string; title: string; meta: string } {
  if (row.kind === 'standalone') {
    return {
      emoji: '📝',
      title: row.content,
      meta: '',
    };
  }

  const name = frontDisplayName(row.front.name);
  const meta =
    row.itemCount === 1
      ? t('vaciar.reliefItemsOne')
      : t('vaciar.reliefItems', { count: row.itemCount });

  return {
    emoji: row.front.emoji,
    title: name,
    meta,
  };
}
