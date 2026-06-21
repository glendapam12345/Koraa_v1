import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { VnextSelectableChip } from '@/components/vnext/VnextSelectableChip';
import { PlanRealismCard } from '@/components/vnext/PlanRealismCard';
import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';
import {
  applyRealityCheckToItems,
  assessPlanRealism,
} from '@/lib/vnext/planRealism';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type {
  RealityCheckInput,
  VnextAvailableHours,
  VnextEnergyLevel,
} from '@/lib/vnext/types';

const HOUR_OPTIONS: VnextAvailableHours[] = [2, 4, 6, 8];
const ENERGY_OPTIONS: VnextEnergyLevel[] = ['low', 'normal', 'high'];

type RealityCheckScreenProps = {
  displayName: string;
  items: EnrichedCaptureItem[];
  projects: { id: string; name: string; due_date?: string | null }[];
  onBack: () => void;
  onContinue: (check: RealityCheckInput) => void;
  isSaving?: boolean;
};

export function RealityCheckScreen({
  displayName,
  items,
  projects,
  onBack,
  onContinue,
  isSaving = false,
}: RealityCheckScreenProps) {
  const { t } = useI18n();
  const { fronts } = useMemo(() => buildCaptureFronts(items, projects), [items, projects]);

  const focusOptions = useMemo(
    () => fronts.filter((front) => front.tasks.length > 0),
    [fronts],
  );

  const [focusKey, setFocusKey] = useState<string | null>(
    () => focusOptions[0]?.key ?? null,
  );
  const [hours, setHours] = useState<VnextAvailableHours>(4);
  const [energy, setEnergy] = useState<VnextEnergyLevel>('normal');

  const draftCheck = useMemo((): RealityCheckInput | null => {
    const focus = focusOptions.find((front) => front.key === focusKey);
    if (!focus) return null;
    return {
      focusFrontKey: focus.key,
      focusFrontName: focus.name,
      availableHours: hours,
      energy,
    };
  }, [energy, focusKey, focusOptions, hours]);

  const realism = useMemo(() => {
    if (!draftCheck) return null;
    const adjusted = applyRealityCheckToItems(items, fronts, draftCheck);
    return assessPlanRealism(adjusted, fronts, draftCheck);
  }, [draftCheck, fronts, items]);

  const canContinue = Boolean(draftCheck) && !isSaving;

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('frentes.editBeforePlan')}
        >
          <ArrowLeft size={20} color={THEME.colors.text.secondary} />
          <Text style={styles.backText}>{t('frentes.editBeforePlan')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          {t('vnext.realityGreeting', { name: displayName })}
        </Text>
        <Text style={styles.title}>{t('vnext.realityTitle')}</Text>
        <Text style={styles.sub}>{t('vnext.realitySub')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vnext.focusQuestion')}</Text>
          <View style={styles.chipGrid}>
            {focusOptions.map((front) => {
              const theme = frontThemeForFront(front);
              return (
                <VnextSelectableChip
                  key={front.key}
                  label={front.name}
                  emoji={front.emoji}
                  selected={focusKey === front.key}
                  accentColor={theme.accent}
                  onPress={() => setFocusKey(front.key)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vnext.timeQuestion')}</Text>
          <View style={styles.rowChips}>
            {HOUR_OPTIONS.map((option) => (
              <VnextSelectableChip
                key={option}
                label={option >= 8 ? t('vnext.hours8plus') : t('vnext.hours', { count: option })}
                selected={hours === option}
                onPress={() => setHours(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vnext.energyQuestion')}</Text>
          <View style={styles.rowChips}>
            {ENERGY_OPTIONS.map((option) => (
              <VnextSelectableChip
                key={option}
                label={t(`vnext.energy.${option}`)}
                emoji={
                  option === 'low' ? '😴' : option === 'high' ? '⚡' : '🌤️'
                }
                selected={energy === option}
                onPress={() => setEnergy(option)}
              />
            ))}
          </View>
        </View>

        {realism ? <PlanRealismCard realism={realism} /> : null}

        <View style={styles.reminder}>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.reminderText}>{t('vnext.realityReminder')}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CalmPrimaryButton
          label={t('frentes.createPlanCta')}
          onPress={() => {
            if (draftCheck) onContinue(draftCheck);
          }}
          large
          disabled={!canContinue}
          loading={isSaving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: THEME.spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    minHeight: THEME.sizes.touchTarget,
  },
  backText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  scroll: {
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
  greeting: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  sub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  section: {
    gap: THEME.spacing.sm,
  },
  sectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  chipGrid: {
    gap: 10,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
  },
  reminderText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingTop: THEME.spacing.xs,
  },
});
