import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import type { HoyAttentionPlan, HoyAttentionReasonKey } from '@/lib/hoyAttentionPlan';

type HoyAttentionCardProps = {
  plan: HoyAttentionPlan;
};

function reasonKeyToI18n(key: HoyAttentionReasonKey): string {
  const map: Record<HoyAttentionReasonKey, string> = {
    deadlineApproaching: 'hoy.attentionReasonDeadline',
    highImpact: 'hoy.attentionReasonImpact',
    lowEnergy: 'hoy.attentionReasonLowEnergy',
    clarity: 'hoy.attentionReasonClarity',
  };
  return map[key];
}

export function HoyAttentionCard({ plan }: HoyAttentionCardProps) {
  const { t } = useI18n();
  const focusTasks = plan.focusTasks.length > 0 ? plan.focusTasks : [plan.focusTask];

  return (
    <CalmCard style={styles.card}>
      <View style={styles.planBadge}>
        <Heart size={14} color={THEME.colors.calm.lavenderDeep} fill={THEME.colors.calm.lavender} />
        <Text style={styles.planBadgeText}>{t('hoy.attentionPlanBadge')}</Text>
      </View>
      <Text style={styles.title}>{t('hoy.attentionTitle')}</Text>

      <LinearGradient
        colors={[THEME.colors.calm.mist, THEME.colors.calm.lavender]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.focusGradient}
      >
        <Text style={styles.projectLine}>
          {plan.projectEmoji} {t('hoy.attentionAdvanceIn', { name: plan.projectName })}
        </Text>
        <Text style={styles.reason}>{t(reasonKeyToI18n(plan.reasonKey))}</Text>

        {focusTasks.map((task) => (
          <View key={task.taskId} style={styles.focusTaskRow}>
            <View style={styles.focusRadio} />
            <View style={styles.focusTaskBody}>
              <Text style={styles.focusTaskText} numberOfLines={2}>
                {task.content}
              </Text>
              <Text style={styles.scope}>
                {t('hoy.attentionMinutes', { minutes: task.minutes })}
              </Text>
            </View>
          </View>
        ))}
      </LinearGradient>

      {plan.otherOptions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hoy.attentionOtherTitle')}</Text>
          <View style={styles.optionGrid}>
            {plan.otherOptions.map((option) => (
              <View key={option.taskId} style={styles.optionCard}>
                <Text style={styles.optionTitle} numberOfLines={2}>
                  {option.content}
                </Text>
                <Text style={styles.optionMinutes}>
                  {t('hoy.attentionMinutes', { minutes: option.minutes })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {plan.parkedTasks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hoy.attentionParkTitle')}</Text>
          <Text style={styles.parkHint}>{t('hoy.attentionParkHint')}</Text>
          {plan.parkedTasks.map((task) => (
            <View key={task.taskId} style={styles.parkRow}>
              <Text style={styles.parkBullet}>📅</Text>
              <View style={styles.parkBody}>
                <Text style={styles.parkTask} numberOfLines={2}>
                  {task.content}
                </Text>
                <Text style={styles.parkMeta}>{t('hoy.attentionParkNoDate')}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : plan.parkedCount > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hoy.attentionParkTitle')}</Text>
          <Text style={styles.parkLine}>
            {t('hoy.attentionParkBody', { count: plan.parkedCount })}
          </Text>
        </View>
      ) : null}

      <Text style={styles.footer}>{t('hoy.attentionFooter')}</Text>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.calm.border,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  planBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 16,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: -4,
  },
  focusGradient: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  projectLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  reason: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  focusTaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  focusRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    marginTop: 2,
  },
  focusTaskBody: {
    flex: 1,
    gap: 2,
  },
  focusTaskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 24,
  },
  scope: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  section: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  sectionTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
  },
  parkHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  optionGrid: {
    gap: THEME.spacing.xs,
  },
  optionCard: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 4,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  optionTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    lineHeight: 20,
    fontFamily: THEME.fonts.heading.medium,
  },
  optionMinutes: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  parkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  parkBullet: {
    ...THEME.typography.caption,
    lineHeight: 20,
  },
  parkBody: {
    flex: 1,
    gap: 2,
  },
  parkTask: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  parkMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  parkLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    paddingTop: THEME.spacing.xs,
    textAlign: 'center',
  },
});
