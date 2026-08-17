import { buildEllieAdaptMessage, energyBand, mindBand } from '@/lib/ellieCheckInInterpret';

describe('ellieCheckInInterpret', () => {
  it('bands energy without using enough-for-today', () => {
    expect(energyBand(1)).toBe('low');
    expect(energyBand(3)).toBe('ok');
    expect(energyBand(5)).toBe('high');
  });

  it('bands mind from stored focus labels', () => {
    expect(mindBand('Nublada')).toBe('cloudy');
    expect(mindBand('Clara')).toBe('clear');
    expect(mindBand('Normal')).toBe('ok');
  });

  it('does not push capture when the day is free', () => {
    const message = buildEllieAdaptMessage({
      emotionLabel: 'calm',
      energyLevel: 4,
      focusLevel: 'clear',
      hasTasks: false,
      gotYou: 'Okay, I’ve got you.',
      summary: 'You’re feeling good.',
      lighter: 'Let’s make today lighter.',
      freeDay: 'You have a free day. What sounds right?',
    });
    expect(message).toContain('free day');
    expect(message).not.toContain('lighter');
  });
});
