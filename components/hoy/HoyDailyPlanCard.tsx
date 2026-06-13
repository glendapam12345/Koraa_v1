import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, ChevronRight, ChevronDown } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { HoyGentleRhythmStrip } from '@/components/hoy/HoyGentleRhythmStrip';
import { buildHoyDailyPlan } from '@/lib/hoyDailyPlan';

type HoyDailyPlanCardProps = {
  stepCount: number;
  crisisMode: boolean;
  energyLevel: number;
  prioritiesDone: number;
  prioritiesTotal: number;
  allFocusDone: boolean;
  prioritiesExpanded?: boolean;
  onTogglePriorities?: () => void;
  prioritiesSlot?: ReactNode;
  footerSlot?: ReactNode;
};

export function HoyDailyPlanCard({
  stepCount,
  crisisMode,
  energyLevel,
  prioritiesDone,
  prioritiesTotal,
  allFocusDone,
  prioritiesExpanded = false,
  onTogglePriorities,
  prioritiesSlot,
  footerSlot,
}: HoyDailyPlanCardProps) {
  const { t } = useI18n();
  const rows = buildHoyDailyPlan();

  const subtitle =
    stepCount > 0
      ? prioritiesExpanded
        ? t('hoy.planPrioritiesSubOpen')
        : t('hoy.planPrioritiesSub')
      : t('hoy.planPrioritiesSubEmpty');

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('hoy.planTitle')}</Text>
        <Text style={styles.subtitle}>
          {crisisMode ? t('hoy.planSubtitleCare') : t('hoy.planSubtitle')}
        </Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <View key={`${row.kind}-${index}`}>
            <TouchableOpacity
              style={[styles.row, prioritiesExpanded && styles.rowExpanded]}
              onPress={() => onTogglePriorities?.()}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.planPrioritiesA11y', { count: Math.max(stepCount, 0) })}
              accessibilityState={{ expanded: prioritiesExpanded }}
            >
              <View style={[styles.iconWrap, styles.prioritiesIcon]}>
                <Target size={20} color={THEME.colors.calm.lavenderDeep} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t('hoy.planPrioritiesTitle')}</Text>
                <Text style={styles.rowSub}>{subtitle}</Text>
              </View>
              {prioritiesExpanded ? (
                <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
              ) : (
                <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
              )}
            </TouchableOpacity>
            {prioritiesExpanded && prioritiesSlot ? (
              <View style={styles.expandSlot}>{prioritiesSlot}</View>
            ) : null}
          </View>
        ))}
      </View>

      <HoyGentleRhythmStrip
        crisisMode={crisisMode}
        energyLevel={energyLevel}
        prioritiesDone={prioritiesDone}
        prioritiesTotal={prioritiesTotal}
        allFocusDone={allFocusDone}
      />

      {footerSlot ? <View style={styles.footerSlot}>{footerSlot}</View> : null}
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  rows: {
    gap: THEME.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  rowExpanded: {
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritiesIcon: {
    backgroundColor: THEME.colors.calm.lavender,
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  rowSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 17,
  },
  expandSlot: {
    marginTop: THEME.spacing.xs,
    gap: THEME.spacing.xs,
  },
  footerSlot: {
    gap: THEME.spacing.xs,
  },
});
