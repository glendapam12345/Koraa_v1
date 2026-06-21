import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type TipsMoodPillProps = {
  emoji: string;
  emotionName: string;
  colors: readonly [string, string];
  onPress?: () => void;
};

export function TipsMoodPill({ emoji, emotionName, colors, onPress }: TipsMoodPillProps) {
  const { t } = useI18n();

  const content = (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {emotionName}
      </Text>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={t('tipsExtra.a11yMoodPill', { emotion: emotionName })}
        accessibilityHint={t('tipsExtra.a11yMoodChangeHint')}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
  },
  name: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
});
