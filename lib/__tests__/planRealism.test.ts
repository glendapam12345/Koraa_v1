import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import {
  applyRealityCheckToItems,
  assessPlanRealism,
  maxTasksForHours,
} from '@/lib/vnext/planRealism';
import { energyToReorganizeReason } from '@/lib/vnext/types';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(content: string, id: string, effortFeel?: EnrichedCaptureItem['effortFeel']): EnrichedCaptureItem {
  return {
    id,
    content,
    assignToProject: false,
    selectedCategory: 'otros',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: effortFeel ?? null,
    timing: 'this_week',
    captureRank: 0,
  };
}

describe('planRealism', () => {
  it('limits today steps to available hours', () => {
    const items = [
      item('Finish app', 'a'),
      item('Create reel', 'b'),
      item('Call mom', 'c'),
      item('Review supplier', 'd'),
      item('ONU presentation', 'e'),
    ];
    const projects: { id: string; name: string; due_date: string | null }[] = [];
    const { fronts } = buildCaptureFronts(items, projects);
    const focus = fronts.find((front) => front.tasks.length > 0)!;

    const check = {
      focusFrontKey: focus.key,
      focusFrontName: focus.name,
      availableHours: 2 as const,
      energy: 'normal' as const,
    };

    const adjusted = applyRealityCheckToItems(items, fronts, check);
    const realism = assessPlanRealism(adjusted, fronts, check);

    expect(maxTasksForHours(2)).toBe(2);
    expect(realism.todayTaskCount).toBeLessThanOrEqual(2);
    expect(realism.availableHours).toBe(2);
  });

  it('flags unrealistic plans when required hours exceed capacity', () => {
    const items = [
      item('Finish app', 'a', 'heavy'),
      item('Create reel', 'b', 'heavy'),
      item('ONU presentation', 'c', 'heavy'),
      item('Review supplier', 'd', 'heavy'),
    ];
    const projects: { id: string; name: string; due_date: string | null }[] = [];
    const { fronts } = buildCaptureFronts(items, projects);
    const focus = fronts[0];

    const check = {
      focusFrontKey: focus.key,
      focusFrontName: focus.name,
      availableHours: 2 as const,
      energy: 'low' as const,
    };

    const realism = assessPlanRealism(items, fronts, check);
    expect(realism.isRealistic).toBe(false);
    expect(realism.requiredHours).toBeGreaterThan(2);
    expect(energyToReorganizeReason('low', 2)).toBe('tired');
  });
});
