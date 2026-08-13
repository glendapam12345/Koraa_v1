import AsyncStorage from '@react-native-async-storage/async-storage';
import { consumePatternHoyApply, savePatternHoyApply } from '@/lib/patternHoyBridge';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('patternHoyBridge', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and consumes a one-time Hoy apply', async () => {
    await savePatternHoyApply('Un solo paso basta', 'one_step', 'energy');
    const first = await consumePatternHoyApply();
    expect(first?.tip).toBe('Un solo paso basta');
    expect(first?.mode).toBe('one_step');
    expect(first?.patternType).toBe('energy');
    expect(await consumePatternHoyApply()).toBeNull();
  });

  it('ignores empty tips', async () => {
    await savePatternHoyApply('   ', 'open_hoy');
    expect(await consumePatternHoyApply()).toBeNull();
  });
});
