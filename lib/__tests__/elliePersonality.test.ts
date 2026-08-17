import {
  ELLIE_EXPRESSION_TO_MOOD,
  normalizeEllieEmotionKey,
  resolveEllieCompanionCue,
  resolveElliePresence,
} from '@/lib/elliePersonality';

describe('elliePersonality', () => {
  it('maps each guide expression to its own portrait', () => {
    expect(ELLIE_EXPRESSION_TO_MOOD.comforting).toBe('comforting');
    expect(ELLIE_EXPRESSION_TO_MOOD.proud).toBe('proud');
    expect(ELLIE_EXPRESSION_TO_MOOD.cozy).toBe('cozy');
    expect(ELLIE_EXPRESSION_TO_MOOD.focus).toBe('focus');
    expect(ELLIE_EXPRESSION_TO_MOOD.curious).toBe('curious');
    expect(ELLIE_EXPRESSION_TO_MOOD.happy).toBe('happy');
    expect(ELLIE_EXPRESSION_TO_MOOD.sleepy).toBe('sleepy');
  });

  it('normalizes English and Spanish check-in labels', () => {
    expect(normalizeEllieEmotionKey('Up for it')).toBe('motivada');
    expect(normalizeEllieEmotionKey('Overwhelmed')).toBe('abrumada');
    expect(normalizeEllieEmotionKey('Present')).toBe('enfocada');
    expect(normalizeEllieEmotionKey('Low energy')).toBe('agotada');
    expect(normalizeEllieEmotionKey('Calm')).toBe('tranquila');
    expect(normalizeEllieEmotionKey('Anxious')).toBe('ansiosa');
  });

  it('meets hard check-ins with distinct comforting / breathing / sleepy portraits', () => {
    const overwhelmed = resolveEllieCompanionCue('abrumada', 3);
    expect(overwhelmed.expression).toBe('comforting');
    expect(overwhelmed.mood).toBe('comforting');
    expect(overwhelmed.messageKey).toBe('ellie.lines.comforting');

    const anxious = resolveEllieCompanionCue('ansiosa', 4);
    expect(anxious.expression).toBe('breathing');
    expect(anxious.mood).toBe('breathing');

    const low = resolveEllieCompanionCue('tranquila', 2);
    expect(low.expression).toBe('sleepy');
    expect(low.messageKey).toBe('ellie.lines.checkInLow');

    expect(resolveEllieCompanionCue('Overwhelmed', 2).mood).toBe('comforting');
  });

  it('meets bright and calm check-ins with happy / focus / cozy mood, not a closing line', () => {
    expect(resolveEllieCompanionCue('motivada', 4).expression).toBe('happy');
    expect(resolveEllieCompanionCue('motivada', 4).messageKey).toBe('ellie.lines.checkInUp');
    expect(resolveEllieCompanionCue('Up for it', 5).mood).toBe('happy');
    expect(resolveEllieCompanionCue('enfocada', 3).expression).toBe('focus');
    expect(resolveEllieCompanionCue('Present', 3).mood).toBe('focus');
    expect(resolveEllieCompanionCue('tranquila', 3).expression).toBe('cozy');
    expect(resolveEllieCompanionCue('tranquila', 3).messageKey).toBe('ellie.lines.checkInCalm');
  });

  it('points to adding a step when the plan is empty', () => {
    expect(
      resolveEllieCompanionCue('tranquila', 3, { planEmpty: true }).messageKey,
    ).toBe('ellie.lines.checkInEmpty');
  });

  it('says enough only when today is actually done', () => {
    expect(
      resolveEllieCompanionCue('tranquila', 3, { allFocusDone: true }).messageKey,
    ).toBe('ellie.lines.grateful');
  });

  it('wires moments to the guide (Duolingo owl, but calm)', () => {
    expect(resolveElliePresence('hoy_idle').expression).toBe('neutral');
    expect(resolveElliePresence('step_done').expression).toBe('happy');
    expect(resolveElliePresence('night').expression).toBe('cozy');
    expect(resolveElliePresence('breath').expression).toBe('breathing');
    expect(resolveElliePresence('streak').expression).toBe('proud');
    expect(resolveElliePresence('care').mood).toBe('sleepy');
  });

  it('rotates daily notification portraits without black silhouettes', () => {
    const moods = [0, 1, 2, 3].map(
      (salt) => resolveElliePresence('notif_daily', { salt }).mood,
    );
    expect(moods).toEqual(['default', 'happy', 'grateful', 'default']);
  });
});
