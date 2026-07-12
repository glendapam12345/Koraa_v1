import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type EmotionCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function EmotionCard({ emoji, label, selected, onPress }: EmotionCardProps) {
  const { t } = useI18n();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, selected && styles.selected]}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={
        selected ? t('emotionCard.a11ySelected', { label }) : t('emotionCard.a11yOption', { label })
      }
      accessibilityHint={selected ? t('emotionCard.a11ySelectedHint') : t('emotionCard.a11yHint')}
      accessibilityState={{ selected }}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    flex: 1,
    margin: 4,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  selected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  emoji: {
    fontSize: 40,
    marginBottom: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  labelSelected: {
    fontFamily: THEME.fonts.heading.medium,
  },
});
