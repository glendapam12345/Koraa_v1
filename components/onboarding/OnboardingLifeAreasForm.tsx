import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useMemo, useState } from 'react';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import {
  getDefaultOnboardingAreaRefs,
  getOnboardingSelectableAreaRefs,
  type OnboardingAreaSelection,
} from '@/lib/review/onboardingAreaSelection';
import {
  isCustomLifeAreaRef,
  lifeAreaCatalogEntry,
  type LifeAreaKey,
  type LifeAreaRef,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import { makePresetCustomAreaLabelGetter } from '@/lib/lifeAreas/makePresetCustomAreaLabelGetter';
import { BRAIN_DUMP_PRESET_CUSTOM } from '@/lib/review/brainDumpAreaPreset';
import { getLifeAreaAccentColor } from '@/lib/lifeAreas/lifeAreaColors';

function buildInitialSelections(): OnboardingAreaSelection[] {
  const defaults = new Set(getDefaultOnboardingAreaRefs());
  return getOnboardingSelectableAreaRefs().map((ref) => ({
    ref,
    enabled: defaults.has(ref),
    name: '',
    examples: '',
  }));
}

function resolveAreaEmoji(ref: LifeAreaRef): string {
  if (isCustomLifeAreaRef(ref)) {
    const customId = ref.slice('custom:'.length);
    return BRAIN_DUMP_PRESET_CUSTOM.find((entry) => entry.id === customId)?.emoji ?? '🌿';
  }
  return lifeAreaCatalogEntry(ref as LifeAreaKey).emoji;
}

type OnboardingLifeAreasFormProps = {
  onSelectionsChange?: (selections: OnboardingAreaSelection[]) => void;
};

export function useOnboardingLifeAreasForm({ onSelectionsChange }: OnboardingLifeAreasFormProps = {}) {
  const [selections, setSelections] = useState<OnboardingAreaSelection[]>(buildInitialSelections);

  const enabledCount = useMemo(
    () => selections.filter((selection) => selection.enabled).length,
    [selections],
  );

  const updateSelections = (next: OnboardingAreaSelection[]) => {
    setSelections(next);
    onSelectionsChange?.(next);
  };

  const toggleArea = (ref: LifeAreaRef, enabled: boolean) => {
    updateSelections(
      selections.map((selection) =>
        selection.ref === ref ? { ...selection, enabled } : selection,
      ),
    );
  };

  const setExamples = (ref: LifeAreaRef, examples: string) => {
    updateSelections(
      selections.map((selection) =>
        selection.ref === ref ? { ...selection, examples } : selection,
      ),
    );
  };

  return {
    selections,
    enabledCount,
    toggleArea,
    setExamples,
    setSelections: updateSelections,
  };
}

type OnboardingLifeAreasListProps = {
  selections: OnboardingAreaSelection[];
  onToggleArea: (ref: LifeAreaRef, enabled: boolean) => void;
  onExamplesChange: (ref: LifeAreaRef, examples: string) => void;
};

export function OnboardingLifeAreasList({
  selections,
  onToggleArea,
  onExamplesChange,
}: OnboardingLifeAreasListProps) {
  const { t } = useI18n();
  const getPresetCustomLabel = makePresetCustomAreaLabelGetter(t);

  const resolveAreaLabel = (ref: LifeAreaRef): string => {
    if (isCustomLifeAreaRef(ref)) {
      return getPresetCustomLabel(ref.slice('custom:'.length));
    }
    return t(`lifeAreas.${ref}` as TranslationKey);
  };

  return (
    <View style={styles.list}>
      {selections.map((selection, index) => {
        const label = resolveAreaLabel(selection.ref);
        const accent = getLifeAreaAccentColor(selection.ref, index);
        return (
          <View
            key={selection.ref}
            style={[
              styles.areaCard,
              selection.enabled && { borderColor: accent, backgroundColor: `${accent}12` },
            ]}
          >
            <View style={styles.areaHeader}>
              <View style={styles.areaTitleRow}>
                <Text style={styles.areaEmoji}>{resolveAreaEmoji(selection.ref)}</Text>
                <Text style={styles.areaName}>{label}</Text>
              </View>
              <Switch
                value={selection.enabled}
                onValueChange={(enabled) => onToggleArea(selection.ref, enabled)}
                trackColor={{
                  false: THEME.colors.calm.mist,
                  true: THEME.colors.calm.lavender,
                }}
                thumbColor={THEME.colors.fill[100]}
                accessibilityLabel={t('onboarding.areas.toggleA11y', { name: label })}
              />
            </View>
            {selection.enabled ? (
              <TextInput
                style={styles.examplesInput}
                value={selection.examples}
                onChangeText={(text) => onExamplesChange(selection.ref, text)}
                placeholder={t('onboarding.areas.examplesPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                multiline
                accessibilityLabel={t('onboarding.areas.examplesPlaceholder')}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  areaCard: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    ...THEME.shadows.soft,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  areaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  areaEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  areaName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flexShrink: 1,
  },
  examplesInput: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: 44,
    textAlignVertical: 'top',
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

export function OnboardingAreasSkipLink({
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
