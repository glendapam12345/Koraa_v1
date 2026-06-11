export type CaptureWizardStep = 'write' | 'assign' | 'date' | 'save';

export const CAPTURE_WIZARD_STEPS: CaptureWizardStep[] = ['write', 'assign', 'date', 'save'];

export function captureStepIndex(step: CaptureWizardStep): number {
  return CAPTURE_WIZARD_STEPS.indexOf(step);
}

export function nextCaptureStep(step: CaptureWizardStep): CaptureWizardStep | null {
  const idx = captureStepIndex(step);
  if (idx < 0 || idx >= CAPTURE_WIZARD_STEPS.length - 1) return null;
  return CAPTURE_WIZARD_STEPS[idx + 1];
}

export function prevCaptureStep(step: CaptureWizardStep): CaptureWizardStep | null {
  const idx = captureStepIndex(step);
  if (idx <= 0) return null;
  return CAPTURE_WIZARD_STEPS[idx - 1];
}

export function canAdvanceCaptureStep(
  step: CaptureWizardStep,
  input: {
    taskText: string;
    assignToProject: boolean;
    selectedProjectId: string | null;
  },
): boolean {
  const text = input.taskText.trim();
  switch (step) {
    case 'write':
      return text.length > 0;
    case 'assign':
      return !input.assignToProject || Boolean(input.selectedProjectId);
    case 'date':
      return true;
    case 'save':
      return text.length > 0 && (!input.assignToProject || Boolean(input.selectedProjectId));
    default:
      return false;
  }
}
