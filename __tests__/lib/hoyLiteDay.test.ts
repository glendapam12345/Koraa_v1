import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString, getPreviousLocalDateString } from '@/lib/dateLocal';
import { resetHoyFirstDayPreview, resolveHoyLiteLayout, simulateHoyDayTwo } from '@/lib/hoyLiteDay';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const userId = 'user-test-123';

describe('hoyLiteDay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resetHoyFirstDayPreview restaura vista lite del día actual', async () => {
    const today = getLocalDateString();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await resetHoyFirstDayPreview(userId);

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      `koraa_hoy_lite_opt_out_v1_${userId}`,
      `hoy_secondary_modules_${userId}_v1`,
    ]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      `koraa_hoy_first_open_calendar_day_v1_${userId}`,
      today,
    );

    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === `koraa_hoy_first_open_calendar_day_v1_${userId}`) return today;
      return null;
    });

    await expect(resolveHoyLiteLayout(userId)).resolves.toBe(true);
  });

  it('simulateHoyDayTwo activa vista completa (no lite)', async () => {
    const yesterday = getPreviousLocalDateString();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === `koraa_hoy_first_open_calendar_day_v1_${userId}`) return yesterday;
      return null;
    });

    await simulateHoyDayTwo(userId);

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      `koraa_hoy_lite_opt_out_v1_${userId}`,
      `hoy_secondary_modules_${userId}_v1`,
    ]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      `koraa_hoy_first_open_calendar_day_v1_${userId}`,
      yesterday,
    );

    await expect(resolveHoyLiteLayout(userId)).resolves.toBe(false);
  });
});
