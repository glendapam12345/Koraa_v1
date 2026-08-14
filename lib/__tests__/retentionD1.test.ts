import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  localDateDiffDays,
  maybeTrackReturnedD1,
  shouldEmitReturnedD1,
  trackCohortDay0Once,
} from '@/lib/retentionD1';
import { getHoyLiteFirstOpenDay, seedHoyLiteFirstDayIfUnset } from '@/lib/hoyLiteDay';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const trackMock = jest.fn();
jest.mock('@/lib/analytics', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe('retentionD1', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    trackMock.mockClear();
  });

  it('shouldEmitReturnedD1 only on exact next calendar day', () => {
    expect(shouldEmitReturnedD1('2026-08-12', '2026-08-13')).toBe(true);
    expect(shouldEmitReturnedD1('2026-08-12', '2026-08-12')).toBe(false);
    expect(shouldEmitReturnedD1('2026-08-12', '2026-08-14')).toBe(false);
    expect(localDateDiffDays('2026-08-12', '2026-08-13')).toBe(1);
  });

  it('trackCohortDay0Once seeds anchor and fires once', async () => {
    const first = await trackCohortDay0Once('u1', '2026-08-12', 'onboarding');
    const second = await trackCohortDay0Once('u1', '2026-08-12', 'onboarding');
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(await getHoyLiteFirstOpenDay('u1')).toBe('2026-08-12');
    expect(trackMock).toHaveBeenCalledWith('cohort_day0', {
      local_date: '2026-08-12',
      source: 'onboarding',
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it('maybeTrackReturnedD1 fires once on day 1', async () => {
    await seedHoyLiteFirstDayIfUnset('u1', '2026-08-12');
    const first = await maybeTrackReturnedD1('u1', '2026-08-13');
    const second = await maybeTrackReturnedD1('u1', '2026-08-13');
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(trackMock).toHaveBeenCalledWith(
      'returned_d1',
      expect.objectContaining({ day0: '2026-08-12', local_date: '2026-08-13' }),
    );
  });

  it('maybeTrackReturnedD1 skips same day and day 2+', async () => {
    await seedHoyLiteFirstDayIfUnset('u1', '2026-08-12');
    expect(await maybeTrackReturnedD1('u1', '2026-08-12')).toBe(false);
    expect(await maybeTrackReturnedD1('u1', '2026-08-14')).toBe(false);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
