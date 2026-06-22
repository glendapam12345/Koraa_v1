import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { OnboardingScreenShell, onboardingTypography } from '@/components/onboarding/OnboardingScreenShell';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  BRAIN_DUMP_PRESET_CUSTOM,
  BRAIN_DUMP_PRESET_CUSTOM_IDS,
  BRAIN_DUMP_PRESET_LABELS,
  ensureBrainDumpPresetInConfig,
} from '@/lib/review/brainDumpAreaPreset';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';

type OnboardingAreaRow = {
  ref: LifeAreaKey | `custom:${string}`;
  emoji: string;
  nameKey?: TranslationKey;
  defaultName: string;
};

const ONBOARDING_AREA_ROWS: OnboardingAreaRow[] = [
  { ref: 'health', emoji: '💚', nameKey: 'lifeAreas.health', defaultName: 'Salud y bienestar' },
  { ref: 'home', emoji: '🏠', nameKey: 'lifeAreas.home', defaultName: 'Hogar' },
  {
    ref: makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia),
    emoji: '👨‍👩‍👧',
    defaultName: 'Familia',
  },
  {
    ref: makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
    emoji: '🌸',
    defaultName: 'Personal',
  },
  { ref: 'work', emoji: '💼', nameKey: 'lifeAreas.work', defaultName: 'Trabajo' },
];

export default function OnboardingProjectsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { config, saveConfig } = useUserLifeAreas(user?.id);

  const initialRows = useMemo(
    () =>
      ONBOARDING_AREA_ROWS.map((row) => ({
        ...row,
        name: row.nameKey ? t(row.nameKey) : row.defaultName,
        examples: '',
      })),
    [t],
  );

  const [rows, setRows] = useState(initialRows);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const updateRow = (index: number, patch: Partial<(typeof rows)[number]>) => {
    setRows((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const goNext = () => {
    router.replace({ pathname: '/paywall', params: { next: '/(tabs)', source: 'onboarding' } });
  };

  const handleContinue = async () => {
    if (!user) {
      goNext();
      return;
    }

    setIsSaving(true);
    try {
      const base = ensureBrainDumpPresetInConfig(config);
      const labels = { ...base.labels, ...BRAIN_DUMP_PRESET_LABELS };
      const examples: Partial<Record<LifeAreaKey, string>> = { ...base.examples };
      const customExamples: Record<string, string> = { ...base.customExamples };
      let custom = base.custom.length ? [...base.custom] : [...BRAIN_DUMP_PRESET_CUSTOM];

      for (const row of rows) {
        const trimmedName = row.name.trim();
        const trimmedExamples = row.examples.trim();
        if (!trimmedName && !trimmedExamples) continue;

        if (row.ref.startsWith('custom:')) {
          const customId = row.ref.slice('custom:'.length);
          if (trimmedName) {
            custom = custom.map((entry) =>
              entry.id === customId ? { ...entry, name: trimmedName, emoji: row.emoji } : entry,
            );
          }
          if (trimmedExamples) customExamples[customId] = trimmedExamples;
        } else {
          const key = row.ref as LifeAreaKey;
          if (trimmedName) labels[key] = trimmedName;
          if (trimmedExamples) examples[key] = trimmedExamples;
        }
      }

      const ok = await saveConfig({
        ...base,
        labels,
        examples,
        customExamples,
        custom,
      });

      if (!ok) {
        setToastMessage(t('onboarding.areas.saveError'));
        return;
      }
      goNext();
    } catch {
      setToastMessage(t('onboarding.areas.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <OnboardingScreenShell
        footer={
          <View style={styles.footerStack}>
            <CalmPrimaryButton
              label={isSaving ? t('onboarding.areas.saving') : t('onboarding.areas.continue')}
              onPress={handleContinue}
              disabled={isSaving}
              accessibilityLabel={t('onboarding.areas.continue')}
            />
            <TouchableOpacity
              onPress={goNext}
              disabled={isSaving}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.areas.skip')}
            >
              <Text style={styles.skipText}>{t('onboarding.areas.skip')}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={onboardingTypography.iconContainer}>
          <View style={onboardingTypography.iconCircle}>
            <LayoutGrid size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={onboardingTypography.title}>{t('onboarding.areas.title')}</Text>
        <Text style={onboardingTypography.titleAccent}>{t('onboarding.areas.titleAccent')}</Text>
        <Text style={onboardingTypography.subtitle}>{t('onboarding.areas.subtitle')}</Text>
        <Text style={styles.hint}>{t('onboarding.areas.hint')}</Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {rows.map((row, index) => (
            <View key={row.ref} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowEmoji}>{row.emoji}</Text>
                <TextInput
                  value={row.name}
                  onChangeText={(value) => updateRow(index, { name: value })}
                  placeholder={row.defaultName}
                  placeholderTextColor={THEME.colors.text.secondary}
                  style={styles.nameInput}
                  maxLength={40}
                  autoCorrect={false}
                />
              </View>
              <TextInput
                value={row.examples}
                onChangeText={(value) => updateRow(index, { examples: value })}
                placeholder={t('onboarding.areas.examplesPlaceholder')}
                placeholderTextColor={THEME.colors.text.secondary}
                style={styles.examplesInput}
                maxLength={120}
                autoCorrect={false}
                multiline
              />
            </View>
          ))}
        </ScrollView>
      </OnboardingScreenShell>

      {toastMessage ? (
        <Toast message={toastMessage} type="error" onHide={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    lineHeight: 22,
  },
  list: {
    maxHeight: 360,
    marginTop: THEME.spacing.xs,
  },
  listContent: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  row: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[100],
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  rowEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  nameInput: {
    ...THEME.typography.body,
    flex: 1,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    paddingVertical: 4,
  },
  examplesInput: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 10,
    minHeight: 44,
    lineHeight: 18,
  },
  footerStack: {
    gap: THEME.spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  skipText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
