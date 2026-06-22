import { buildSavedSummaryAreaGroups } from '@/lib/review/buildBrainDumpSavedSummary';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';

describe('buildSavedSummaryAreaGroups', () => {
  const config = { labels: {}, custom: [] };

  it('shows only affected areas with saved step titles', () => {
    const familiaRef = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia);
    const groups = buildSavedSummaryAreaGroups(
      [],
      config,
      (key) => key,
      [],
      {
        taskCount: +2,
        newProjectIds: [],
        affectedAreaRefs: [familiaRef],
        previewItems: [
          {
            content: 'Marcarle a mamá',
            lifeAreaKey: familiaRef,
            projectId: null,
            estimatedMinutes: 20,
          },
        ],
      },
      'Otro',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.area.ref).toBe(familiaRef);
    expect(groups[0]?.looseTasks[0]?.content).toBe('Marcarle a mamá');
    expect(groups.some((group) => group.area.ref === 'health')).toBe(false);
  });
});
