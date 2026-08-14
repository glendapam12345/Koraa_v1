import { normalizeDisplayName } from '@/lib/displayName';

describe('normalizeDisplayName', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeDisplayName('  María   García  ')).toBe('María García');
  });

  it('rejects empty or too-short names', () => {
    expect(normalizeDisplayName('')).toBeNull();
    expect(normalizeDisplayName(' A ')).toBeNull();
  });

  it('accepts two or more characters', () => {
    expect(normalizeDisplayName('Jo')).toBe('Jo');
    expect(normalizeDisplayName('Pam')).toBe('Pam');
  });
});
