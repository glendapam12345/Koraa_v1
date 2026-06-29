import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  consumeQueuedCheckInCelebration,
  queueCheckInCelebration,
} from '@/lib/checkInCelebration';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('checkInCelebration queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues and consumes celebration payload', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ streak: 3, milestone: false }),
    );
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    await queueCheckInCelebration({ streak: 3, milestone: false });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'koraa_check_in_celebration_queue_v1',
      JSON.stringify({ streak: 3, milestone: false }),
    );

    await expect(consumeQueuedCheckInCelebration()).resolves.toEqual({
      streak: 3,
      milestone: false,
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('koraa_check_in_celebration_queue_v1');
  });
});
