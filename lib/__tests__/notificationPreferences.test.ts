import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deriveTaskCaptureReminderTime,
  formatReminderTime,
  getDailyReminderOptedIn,
  getTaskCaptureReminderEnabled,
  setDailyReminderOptedIn,
} from '@/lib/notificationPreferences';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe('deriveTaskCaptureReminderTime', () => {
  it('offsets morning check-in to evening capture', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 9, minute: 0 })).toEqual({
      hour: 18,
      minute: 0,
    });
  });

  it('clamps late capture reminders to 20:00', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 12, minute: 0 })).toEqual({
      hour: 20,
      minute: 0,
    });
  });

  it('uses offset when check-in is early but after 6:00', () => {
    expect(deriveTaskCaptureReminderTime({ hour: 7, minute: 0 })).toEqual({
      hour: 16,
      minute: 0,
    });
  });
});

describe('formatReminderTime', () => {
  it('pads hours and minutes', () => {
    expect(formatReminderTime({ hour: 8, minute: 30 })).toBe('08:30');
  });
});

describe('getDailyReminderOptedIn', () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
  });

  it('treats missing choice as opted in for existing users', async () => {
    getItem.mockResolvedValue(null);
    await expect(getDailyReminderOptedIn()).resolves.toBe(true);
  });

  it('honors an explicit skip', async () => {
    getItem.mockResolvedValue('0');
    await expect(getDailyReminderOptedIn()).resolves.toBe(false);
  });

  it('persists an explicit yes', async () => {
    await setDailyReminderOptedIn(true);
    expect(setItem).toHaveBeenCalledWith('koraa.dailyReminderOptedIn', '1');
  });
});

describe('getTaskCaptureReminderEnabled', () => {
  beforeEach(() => {
    getItem.mockReset();
  });

  it('defaults off so the lock screen stays one Koraa reminder', async () => {
    getItem.mockResolvedValue(null);
    await expect(getTaskCaptureReminderEnabled()).resolves.toBe(false);
  });

  it('honors an explicit opt-in from Settings', async () => {
    getItem.mockResolvedValue('1');
    await expect(getTaskCaptureReminderEnabled()).resolves.toBe(true);
  });
});
