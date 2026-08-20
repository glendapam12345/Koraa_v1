import { interpretTaskCapture, parseTaskCaptureAiResponse } from '@/lib/taskCaptureAi';
import { supabase } from '@/lib/supabase';
import { peekCachedAuthUser } from '@/lib/cachedAuthUser';

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cachedAuthUser', () => ({
  peekCachedAuthUser: jest.fn(() => ({ id: 'u1' })),
}));

const invoke = supabase.functions.invoke as jest.Mock;

describe('interpretTaskCapture', () => {
  const input = {
    rawText: 'llamar al banco, comprar regalo',
    locale: 'es' as const,
  };

  beforeEach(() => {
    process.env.EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED = 'true';
    process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED = 'true';
    (peekCachedAuthUser as jest.Mock).mockReturnValue({ id: 'u1' });
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED;
    delete process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  });

  it('returns local parse when AI is disabled', async () => {
    delete process.env.EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED;
    delete process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
    const result = await interpretTaskCapture('u1', input);
    expect(result.fromAi).toBe(false);
    expect(result.main_task.content.toLowerCase()).toContain('llamar');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns local parse when OpenAI fails with 401', async () => {
    invoke.mockResolvedValue({
      data: { capture: null, source: 'fallback', code: 'AI_FAILED', openaiStatus: 401 },
      error: null,
    });
    const result = await interpretTaskCapture('u1', input);
    expect(result.fromAi).toBe(false);
    expect(result.main_task.content.toLowerCase()).toContain('llamar');
    expect(result.prep_steps.length).toBeGreaterThan(0);
  });

  it('ignores fallback capture body and uses richer local parse', async () => {
    invoke.mockResolvedValue({
      data: {
        source: 'fallback',
        code: 'AI_FAILED',
        capture: {
          summary: 'weak',
          main_task: { content: 'weak-only' },
          prep_steps: [],
        },
      },
      error: null,
    });
    const result = await interpretTaskCapture('u1', input);
    expect(result.fromAi).toBe(false);
    expect(result.main_task.content).not.toBe('weak-only');
  });

  it('returns local parse when invoke throws', async () => {
    invoke.mockRejectedValue(new Error('network'));
    const result = await interpretTaskCapture('u1', input);
    expect(result.fromAi).toBe(false);
    expect(result.main_task.content.toLowerCase()).toContain('llamar');
  });

  it('returns local parse when the edge function reports an error', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    const result = await interpretTaskCapture('u1', input);
    expect(result.fromAi).toBe(false);
    expect(result.main_task.content.toLowerCase()).toContain('llamar');
  });

  it('parses a successful OpenAI payload', () => {
    const parsed = parseTaskCaptureAiResponse({
      source: 'openai',
      capture: {
        summary: 'AI understood',
        main_task: { content: 'Call the bank', scheduled_date: '2026-08-20', effort: 'light' },
        prep_steps: [{ content: 'Buy a gift', scheduled_date: '2026-08-20' }],
      },
    });
    expect(parsed?.fromAi).toBe(true);
    expect(parsed?.main_task.content).toBe('Call the bank');
    expect(parsed?.prep_steps[0].content).toBe('Buy a gift');
  });

  it('rejects fallback payloads so the client uses local parse', () => {
    expect(
      parseTaskCaptureAiResponse({
        source: 'fallback',
        code: 'AI_FAILED',
        capture: { summary: 'weak', main_task: { content: 'weak-only' }, prep_steps: [] },
      }),
    ).toBeNull();
  });
});
