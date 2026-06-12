import { CARE_MODE_MAX_FOCUS_STEPS, getCareModeTaskCounts } from '@/lib/hoyCareMode';

describe('hoyCareMode', () => {
  it('shows one focus step and counts hidden focus in waiting', () => {
    expect(CARE_MODE_MAX_FOCUS_STEPS).toBe(1);
    expect(getCareModeTaskCounts(3, 5)).toEqual({
      visibleFocus: 1,
      waitingCount: 7,
    });
  });

  it('keeps waiting at zero when only one focus step exists', () => {
    expect(getCareModeTaskCounts(1, 0)).toEqual({
      visibleFocus: 1,
      waitingCount: 0,
    });
  });
});
