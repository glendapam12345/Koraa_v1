import type { AppLocale } from '@/lib/i18n';
import { formatProposalScheduleLabel } from '@/lib/lifeAreas/experienceDataMappers';
import type {
  ReorganizeKeepItem,
  ReorganizeMoveItem,
  ReorganizeWeekProposal,
} from '@/lib/lifeAreas/types';

export type ReorganizeAssignment = { id: string; scheduled_date: string };

export type ReorganizePreviewItem = {
  taskId: string;
  title: string;
  areaEmoji: string;
};

function asKeep(item: ReorganizeKeepItem | ReorganizeMoveItem): ReorganizeKeepItem {
  return {
    taskId: item.taskId,
    title: item.title,
    areaEmoji: item.areaEmoji,
    areaColor: item.areaColor,
    deadlineLabel: item.deadlineLabel,
  };
}

function currentDateForItem(item: ReorganizeKeepItem | ReorganizeMoveItem): string | undefined {
  if ('toDate' in item && item.toDate) return item.toDate;
  if ('date' in item && item.date) return item.date;
  return undefined;
}

export function applyReorganizeDateEdit(params: {
  proposal: ReorganizeWeekProposal;
  assignments: ReorganizeAssignment[];
  taskId: string;
  nextDate: string;
  today: string;
  locale: AppLocale;
}): { proposal: ReorganizeWeekProposal; assignments: ReorganizeAssignment[] } {
  const { proposal, assignments, taskId, nextDate, today, locale } = params;
  const existing =
    proposal.kept.find((item) => item.taskId === taskId) ??
    proposal.moved.find((item) => item.taskId === taskId);
  if (!existing) {
    return { proposal, assignments };
  }

  const previousDate = currentDateForItem(existing);
  const nextLabel = formatProposalScheduleLabel(nextDate, locale);
  const fromLabel = previousDate
    ? formatProposalScheduleLabel(previousDate, locale)
    : 'fromLabel' in existing
      ? existing.fromLabel
      : undefined;

  const kept = proposal.kept.filter((item) => item.taskId !== taskId);
  const moved = proposal.moved.filter((item) => item.taskId !== taskId);
  const base = asKeep(existing);

  if (nextDate === today) {
    kept.unshift({
      ...base,
      date: nextDate,
      dateLabel: nextLabel,
    });
  } else {
    moved.unshift({
      ...base,
      fromDate: previousDate,
      fromLabel,
      toDate: nextDate,
      toLabel: nextLabel,
    });
  }

  const nextAssignments = [
    ...assignments.filter((entry) => entry.id !== taskId),
    { id: taskId, scheduled_date: nextDate },
  ];

  return {
    proposal: { ...proposal, kept, moved },
    assignments: nextAssignments,
  };
}

export function resolvedDateForReorganizeItem(
  item: ReorganizeKeepItem | ReorganizeMoveItem,
  assignments: ReorganizeAssignment[],
  today: string,
): string | null {
  const assigned = assignments.find((entry) => entry.id === item.taskId)?.scheduled_date;
  if (assigned) return assigned;
  const current = currentDateForItem(item);
  if (current) return current;
  if ('toDate' in item) return null;
  return today;
}

export function tasksOnProposedDate(
  proposal: ReorganizeWeekProposal,
  assignments: ReorganizeAssignment[],
  date: string,
  today: string,
): ReorganizePreviewItem[] {
  const items: (ReorganizeKeepItem | ReorganizeMoveItem)[] = [
    ...proposal.kept,
    ...proposal.moved,
  ];
  const seen = new Set<string>();
  const result: ReorganizePreviewItem[] = [];
  for (const item of items) {
    if (seen.has(item.taskId)) continue;
    if (resolvedDateForReorganizeItem(item, assignments, today) !== date) continue;
    seen.add(item.taskId);
    result.push({
      taskId: item.taskId,
      title: item.title,
      areaEmoji: item.areaEmoji,
    });
  }
  return result;
}
