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

  it('steps in 5 minute increments within bounds', () => {
    expect(stepEstimatedMinutes(45, 5)).toBe(50);
    expect(stepEstimatedMinutes(10, -5)).toBe(5);
    expect(stepEstimatedMinutes(5, -5)).toBe(5);
    expect(clampEstimatedMinutes(1000)).toBe(480);
    expect(clampEstimatedMinutes(23)).toBe(25);
  });
});
