/** Longitud mínima alineada con registro, ajustes y mensajes de Supabase en la app. */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordErrorKey =
  | 'password.empty'
  | 'password.tooShort'
  | 'password.needsUppercase'
  | 'password.needsLetter'
  | 'password.needsNumber';

/** Devuelve la clave i18n del primer requisito que no cumple, o null si es válida. */
export function getPasswordErrorKey(password: string): PasswordErrorKey | null {
  const value = password;
  if (!value.trim()) return 'password.empty';
  if (value.length < PASSWORD_MIN_LENGTH) return 'password.tooShort';
  if (!/[A-ZÁÉÍÓÚÑ]/.test(value)) return 'password.needsUppercase';
  if (!/[a-záéíóúñ]/.test(value)) return 'password.needsLetter';
  if (!/\d/.test(value)) return 'password.needsNumber';
  return null;
}

export function isPasswordValid(password: string): boolean {
  return getPasswordErrorKey(password) === null;
}
