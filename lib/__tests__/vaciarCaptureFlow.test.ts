import {
  canAdvanceCaptureStep,
  nextCaptureStep,
  prevCaptureStep,
  CAPTURE_WIZARD_STEPS,
} from '@/lib/vaciarCaptureFlow';

describe('vaciarCaptureFlow', () => {
  const base = {
    taskText: 'Comprar leche',
    assignToProject: false,
    selectedProjectId: null as string | null,
  };

  it('defines four wizard steps', () => {
    expect(CAPTURE_WIZARD_STEPS).toEqual(['write', 'assign', 'date', 'save']);
  });

  it('requires text on write step', () => {
    expect(canAdvanceCaptureStep('write', { ...base, taskText: '  ' })).toBe(false);
    expect(canAdvanceCaptureStep('write', base)).toBe(true);
  });

  it('requires project when assign to project', () => {
    expect(
      canAdvanceCaptureStep('assign', { ...base, assignToProject: true, selectedProjectId: null }),
    ).toBe(false);
    expect(
      canAdvanceCaptureStep('assign', {
        ...base,
        assignToProject: true,
        selectedProjectId: 'abc-123',
      }),
    ).toBe(true);
  });

  it('walks forward and back through steps', () => {
    expect(nextCaptureStep('write')).toBe('assign');
    expect(nextCaptureStep('save')).toBeNull();
    expect(prevCaptureStep('assign')).toBe('write');
    expect(prevCaptureStep('write')).toBeNull();
  });
});
