const memoryStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(memoryStore[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      memoryStore[key] = value;
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      for (const key of Object.keys(memoryStore)) {
        delete memoryStore[key];
      }
      return Promise.resolve();
    }),
  },
}));

import {
  dismissDayChangedCard,
  shouldShowDayChangedCard,
} from '@/lib/hoyDayFlowDismiss';

const USER = 'user-123';
const DAY = '2026-05-19';

describe('hoyDayFlowDismiss', () => {
  beforeEach(() => {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  });

  it('shows card until dismissed for the day', async () => {
    expect(await shouldShowDayChangedCard(USER, DAY)).toBe(true);
    await dismissDayChangedCard(USER, DAY);
    expect(await shouldShowDayChangedCard(USER, DAY)).toBe(false);
  });

  it('uses separate keys per calendar day', async () => {
    await dismissDayChangedCard(USER, DAY);
    expect(await shouldShowDayChangedCard(USER, '2026-05-20')).toBe(true);
  });
});
