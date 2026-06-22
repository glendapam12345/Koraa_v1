import {
  resolveBuiltinAreaDisplayName,
  resolveCustomAreaDisplayName,
} from '@/lib/lifeAreas/areaDisplayLabels';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';

describe('areaDisplayLabels', () => {
  it('uses i18n for preset Spanish builtin labels stored in profile', () => {
    expect(
      resolveBuiltinAreaDisplayName('home', 'Hogar', (key) => (key === 'home' ? 'Home & life' : key)),
    ).toBe('Home & life');
    expect(
      resolveBuiltinAreaDisplayName('work', 'Trabajo', (key) => (key === 'work' ? 'Work' : key)),
    ).toBe('Work');
  });

  it('keeps user-renamed builtin labels', () => {
    expect(
      resolveBuiltinAreaDisplayName('work', 'Koraa', (key) => (key === 'work' ? 'Work' : key)),
    ).toBe('Koraa');
  });

  it('uses i18n for preset custom areas when name matches default', () => {
    expect(
      resolveCustomAreaDisplayName(
        BRAIN_DUMP_PRESET_CUSTOM_IDS.personal,
        'Personal',
        () => 'Personal space',
      ),
    ).toBe('Personal space');
  });

  it('keeps user-renamed custom preset areas', () => {
    expect(
      resolveCustomAreaDisplayName(
        BRAIN_DUMP_PRESET_CUSTOM_IDS.personal,
        'Side projects',
        () => 'Personal space',
      ),
    ).toBe('Side projects');
  });
});
