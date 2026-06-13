import { validateProjectName } from '@/lib/projectNameValidation';

describe('createProject', () => {
  it('rejects empty name', () => {
    expect(validateProjectName('')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects duplicate names case-insensitively', () => {
    expect(validateProjectName('Maratón', ['maratón'])).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('accepts valid name', () => {
    expect(validateProjectName('  Salud  ')).toEqual({ ok: true, name: 'Salud' });
  });
});
