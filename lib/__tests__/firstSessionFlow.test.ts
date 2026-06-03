import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirstFlowLandingKey,
  markFirstFlowLandingComplete,
  shouldLandOnTasksFirst,
} from '@/lib/firstSessionFlow';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('firstSessionFlow', () => {
  const userId = 'user-abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a stable storage key per user', () => {
    expect(getFirstFlowLandingKey(userId)).toBe('koraa_first_flow_landing_v1_user-abc');
  });

  it('shouldLandOnTasksFirst is true until marked complete', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await expect(shouldLandOnTasksFirst(userId)).resolves.toBe(true);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
    await expect(shouldLandOnTasksFirst(userId)).resolves.toBe(false);
  });

  it('markFirstFlowLandingComplete persists flag', async () => {
    await markFirstFlowLandingComplete(userId);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getFirstFlowLandingKey(userId),
      '1',
    );
  });
});
