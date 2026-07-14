import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

/**
 * Sección de apoyo del Design System: el plan corto de hoy.
 * Un título, un subtítulo corto, pasos (máx. 3), y "puede esperar" solo si aplica.
 */
export function HoyDailyPlanCard({
  waitingCount,
  crisisMode,
  allFocusDone,
  hasCheckIn = false,
  planHeadline = '',
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

  const waitingSubtitle = waitingExpanded
    ? t('hoy.planWaitingSubOpen')
    : t('hoy.planWaitingSub', { count: waitingCount });

  const subtitle = planHeadline
    ? planHeadline
    : focusedProject
      ? t('hoy.planSubtitleWithProject', { name: focusedProject.name })
      : crisisMode
        ? t('hoy.planSubtitleCare')
        : hasCheckIn
          ? t('hoy.planSubtitleWithCheckIn')
          : t('hoy.planSubtitleNoCheckIn');

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('hoy.planTitle')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {capacitySummarySlot}
      </View>

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

      {waitingCount > 0 ? (
        <View style={styles.waitingSection}>
          <HoyPlanExpandableRow
            variant="muted"
            compact
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
      ) : null}

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
  header: {
    gap: 8,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.sectionTitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  prioritiesBody: {
    gap: 4,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
  doneHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: THEME.spacing.xs,
  },
  waitingSection: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  footer: {
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    paddingTop: THEME.spacing.xs,
  },
  emptyHint: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 22,
    paddingVertical: THEME.spacing.md,
  },
});
