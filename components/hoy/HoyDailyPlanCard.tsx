import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { HoyFocusedProjectStrip } from '@/components/hoy/HoyFocusedProjectStrip';
import { HoyPlanExpandableRow } from '@/components/hoy/HoyPlanExpandableRow';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';

type HoyDailyPlanCardProps = {
  stepCount: number;
  waitingCount: number;
  crisisMode: boolean;
  prioritiesDone: number;
  prioritiesTotal: number;
  allFocusDone: boolean;
  hasCheckIn?: boolean;
  planHeadline?: string;
  planFromAi?: boolean;
  focusedProject?: FocusedProjectInfo | null;
  onClearFocusedProject?: () => void;
  prioritiesSlot?: ReactNode;
  waitingExpanded?: boolean;
  onToggleWaiting?: () => void;
  waitingSlot?: ReactNode;
  footerSlot?: ReactNode;
  capacitySummarySlot?: ReactNode;
};

export function HoyDailyPlanCard({
  stepCount,
  waitingCount,
  crisisMode,
  prioritiesDone,
  prioritiesTotal,
  allFocusDone,
  hasCheckIn = false,
  planHeadline = '',
  planFromAi = false,
  focusedProject = null,
  onClearFocusedProject,
  prioritiesSlot,
  waitingExpanded = false,
  onToggleWaiting,
  waitingSlot,
  footerSlot,
  capacitySummarySlot,
}: HoyDailyPlanCardProps) {
  const { t } = useI18n();

  const waitingSubtitle =
    waitingCount > 0
      ? waitingExpanded
        ? t('hoy.planWaitingSubOpen')
        : t('hoy.planWaitingSub', { count: waitingCount })
      : t('hoy.planWaitingSubEmpty');

  const progressLabel =
    prioritiesTotal > 0 && (stepCount > 0 || waitingCount > 0)
      ? t('hoy.planProgressPill', { done: prioritiesDone, total: prioritiesTotal })
      : null;

  return (
    <CalmCard style={styles.card}>
      <LinearGradient
        colors={[...THEME.colors.gradientTint.dayToday]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSoft}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('hoy.planTitle')}</Text>
            {planFromAi ? (
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>{t('koraaDailyTips.planAiBadge')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>
            {planHeadline
              ? planHeadline
              : focusedProject
                ? t('hoy.planSubtitleWithProject', { name: focusedProject.name })
                : crisisMode
                  ? t('hoy.planSubtitleCare')
                  : hasCheckIn
                    ? t('hoy.planSubtitleWithCheckIn')
                    : t('hoy.planSubtitleNoCheckIn')}
          </Text>
          {progressLabel ? (
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{progressLabel}</Text>
            </View>
          ) : null}
          {capacitySummarySlot}
        </View>
      </LinearGradient>

      {focusedProject && onClearFocusedProject ? (
        <HoyFocusedProjectStrip project={focusedProject} onClearFocus={onClearFocusedProject} />
      ) : null}

      <View style={styles.prioritiesBody}>
        {allFocusDone ? (
          <Text style={styles.doneHint}>{t('hoy.planPrioritiesSubAllDone')}</Text>
        ) : null}
        {prioritiesSlot ?? (
          <Text style={styles.emptyHint}>{t('hoy.planPrioritiesSubEmpty')}</Text>
        )}
      </View>

      <View style={styles.waitingSection}>
        <HoyPlanExpandableRow
          variant="muted"
          compact
          icon={<Clock size={18} color={THEME.colors.text.secondary} />}
          title={t('hoy.planWaitingTitle')}
          subtitle={waitingSubtitle}
          expanded={waitingExpanded}
          onToggle={() => onToggleWaiting?.()}
          accessibilityLabel={t('hoy.planWaitingA11y', { count: waitingCount })}
        >
          {waitingSlot ?? (
            <Text style={styles.emptyHint}>{t('hoy.planWaitingSubEmpty')}</Text>
          )}
        </HoyPlanExpandableRow>
      </View>

      {footerSlot ? <View style={styles.footer}>{footerSlot}</View> : null}
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    gap: 0,
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.calm.border,
    borderWidth: 1,
  },
  headerSoft: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  aiPillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  title: {
    ...THEME.typography.sectionTitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  progressPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  progressText: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
  prioritiesBody: {
    gap: 2,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  doneHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  waitingSection: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    marginTop: THEME.spacing.xs,
  },
  footer: {
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  emptyHint: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
