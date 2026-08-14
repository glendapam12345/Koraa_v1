import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  activatePatternHoyApply,
  clearActivePatternHoyApply,
  consumePatternHoyApply,
  getActivePatternHoyApply,
  savePatternHoyApply,
} from '@/lib/patternHoyBridge';
import { getLocalDateString } from '@/lib/dateLocal';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('patternHoyBridge', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and activates a one-time toast while keeping mode for the day', async () => {
    await savePatternHoyApply('Un solo paso basta', 'one_step', 'energy');
    const first = await activatePatternHoyApply();
    expect(first?.justActivated).toBe(true);
    expect(first?.apply.tip).toBe('Un solo paso basta');
    expect(first?.apply.mode).toBe('one_step');

    const second = await activatePatternHoyApply();
    expect(second?.justActivated).toBe(false);
    expect(second?.apply.mode).toBe('one_step');
    expect(await getActivePatternHoyApply()).toMatchObject({ mode: 'one_step' });
  });

  it('consumePatternHoyApply only returns on first activation', async () => {
    await savePatternHoyApply('Un solo paso basta', 'one_step', 'energy');
    const first = await consumePatternHoyApply();
    expect(first?.tip).toBe('Un solo paso basta');
    expect(await consumePatternHoyApply()).toBeNull();
    expect(await getActivePatternHoyApply()).toMatchObject({ mode: 'one_step' });
  });

  it('ignores empty tips', async () => {
    await savePatternHoyApply('   ', 'open_hoy');
    expect(await activatePatternHoyApply()).toBeNull();
  });

  it('clears stale active apply from a previous day', async () => {
    await savePatternHoyApply('Ayer', 'easy_first', 'hour');
    await activatePatternHoyApply('2020-01-01');
    expect(await activatePatternHoyApply(getLocalDateString())).toBeNull();
    expect(await getActivePatternHoyApply()).toBeNull();
  });

  it('clearActivePatternHoyApply drops pending and active', async () => {
    await savePatternHoyApply('Un solo paso basta', 'one_step', 'energy');
    await activatePatternHoyApply();
    await savePatternHoyApply('Pendiente', 'easy_first', 'hour');
    await clearActivePatternHoyApply();
    expect(await getActivePatternHoyApply()).toBeNull();
    expect(await activatePatternHoyApply()).toBeNull();
  });
});
