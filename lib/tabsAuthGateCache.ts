/** Remember that this user already passed the tabs profile gate this JS session. */
let lastAllowedTabsUserId: string | null = null;

export function rememberTabsGateUser(userId: string): void {
  lastAllowedTabsUserId = userId;
}

export function clearTabsGateUser(): void {
  lastAllowedTabsUserId = null;
}

export function isTabsGateRemembered(userId: string | undefined): boolean {
  return Boolean(userId && lastAllowedTabsUserId === userId);
}
