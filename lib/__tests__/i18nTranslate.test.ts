import { translate } from '@/lib/i18n';

describe('translate', () => {
  it('returns the key when missing', () => {
    expect(translate('es', 'does.not.exist')).toBe('does.not.exist');
  });

  it('returns empty string for intentional empty translations', () => {
    expect(translate('es', 'vaciar.titleAccent')).toBe('');
  });

  it('interpolates params', () => {
    expect(translate('es', 'yo.versionLabel', { version: '1.0.3' })).toContain('1.0.3');
  });

  it('returns more_energy reasonSub copy', () => {
    expect(translate('es', 'reorganizeDay.reasonSub.more_energy')).toBe(
      'Quiero aprovechar el impulso de hoy',
    );
  });
});
