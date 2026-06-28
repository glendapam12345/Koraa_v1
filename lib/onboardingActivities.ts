export const ONBOARDING_MAX_ACTIVITIES = 25;
export const ONBOARDING_MAX_ACTIVITY_LENGTH = 50;

/** IDs de sugerencias — las etiquetas vienen de i18n (`onboarding.activities.suggestions.*`). */
export const ONBOARDING_ACTIVITY_SUGGESTION_IDS = [
  'meetings',
  'cooking',
  'exercise',
  'errands',
  'study',
  'familyCare',
  'email',
  'rest',
  'creative',
] as const;

export type OnboardingActivitySuggestionId = (typeof ONBOARDING_ACTIVITY_SUGGESTION_IDS)[number];

export function normalizeOnboardingActivities(activities: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of activities) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > ONBOARDING_MAX_ACTIVITY_LENGTH) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= ONBOARDING_MAX_ACTIVITIES) break;
  }

  return result;
}

export function canAddOnboardingActivity(
  activities: string[],
  candidate: string,
): boolean {
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > ONBOARDING_MAX_ACTIVITY_LENGTH) return false;
  if (activities.length >= ONBOARDING_MAX_ACTIVITIES) return false;
  const key = trimmed.toLowerCase();
  return !activities.some((item) => item.toLowerCase() === key);
}
