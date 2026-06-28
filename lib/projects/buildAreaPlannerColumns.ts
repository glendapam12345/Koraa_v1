import type { AreaPlannerColumn } from '@/components/projects/AreasPlannerDragBoard';
import type { WeekPlannerTask } from '@/lib/lifeAreas/types';
import type { LooseTaskSummary } from '@/lib/looseTasks';
import type { ResolvedLifeArea } from '@/lib/lifeAreas/userLifeAreas';

type AreaLooseGroup = {
  area: ResolvedLifeArea;
  looseTasks: LooseTaskSummary[];
};

function looseToPlannerTask(task: LooseTaskSummary, areaRef: string): WeekPlannerTask {
  return {
    id: task.id,
    title: task.content,
    areaId: areaRef,
    iconEmoji: '',
    timeLabel: '',
    durationLabel: '',
    status: 'pending',
    scheduledDate: task.scheduled_date ?? '',
  };
}

/** Columnas del tablero de arrastre por área (solo tareas sueltas). */
export function buildAreaPlannerColumns(groups: AreaLooseGroup[]): AreaPlannerColumn[] {
  return groups.map((group) => ({
    id: group.area.ref,
    name: group.area.name,
    emoji: group.area.emoji,
    color: group.area.color,
    tasks: group.looseTasks.map((task) => looseToPlannerTask(task, group.area.ref)),
  }));
}

export function countOrganizableLooseTasks(groups: AreaLooseGroup[]): number {
  return groups.reduce((sum, group) => sum + group.looseTasks.length, 0);
}
