import {
  markReturnTomorrowToast,
  peekReturnTomorrowToast,
  consumeReturnTomorrowToast,
} from '@/lib/returnTomorrowToast';
import { getLocalDateString } from '@/lib/dateLocal';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('returnTomorrowToast', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('marks and peeks without consuming', async () => {
    await markReturnTomorrowToast('09:00');
    await expect(peekReturnTomorrowToast()).resolves.toBe('09:00');
    await expect(peekReturnTomorrowToast()).resolves.toBe('09:00');
  });

  it('consume clears the toast', async () => {
    await markReturnTomorrowToast('08:30');
    await expect(consumeReturnTomorrowToast()).resolves.toBe('08:30');
    await expect(peekReturnTomorrowToast()).resolves.toBeNull();
  });

  it('ignores stale toast from another day', async () => {
    await AsyncStorage.setItem(
      'koraa_return_tomorrow_toast_v1',
      JSON.stringify({ timeLabel: '09:00', markedOn: '2020-01-01' }),
    );
    await expect(peekReturnTomorrowToast()).resolves.toBeNull();
    expect(getLocalDateString()).not.toBe('2020-01-01');
  });
});
