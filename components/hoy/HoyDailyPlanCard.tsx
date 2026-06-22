import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Star } from 'lucide-react-native';
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
  focusedProject?: FocusedProjectInfo | null;
  onClearFocusedProject?: () => void;
  prioritiesSlot?: ReactNode;
  prioritiesExpanded?: boolean;
  onTogglePriorities?: () => void;
  waitingExpanded?: boolean;
  onToggleWaiting?: () => void;
  waitingSlot?: ReactNode;
  footerSlot?: ReactNode;
};

export function HoyDailyPlanCard({
  stepCount,
  waitingCount,
  crisisMode,
  prioritiesDone,
  prioritiesTotal,
  allFocusDone,
  hasCheckIn = false,
  focusedProject = null,
  onClearFocusedProject,
  prioritiesSlot,
  prioritiesExpanded = false,
  onTogglePriorities,
  waitingExpanded = false,
  onToggleWaiting,
  waitingSlot,
  footerSlot,
}: HoyDailyPlanCardProps) {
  const { t } = useI18n();

  const prioritiesSubtitle = allFocusDone
    ? t('hoy.planPrioritiesSubAllDone')
    : stepCount > 0
      ? prioritiesExpanded
        ? t('hoy.planPrioritiesSubOpen')
        : t('hoy.planPrioritiesMany', { count: stepCount })
      : t('hoy.planPrioritiesSubEmpty');

  const waitingSubtitle =
    waitingCount > 0
      ? waitingExpanded
        ? t('hoy.planWaitingSubOpen')
        : t('hoy.planWaitingSub', { count: waitingCount })
      : t('hoy.planWaitingSubEmpty');

  const progressLabel =
    prioritiesTotal > 0
      ? t('hoy.planProgressPill', { done: prioritiesDone, total: prioritiesTotal })
      : null;

  return (
    <CalmCard style={styles.card}>
      <View style={styles.headerSoft}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('hoy.planTitle')}</Text>
          <Text style={styles.subtitle}>
            {focusedProject
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
        </View>
      </View>

      {focusedProject && onClearFocusedProject ? (
        <HoyFocusedProjectStrip project={focusedProject} onClearFocus={onClearFocusedProject} />
      ) : null}

      <View style={styles.sections}>
        <HoyPlanExpandableRow
          variant="accent"
          compact
          icon={<Star size={18} color={THEME.colors.calm.lavenderDeep} />}
          title={t('hoy.planPrioritiesTitle')}
          subtitle={prioritiesSubtitle}
          expanded={prioritiesExpanded}
          onToggle={() => onTogglePriorities?.()}
          accessibilityLabel={t('hoy.planPrioritiesA11y', { count: stepCount })}
        >
          {prioritiesSlot ?? (
            <Text style={styles.emptyHint}>{t('hoy.planPrioritiesSubEmpty')}</Text>
          )}
          {stepCount > 0 ? (
            <Text style={styles.editHint}>{t('hoy.planEditHint')}</Text>
          ) : null}
        </HoyPlanExpandableRow>

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
          {waitingCount > 0 ? (
            <Text style={styles.editHint}>{t('hoy.planEditHint')}</Text>
          ) : null}
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
    borderColor: THEME.colors.calm.lavender,
    borderWidth: 1,
  },
  headerSoft: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.blush,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  header: {
    gap: 6,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.accent.italic,
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
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 14,
  },
  sections: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
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
  editHint: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
    marginTop: 2,
  },
});
