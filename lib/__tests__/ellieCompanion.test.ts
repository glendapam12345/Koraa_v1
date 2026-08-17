import { resolveEllieCompanionCue } from '@/lib/ellieCompanion';

describe('resolveEllieCompanionCue (compat)', () => {
  it('re-exports personality for Hoy', () => {
    expect(resolveEllieCompanionCue('abrumada', 3).mood).toBe('breathing');
    expect(resolveEllieCompanionCue('agotada', 3).mood).toBe('sleepy');
    expect(resolveEllieCompanionCue('motivada', 4).mood).toBe('happy');
    expect(resolveEllieCompanionCue('tranquila', 3).mood).toBe('grateful');
  });
});
