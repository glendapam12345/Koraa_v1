import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lightbulb } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import type { PlanRealismResult } from '@/lib/vnext/types';

type PlanUpdatedSuccessScreenProps = {
  realism: PlanRealismResult;
  onViewDay: () => void;
};

export function PlanUpdatedSuccessScreen({
  realism,
  onViewDay,
}: PlanUpdatedSuccessScreenProps) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={[THEME.colors.calm.background, THEME.colors.calm.card]}
      style={styles.shell}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.confetti}>🎉</Text>
      </View>
      <Text style={styles.title}>{t('vnext.planUpdatedTitle')}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('vnext.planUpdatedSummary')}</Text>
        <Text style={styles.summaryLine}>
          {t('vnext.planUpdatedEssential', { count: realism.todayTaskCount })}
        </Text>
        {realism.postponedCount > 0 ? (
          <Text style={styles.summaryLine}>
            {t('vnext.planUpdatedLater', { count: realism.postponedCount })}
          </Text>
        ) : null}
      </View>

      <View style={styles.reminder}>
        <Lightbulb size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.reminderText}>{t('vnext.realityReminder')}</Text>
      </View>

      <CalmPrimaryButton label={t('vnext.planUpdatedCta')} onPress={onViewDay} large />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.soft,
  },
  confetti: {
    fontSize: 36,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: 8,
    borderRadius: THEME.borderRadius.rounded,
  },
  summaryTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  summaryLine: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    width: '100%',
  },
  reminderText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
