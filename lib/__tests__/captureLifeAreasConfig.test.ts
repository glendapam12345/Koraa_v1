import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import { hideAreaInConfig } from '@/lib/lifeAreas/userLifeAreas';
import { inferCaptureItemLifeArea } from '@/lib/review/inferCaptureItemLifeArea';
import { buildLiveAreaPreviewColumns } from '@/lib/review/buildLiveAreaPreviewSummary';
import { enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';

describe('capture life areas respect user config', () => {
  it('ensureBrainDumpPresetInConfig keeps hiddenAreaRefs', () => {
    const hidden = hideAreaInConfig({ labels: {}, custom: [] }, 'health');
    const merged = ensureBrainDumpPresetInConfig(hidden);
    expect(merged.hiddenAreaRefs).toContain('health');
  });

  it('ensureBrainDumpPresetInConfig hides legacy presets on fresh accounts', () => {
    const merged = ensureBrainDumpPresetInConfig({ labels: {}, custom: [] });
    expect(merged.hiddenAreaRefs).toContain('health');
    expect(merged.hiddenAreaRefs).toContain('other');
  });

  it('maps family keywords to personal instead of a separate familia area', () => {
    const config = ensureBrainDumpPresetInConfig({ labels: {}, custom: [] });
    const ref = inferCaptureItemLifeArea('Llamar a mamá', config);
    expect(ref).toContain('bd_personal');
  });

  it('does not infer hidden exercise area during capture', () => {
    const config = hideAreaInConfig({ labels: {}, custom: [] }, 'health');
    const ref = inferCaptureItemLifeArea('Hacer yoga en la mañana', config);
    expect(ref).not.toBe('health');
  });

  it('omits hidden areas from live preview columns', () => {
    const config = hideAreaInConfig({ labels: {}, custom: [] }, 'health');
    const rows = parseCaptureToInboxItems('Hacer yoga\nTerminar presentación', 'es');
    const items = enrichCaptureItemsLocally(rows, []).map((item) => ({
      ...item,
      lifeAreaKey: inferCaptureItemLifeArea(item.content, config),
    }));
    const columns = buildLiveAreaPreviewColumns(items, 'es', config);
    expect(columns.some((col) => col.ref === 'health')).toBe(false);
  });
});
