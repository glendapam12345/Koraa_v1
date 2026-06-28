import { renderHook, waitFor } from '@testing-library/react-native';
import { useKoraaDailyBrief } from '@/hooks/useKoraaDailyBrief';
import { fetchKoraaDailyBrief } from '@/lib/ai/fetchKoraaDailyBrief';

jest.mock('@/lib/ai/fetchKoraaDailyBrief', () => ({
  fetchKoraaDailyBrief: jest.fn(),
}));

const fetchMock = fetchKoraaDailyBrief as jest.Mock;

const baseArgs = {
  userId: 'user-1',
  displayName: 'Pamela',
  todayMood: 'ansiosa',
  todayEmotionLabel: 'Ansiosa',
  energyLevel: 2,
  availableTime: 'Poco (1-2hrs)',
  focusLevel: 'Muy distraída',
  suggestion: 'Dos pasos suaves pueden bastar hoy.',
  focusCount: 2,
  focusTasks: [{ id: 't1', content: 'Responder correo' }],
  pendingCount: 12,
  locale: 'es' as const,
};

describe('useKoraaDailyBrief', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads coach line and tip highlights from daily brief', async () => {
    fetchMock.mockResolvedValue({
      coach: {
        greeting: 'Hola',
        body: 'Cuerpo',
        actionLine: 'Un paso suave y pausas cortas.',
      },
      tipIds: ['mind-3', 'rest-1'],
      tipLead: 'Consejos suaves para hoy.',
      focusTaskIds: ['t1'],
      planHeadline: 'Hoy: un paso a la vez.',
      fromAi: true,
      focusFromAi: true,
    });

    const { result } = renderHook(() => useKoraaDailyBrief(baseArgs));

    await waitFor(() => {
      expect(result.current.coachLine).toBe('Un paso suave y pausas cortas.');
    });

    expect(result.current.tipIds).toEqual(['mind-3', 'rest-1']);
    expect(result.current.tipLead).toBe('Consejos suaves para hoy.');
    expect(result.current.fromAi).toBe(true);
    expect(result.current.focusTaskIds).toEqual(['t1']);
    expect(result.current.planHeadline).toBe('Hoy: un paso a la vez.');
    expect(result.current.focusFromAi).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        checkIn: expect.objectContaining({ emotionKey: 'ansiosa', energyLevel: 2 }),
        plan: expect.objectContaining({ focusCount: 2, pendingCount: 12 }),
      }),
      expect.objectContaining({ taskCandidates: expect.any(Array) }),
    );
  });
});
