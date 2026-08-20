import { router } from 'expo-router';

let navigatingToLogin = false;

/** One replace to login — avoids Expo Router crashes from duplicate sign-out navigations. */
export function goToLogin(): void {
  if (navigatingToLogin) return;
  navigatingToLogin = true;
  try {
    router.replace('/auth/login');
  } catch {
    /* navigation may fail if the tree is mid-unmount */
  }
  setTimeout(() => {
    navigatingToLogin = false;
  }, 1500);
}
