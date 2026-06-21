import {
  clampEstimatedMinutes,
  formatDurationLabel,
  stepEstimatedMinutes,
} from '@/lib/taskPlanningMeta';

describe('taskPlanningMeta duration helpers', () => {
  it('formats hours and minutes', () => {
    expect(formatDurationLabel(45)).toBe('45 min');
    expect(formatDurationLabel(90)).toBe('1 h 30 min');
  });

  it('steps in 15 minute increments within bounds', () => {
    expect(stepEstimatedMinutes(45, 15)).toBe(60);
    expect(stepEstimatedMinutes(15, -15)).toBe(15);
    expect(clampEstimatedMinutes(1000)).toBe(480);
  });
});
