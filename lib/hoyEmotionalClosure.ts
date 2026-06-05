import type { Task } from '@/components/tasks/TaskCard';

export type HoyEmotionalClosure = {
  title: string;
  message: string;
  note: string;
};

type BuildClosureParams = {
  todayMood: string | null;
  energyLevel: number;
  tasks: Task[];
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function buildHoyEmotionalClosure({
  todayMood,
  energyLevel,
  tasks,
  t,
}: BuildClosureParams): HoyEmotionalClosure | null {
  if (!todayMood || energyLevel === 0) return null;

  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.is_completed).length;
  const pendingCount = Math.max(totalCount - completedCount, 0);
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const lowEnergyContext =
    energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(todayMood.toLowerCase());

  if (totalCount === 0) {
    return {
      title: t('hoy.closureTitle'),
      message: t('hoy.closureListen'),
      note: t('hoy.closureListenNote'),
    };
  }

  if (completionRatio >= 0.8) {
    return {
      title: t('hoy.closureTitle'),
      message: t('hoy.closureEnough', { completed: completedCount, total: totalCount }),
      note: t('hoy.closureRestNote'),
    };
  }

  if (lowEnergyContext) {
    return {
      title: t('hoy.closureTitle'),
      message:
        completedCount > 0
          ? t('hoy.closureLowProgress', { count: completedCount })
          : t('hoy.closureNoProgress'),
      note:
        pendingCount > 0
          ? t('hoy.closurePendingSplit', { count: pendingCount })
          : t('hoy.closureResumeLight'),
    };
  }

  if (completionRatio >= 0.4) {
    return {
      title: t('hoy.closureTitle'),
      message: t('hoy.closureMidProgress', { completed: completedCount, total: totalCount }),
      note:
        pendingCount > 0
          ? t('hoy.closurePendingOne', { count: pendingCount })
          : t('hoy.closureCleanList'),
    };
  }

  return {
    title: t('hoy.closureTitle'),
    message:
      completedCount > 0
        ? t('hoy.closureSmallProgress', { count: completedCount })
        : t('hoy.closureHardDay'),
    note: t('hoy.closureTomorrow'),
  };
}

export function buildHoyEmotionalToneLine(
  todayMood: string | null,
  t: (key: string) => string,
): string {
  if (!todayMood) return t('hoy.mantraDefault');
  const mood = todayMood.toLowerCase();
  if (['agotada', 'ansiosa', 'abrumada'].includes(mood)) return t('hoy.mantraCompassion');
  if (['motivada', 'enfocada'].includes(mood)) return t('hoy.mantraImpulse');
  return t('hoy.mantraSteady');
}
