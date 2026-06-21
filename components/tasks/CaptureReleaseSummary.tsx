import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FolderOpen, ListChecks, CalendarDays } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureFrontsResult, FrontHintKey } from '@/lib/captureProjectFronts';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type CaptureReleaseSummaryProps = {
  fronts: CaptureFrontsResult;
  creatingFrontKey: string | null;
  onCreateProject: (frontKey: string, projectName: string) => void;
  onGoToHoy?: () => void;
  onDismiss: () => void;
};

function hintI18nKey(key: FrontHintKey): string {
  const map: Record<FrontHintKey, string> = {
    highPriority: 'vaciar.frontsHintHighPriority',
    hasDeadline: 'vaciar.frontsHintHasDeadline',
    important: 'vaciar.frontsHintImportant',
    noDeadline: 'vaciar.frontsHintNoDeadline',
    personalLife: 'vaciar.frontsHintPersonalLife',
    empty: 'vaciar.frontsHintEmpty',
  };
  return map[key];
}

function hintStyle(key: FrontHintKey) {
  if (key === 'highPriority') return styles.hintHighPriority;
  if (key === 'important') return styles.hintImportant;
  if (key === 'personalLife') return styles.hintPersonal;
  return styles.hintNeutral;
}

export function CaptureReleaseSummary({
  fronts,
  creatingFrontKey,
  onCreateProject,
  onGoToHoy,
  onDismiss,
}: CaptureReleaseSummaryProps) {
  const { t } = useI18n();
  if (fronts.taskCount === 0) return null;

  const { quickSummary } = fronts;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.mascotCard}>
        <Text style={styles.mascotEmoji}>💜</Text>
        <Text style={styles.mascotText}>{t('vaciar.frontsMascotRelief')}</Text>
      </View>

      <Text style={styles.organizedTitle}>{t('vaciar.frontsOrganizedTitle')}</Text>

      <View style={styles.statRow}>
        <View style={styles.statChip}>
          <FolderOpen size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.statValue}>{quickSummary.projectCount}</Text>
          <Text style={styles.statLabel}>{t('vaciar.frontsStatProjects')}</Text>
        </View>
        <View style={styles.statChip}>
          <ListChecks size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.statValue}>{quickSummary.taskCount}</Text>
          <Text style={styles.statLabel}>{t('vaciar.frontsStatTasks')}</Text>
        </View>
        {quickSummary.importantDatesCount > 0 ? (
          <View style={styles.statChip}>
            <CalendarDays size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.statValue}>{quickSummary.importantDatesCount}</Text>
            <Text style={styles.statLabel}>{t('vaciar.frontsStatDates')}</Text>
          </View>
        ) : null}
      </View>

      {fronts.fronts.map((front) => (
        <View key={front.key} style={styles.frontCard}>
          <Text style={styles.frontEmoji}>{front.emoji}</Text>
          <View style={styles.frontBody}>
            <View style={styles.frontHeader}>
              <Text style={styles.frontTitle} numberOfLines={1}>
                {front.name}
              </Text>
              <Text style={styles.frontMeta}>
                {front.tasks.length === 0
                  ? t('vaciar.frontsNoTasksYet')
                  : t('vaciar.frontsTaskCount', { count: front.tasks.length })}
              </Text>
            </View>

            {front.hints.length > 0 ? (
              <View style={styles.hintRow}>
                {front.hints.map((hint) => (
                  <View key={hint} style={[styles.hintChip, hintStyle(hint)]}>
                    <Text style={styles.hintText}>{t(hintI18nKey(hint))}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {front.suggestedNewProject ? (
              <View style={styles.createProjectWrap}>
                {creatingFrontKey === front.key ? (
                  <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
                ) : (
                  <CalmPrimaryButton
                    label={t('vaciar.frontsCreateProject')}
                    onPress={() => onCreateProject(front.key, front.name)}
                    variant="soft"
                    style={styles.createProjectBtn}
                  />
                )}
              </View>
            ) : null}
          </View>
        </View>
      ))}

      <View style={styles.recommendation}>
        <Text style={styles.recommendationTitle}>{t('vaciar.frontsTodayRecommendation')}</Text>
        <Text style={styles.recommendationBody}>{t('vaciar.frontsTodayRecommendationBody')}</Text>
        {onGoToHoy ? (
          <CalmPrimaryButton
            label={t('vaciar.frontsSeeTodayPlan')}
            onPress={onGoToHoy}
            variant="default"
            style={styles.todayPlanBtn}
          />
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onDismiss}
        style={styles.reviewLink}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('vaciar.frontsReviewA11y')}
      >
        <Text style={styles.reviewText}>
          {t('vaciar.frontsReviewPrompt')}{' '}
          <Text style={styles.reviewLinkAccent}>{t('vaciar.frontsReviewAction')}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.lavender,
  },
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  mascotEmoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 32,
  },
  mascotText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
  organizedTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 28,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    alignItems: 'center',
    gap: 2,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: 6,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  statValue: {
    ...THEME.typography.h3,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 28,
  },
  statLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
    textAlign: 'center',
  },
  frontCard: {
    ...THEME.surfaces.panel,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  frontEmoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 32,
    width: 36,
    textAlign: 'center',
  },
  frontBody: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  frontHeader: {
    gap: 2,
  },
  frontTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  frontMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hintChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  hintNeutral: {
    backgroundColor: THEME.colors.calm.mist,
  },
  hintHighPriority: {
    backgroundColor: THEME.colors.tint.pink.soft,
  },
  hintImportant: {
    backgroundColor: THEME.colors.calm.mist,
  },
  hintPersonal: {
    backgroundColor: THEME.colors.emotionTint.agotada,
  },
  hintText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  createProjectWrap: {
    marginTop: 2,
  },
  createProjectBtn: {
    alignSelf: 'stretch',
  },
  recommendation: {
    gap: 6,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  recommendationTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  recommendationBody: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  todayPlanBtn: {
    alignSelf: 'stretch',
    marginTop: THEME.spacing.xs,
  },
  reviewLink: {
    alignSelf: 'stretch',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  reviewText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewLinkAccent: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
