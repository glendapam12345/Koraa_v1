export type TaskCaptureEffort = 'light' | 'medium' | 'heavy';

export type ParsedCaptureTask = {
  content: string;
  scheduled_date: string | null;
  effort?: TaskCaptureEffort | null;
  /** UUID de un proyecto existente de la usuaria, si la IA lo infiere con confianza. */
  project_id?: string | null;
};

export type TaskCaptureResult = {
  summary: string;
  main_task: ParsedCaptureTask;
  prep_steps: ParsedCaptureTask[];
  fromAi: boolean;
};
