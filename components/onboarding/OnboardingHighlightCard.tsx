import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';
import { THEME } from '@/constants/theme';

type OnboardingHighlightCardProps = {
  title: string;
  body: string;
};

export function OnboardingHighlightCard({ title, body }: OnboardingHighlightCardProps) {
  const { t } = useI18n();

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('onboardingA11y.highlightCard', { title, body })}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.tinted,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.calm.lavenderDeep,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.calm.lavenderDeep,
    marginBottom: THEME.spacing.sm,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
  },
});
