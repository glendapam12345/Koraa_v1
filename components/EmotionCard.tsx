import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type EmotionCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional soft tint key from THEME.colors.emotionTint */
  tintKey?: keyof typeof THEME.colors.emotionTint;
};

/** Un tap — círculo visual (inspiración Musa), estados de capacidad, no síntomas. */
export function EmotionCard({ emoji, label, selected, onPress, tintKey }: EmotionCardProps) {
  const { t } = useI18n();
  const tint =
    tintKey && THEME.colors.emotionTint[tintKey]
      ? THEME.colors.emotionTint[tintKey]
      : THEME.colors.emotionTint.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={
        selected ? t('emotionCard.a11ySelected', { label }) : t('emotionCard.a11yOption', { label })
      }
      accessibilityHint={selected ? t('emotionCard.a11ySelectedHint') : t('emotionCard.a11yHint')}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: tint },
          selected && styles.circleSelected,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    marginHorizontal: 2,
    marginBottom: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    minHeight: 118,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  circleSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 2.5,
    ...THEME.shadows.lavenderGlow,
    transform: [{ scale: 1.06 }],
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  labelSelected: {
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
});
