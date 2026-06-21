import { reflectionToReorganizeReason } from '@/lib/vnext/dayReflection';

describe('reflectionToReorganizeReason', () => {
  it('maps outcomes to distinct reorganize reasons', () => {
    expect(reflectionToReorganizeReason('unexpected')).toBe('new_event');
    expect(reflectionToReorganizeReason('less_energy')).toBe('less_time');
    expect(reflectionToReorganizeReason('difficult_day')).toBe('tired');
    expect(reflectionToReorganizeReason('finished_early')).toBe('more_energy');
    expect(reflectionToReorganizeReason('finished_all')).toBe('priorities_changed');
  });
});
