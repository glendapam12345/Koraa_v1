/**
 * In-memory auth user so save/load paths skip SecureStore `getSession()`.
 * AuthContext keeps this in sync; `getCachedAuthUser` falls back to session if empty.
 */
export type MemoryAuthUser = { id: string };

let memoryAuthUser: MemoryAuthUser | null | undefined;

export function setCachedAuthUser(user: MemoryAuthUser | null): void {
  memoryAuthUser = user;
}

export function peekCachedAuthUser(): MemoryAuthUser | null | undefined {
  return memoryAuthUser;
}

export function resetCachedAuthUser(): void {
  memoryAuthUser = undefined;
}
