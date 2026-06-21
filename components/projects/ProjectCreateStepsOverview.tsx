import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

/** Barra fija: nombre · fecha · color — visible aunque hagas scroll en el modal. */
export function ProjectCreateStepsOverview() {
  const { t } = useI18n();
  const steps = [
    { n: '1', label: t('projectSelectorExtra.nameLabel') },
    { n: '2', label: t('projects.dueDateStepShort') },
    { n: '3', label: t('projectSelectorExtra.colorLabel') },
  ];

  return (
    <View style={styles.rail}>
      {steps.map((step) => (
        <View key={step.n} style={styles.item}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>{step.n}</Text>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    flexShrink: 1,
  },
});
