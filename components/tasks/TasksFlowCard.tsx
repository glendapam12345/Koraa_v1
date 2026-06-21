import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PenTool, Heart, Target, ArrowRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type TasksFlowCardProps = {
  onDismiss: () => void;
};

export function TasksFlowCard({ onDismiss }: TasksFlowCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('vaciar.flowCardTitle')}</Text>
      <Text style={styles.body}>{t('vaciar.flowCardBody')}</Text>
      <View style={styles.stepsRow}>
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotActive]}>
            <PenTool size={12} color={THEME.colors.onGradient} />
          </View>
          <Text style={styles.stepLabel}>{t('tabs.tasks')}</Text>
        </View>
        <ArrowRight size={14} color={THEME.colors.text.tertiary} />
        <View style={styles.step}>
          <View style={styles.stepDot}>
            <Heart size={12} color={THEME.colors.gradient.blue} />
          </View>
          <Text style={styles.stepLabel}>{t('flow.stepCheckInLabel')}</Text>
        </View>
        <ArrowRight size={14} color={THEME.colors.text.tertiary} />
        <View style={styles.step}>
          <View style={styles.stepDot}>
            <Target size={12} color={THEME.colors.text.secondary} />
          </View>
          <Text style={styles.stepLabel}>{t('tabs.today')}</Text>
        </View>
      </View>
      <Text style={styles.note}>{t('vaciar.flowCardNote')}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismissBtn}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('vaciar.flowCardDismissA11y')}
      >
        <Text style={styles.dismissText}>{t('vaciar.dismiss')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: THEME.spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  stepLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  note: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    lineHeight: 18,
    marginBottom: THEME.spacing.sm,
  },
  dismissBtn: {
    alignSelf: 'flex-start',
  },
  dismissText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
});
