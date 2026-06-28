import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import {
  ONBOARDING_ACTIVITY_SUGGESTION_IDS,
  ONBOARDING_MAX_ACTIVITIES,
  ONBOARDING_MAX_ACTIVITY_LENGTH,
  canAddOnboardingActivity,
  normalizeOnboardingActivities,
} from '@/lib/onboardingActivities';

export function useOnboardingActivitiesForm(initial: string[] = []) {
  const [activities, setActivities] = useState<string[]>(() =>
    normalizeOnboardingActivities(initial),
  );
  const [draft, setDraft] = useState('');

  const addActivity = (label: string) => {
    const trimmed = label.trim();
    if (!canAddOnboardingActivity(activities, trimmed)) return false;
    setActivities((current) => normalizeOnboardingActivities([...current, trimmed]));
    return true;
  };

  const removeActivity = (index: number) => {
    setActivities((current) => current.filter((_, i) => i !== index));
  };

  const toggleSuggestion = (label: string) => {
    const key = label.trim().toLowerCase();
    const existingIndex = activities.findIndex((item) => item.toLowerCase() === key);
    if (existingIndex >= 0) {
      removeActivity(existingIndex);
      return;
    }
    addActivity(label);
  };

  const isSuggestionSelected = (label: string) =>
    activities.some((item) => item.toLowerCase() === label.trim().toLowerCase());

  const submitDraft = () => {
    const added = addActivity(draft);
    if (added) setDraft('');
    return added;
  };

  return {
    activities,
    draft,
    setDraft,
    addActivity,
    removeActivity,
    toggleSuggestion,
    isSuggestionSelected,
    submitDraft,
    atLimit: activities.length >= ONBOARDING_MAX_ACTIVITIES,
  };
}

type OnboardingActivitiesPickerProps = {
  activities: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitDraft: () => void;
  onRemoveActivity: (index: number) => void;
  onToggleSuggestion: (label: string) => void;
  isSuggestionSelected: (label: string) => boolean;
  atLimit: boolean;
};

export function OnboardingActivitiesPicker({
  activities,
  draft,
  onDraftChange,
  onSubmitDraft,
  onRemoveActivity,
  onToggleSuggestion,
  isSuggestionSelected,
  atLimit,
}: OnboardingActivitiesPickerProps) {
  const { t } = useI18n();

  const suggestions = useMemo(
    () =>
      ONBOARDING_ACTIVITY_SUGGESTION_IDS.map((id) => ({
        id,
        label: t(`onboarding.activities.suggestions.${id}` as TranslationKey),
      })),
    [t],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.sectionLabel}>{t('onboarding.activities.suggestionsLabel')}</Text>
      <View style={styles.suggestionGrid}>
        {suggestions.map((suggestion) => {
          const selected = isSuggestionSelected(suggestion.label);
          return (
            <Pressable
              key={suggestion.id}
              onPress={() => onToggleSuggestion(suggestion.label)}
              disabled={atLimit && !selected}
              style={({ pressed }) => [
                styles.suggestionChip,
                selected && styles.suggestionChipSelected,
                pressed && styles.suggestionChipPressed,
                atLimit && !selected && styles.suggestionChipDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.activities.toggleSuggestionA11y', {
                name: suggestion.label,
              })}
              accessibilityState={{ selected, disabled: atLimit && !selected }}
            >
              <Text
                style={[
                  styles.suggestionChipText,
                  selected && styles.suggestionChipTextSelected,
                ]}
              >
                {suggestion.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activities.length > 0 ? (
        <View style={styles.selectedBlock}>
          <Text style={styles.sectionLabel}>{t('onboarding.activities.selectedLabel')}</Text>
          <View style={styles.selectedGrid}>
            {activities.map((activity, index) => (
              <View key={`${activity}-${index}`} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{activity}</Text>
                <TouchableOpacity
                  onPress={() => onRemoveActivity(index)}
                  style={styles.selectedChipRemove}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.activities.removeA11y', { name: activity })}
                >
                  <X size={14} color={THEME.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t('onboarding.activities.customLabel')}</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={draft}
          onChangeText={onDraftChange}
          placeholder={t('onboarding.activities.customPlaceholder')}
          placeholderTextColor={THEME.colors.text.tertiary}
          onSubmitEditing={onSubmitDraft}
          editable={!atLimit}
          maxLength={ONBOARDING_MAX_ACTIVITY_LENGTH}
          accessibilityLabel={t('onboarding.activities.customPlaceholder')}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!draft.trim() || atLimit) && styles.addBtnDisabled]}
          onPress={onSubmitDraft}
          disabled={!draft.trim() || atLimit}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.activities.addCustomA11y')}
          accessibilityState={{ disabled: !draft.trim() || atLimit }}
        >
          <Plus size={20} color={THEME.colors.onGradient} />
        </TouchableOpacity>
      </View>
      {atLimit ? (
        <Text style={styles.limitHint}>
          {t('onboarding.activities.limitHint', { max: ONBOARDING_MAX_ACTIVITIES })}
        </Text>
      ) : null}
    </View>
  );
}

export function OnboardingActivitiesSkipLink({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.skipBtn}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(disabled) }}
    >
      <Text style={styles.skipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minHeight: 36,
    justifyContent: 'center',
  },
  suggestionChipSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  suggestionChipPressed: {
    opacity: 0.85,
  },
  suggestionChipDisabled: {
    opacity: 0.45,
  },
  suggestionChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  suggestionChipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  selectedBlock: {
    gap: THEME.spacing.xs,
  },
  selectedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingLeft: THEME.spacing.sm,
    paddingRight: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
  },
  selectedChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  selectedChipRemove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  addInput: {
    ...THEME.typography.body,
    flex: 1,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  addBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  limitHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    marginTop: THEME.spacing.xs,
  },
  skipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
});
