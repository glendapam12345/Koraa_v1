import { speechRecognitionLocale } from '@/lib/taskVoiceLocale';

describe('speechRecognitionLocale', () => {
  it('uses es-MX for Spanish', () => {
    expect(speechRecognitionLocale('es')).toBe('es-MX');
  });

  it('uses en-US for English', () => {
    expect(speechRecognitionLocale('en')).toBe('en-US');
  });
});
