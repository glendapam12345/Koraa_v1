import { contextHintToLifeAreaKey } from '@/lib/review/contextHintToLifeArea';

describe('contextHintToLifeAreaKey', () => {
  it('maps venture to creative', () => {
    expect(contextHintToLifeAreaKey('venture')).toBe('creative');
  });

  it('maps work to work', () => {
    expect(contextHintToLifeAreaKey('work')).toBe('work');
  });
});
