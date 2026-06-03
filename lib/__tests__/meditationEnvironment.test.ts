import { showsSimplifiedMeditationNotice } from '@/lib/meditationEnvironment';

jest.mock('@/lib/subscriptionEnvironment', () => ({
  isExpoGoClient: jest.fn(),
}));

const { isExpoGoClient } = jest.requireMock('@/lib/subscriptionEnvironment') as {
  isExpoGoClient: jest.Mock;
};

describe('showsSimplifiedMeditationNotice', () => {
  beforeEach(() => {
    isExpoGoClient.mockReset();
  });

  it('returns true when running in Expo Go', () => {
    isExpoGoClient.mockReturnValue(true);
    expect(showsSimplifiedMeditationNotice()).toBe(true);
  });

  it('returns false in standalone / TestFlight builds', () => {
    isExpoGoClient.mockReturnValue(false);
    expect(showsSimplifiedMeditationNotice()).toBe(false);
  });
});
