import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Clock, ChevronRight, ChevronDown } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { HoyGentleRhythmStrip } from '@/components/hoy/HoyGentleRhythmStrip';
import { HoyStepBadge } from '@/components/hoy/HoyStepBadge';

type HoyDailyPlanCardProps = {
  stepCount: number;
  waitingCount: number;
  crisisMode: boolean;
  energyLevel: number;
  prioritiesDone: number;
  prioritiesTotal: number;
  allFocusDone: boolean;
  hasCheckIn?: boolean;
  prioritiesExpanded?: boolean;
  onTogglePriorities?: () => void;
  prioritiesSlot?: ReactNode;
  waitingExpanded?: boolean;
  onToggleWaiting?: () => void;
  waitingSlot?: ReactNode;
};

export function HoyDailyPlanCard({
  stepCount,
  waitingCount,
  crisisMode,
  energyLevel,
  prioritiesDone,
  prioritiesTotal,
  allFocusDone,
  hasCheckIn = false,
  prioritiesExpanded = false,
  onTogglePriorities,
  prioritiesSlot,
  waitingExpanded = false,
  onToggleWaiting,
  waitingSlot,
}: HoyDailyPlanCardProps) {
  const { t } = useI18n();

  const prioritiesSubtitle = allFocusDone
    ? t('hoy.planPrioritiesSubAllDone')
    : stepCount > 0
      ? prioritiesExpanded
        ? t('hoy.planPrioritiesSubOpen')
        : t('hoy.planPrioritiesSub')
      : t('hoy.planPrioritiesSubEmpty');

  const waitingSubtitle =
    waitingCount > 0
      ? waitingExpanded
        ? t('hoy.planWaitingSubOpen')
        : t('hoy.planWaitingSub', { count: waitingCount })
      : t('hoy.planWaitingSubEmpty');

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HoyStepBadge step={2} />
          <Text style={styles.title}>{t('hoy.planTitle')}</Text>
        </View>
        <Text style={styles.subtitle}>
          {crisisMode
            ? t('hoy.planSubtitleCare')
            : hasCheckIn
              ? t('hoy.planSubtitleWithCheckIn')
              : t('hoy.planSubtitleNoCheckIn')}
        </Text>
      </View>

      <View style={styles.rows}>
        <View>
          <PlanRow
            icon={<Target size={20} color={THEME.colors.calm.lavenderDeep} />}
            iconBg={THEME.colors.calm.lavender}
            title={t('hoy.planPrioritiesTitle')}
            subtitle={prioritiesSubtitle}
            expanded={prioritiesExpanded}
            onPress={() => onTogglePriorities?.()}
            a11y={t('hoy.planPrioritiesA11y', { count: Math.max(stepCount, 0) })}
          />
          {prioritiesExpanded && prioritiesSlot ? (
            <View style={styles.expandSlot}>{prioritiesSlot}</View>
          ) : null}
        </View>

        <View>
          <PlanRow
            icon={<Clock size={20} color={THEME.colors.text.secondary} />}
            iconBg={THEME.colors.calm.mist}
            title={t('hoy.planWaitingTitle')}
            subtitle={waitingSubtitle}
            expanded={waitingExpanded}
            onPress={() => onToggleWaiting?.()}
            a11y={t('hoy.planWaitingA11y', { count: waitingCount })}
          />
          {waitingExpanded ? (
            <View style={styles.expandSlot}>
              {waitingSlot ?? (
                <Text style={styles.waitingEmpty}>{t('hoy.planWaitingSubEmpty')}</Text>
              )}
            </View>
          ) : null}
        </View>
      </View>

      {!allFocusDone ? (
        <HoyGentleRhythmStrip
          crisisMode={crisisMode}
          energyLevel={energyLevel}
          prioritiesDone={prioritiesDone}
          prioritiesTotal={prioritiesTotal}
          allFocusDone={allFocusDone}
        />
      ) : null}
    </CalmCard>
  );
}

function PlanRow({
  icon,
  iconBg,
  title,
  subtitle,
  expanded,
  onPress,
  a11y,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  expanded: boolean;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, expanded && styles.rowExpanded]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ expanded }}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {expanded ? (
        <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
      ) : (
        <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
      )}
    </TouchableOpacity>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
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
  waitingEmpty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
});
