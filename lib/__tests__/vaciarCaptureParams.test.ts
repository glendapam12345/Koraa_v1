import {
  buildVaciarCaptureParams,
  firstSearchParam,
  isFreshCaptureRequest,
  isHoyCaptureSource,
  takeFreshCaptureStamp,
} from '@/lib/vaciarCaptureParams';

describe('vaciarCaptureParams', () => {
  it('builds a fresh capture with a stamp so a second tap can reset again', () => {
    const params = buildVaciarCaptureParams({ source: 'hoy' }, 'stamp-9');
    expect(params).toEqual({
      segment: 'capture',
      fresh: '1',
      stamp: 'stamp-9',
      date: '',
      projectId: '',
      suggestion: '',
      source: 'hoy',
    });
  });

  it('treats only fresh=1 as a reset, including array params', () => {
    expect(isFreshCaptureRequest('1')).toBe(true);
    expect(isFreshCaptureRequest(['1'])).toBe(true);
    expect(isFreshCaptureRequest('')).toBe(false);
    expect(isFreshCaptureRequest(undefined)).toBe(false);
  });

  it('detects Hoy as the return source', () => {
    expect(isHoyCaptureSource('hoy')).toBe(true);
    expect(isHoyCaptureSource(['hoy'])).toBe(true);
    expect(isHoyCaptureSource('semana')).toBe(false);
    expect(isHoyCaptureSource('')).toBe(false);
    expect(firstSearchParam(['a', 'b'])).toBe('a');
  });

  it('consumes a fresh stamp only once so remounts do not reset the form', () => {
    expect(takeFreshCaptureStamp('stamp-once-a')).toBe(true);
    expect(takeFreshCaptureStamp('stamp-once-a')).toBe(false);
    expect(takeFreshCaptureStamp('stamp-once-b')).toBe(true);
  });
});
