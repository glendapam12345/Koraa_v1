import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import type { TipCategoryId } from '@/lib/tipsTypes';
import { TIP_CATEGORY_META } from '@/lib/tipsPersonalization';

type TipsCategoryCardProps = {
  category: TipCategoryId;
  label: string;
  tipCount: number;
  tipsLabel: string;
  onPress: () => void;
};

export function TipsCategoryCard({
  category,
  label,
  tipCount,
  tipsLabel,
  onPress,
}: TipsCategoryCardProps) {
  const meta = TIP_CATEGORY_META[category];

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${tipCount} ${tipsLabel}`}
    >
      <LinearGradient
        colors={[meta.gradient[0], meta.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {tipCount} {tipsLabel}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    marginBottom: THEME.spacing.sm,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 148,
    justifyContent: 'flex-end',
    ...THEME.shadows.soft,
  },
  emoji: {
    fontSize: 36,
    marginBottom: THEME.spacing.sm,
  },
  label: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.border,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    backgroundColor: THEME.colors.surfaceOverlay.light,
  },
  badgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
  },
});
