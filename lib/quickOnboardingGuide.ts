import AsyncStorage from '@react-native-async-storage/async-storage';

/** Primer visita a Hoy: modal de 3 pasos del día (koraaGuide). */
export const QUICK_ONBOARDING_SEEN_KEY = 'hasSeenQuickOnboarding';

export async function hasSeenQuickOnboardingGuide(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(QUICK_ONBOARDING_SEEN_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markQuickOnboardingGuideSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUICK_ONBOARDING_SEEN_KEY, 'true');
  } catch {
    /* no crítico */
  }
}
