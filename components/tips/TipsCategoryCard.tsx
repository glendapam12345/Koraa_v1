import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TipCategoryId } from '@/lib/tipsTypes';
import { TIP_CATEGORY_META } from '@/lib/tipsPersonalization';

type TipsCategoryCardProps = {
  category: TipCategoryId;
  label: string;
  subtitle?: string;
  tipCount: number;
  tipsLabel: string;
  countBadge?: string;
  onPress: () => void;
};

export function TipsCategoryCard({
  category,
  label,
  subtitle,
  tipCount,
  tipsLabel,
  countBadge,
  onPress,
}: TipsCategoryCardProps) {
  const { t } = useI18n();
  const meta = TIP_CATEGORY_META[category];

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('tips.openCategoryA11y', { category: label })}
      accessibilityHint={t('tipsExtra.a11yCategoryHint')}
    >
      <LinearGradient
        colors={[meta.gradient[0], meta.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <View style={styles.labelBlock}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {countBadge ?? `${tipCount} ${tipsLabel}`}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const CARD_HEIGHT = 152;

const styles = StyleSheet.create({
  wrap: {
    height: CARD_HEIGHT,
    marginBottom: 0,
  },
  card: {
    flex: 1,
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    justifyContent: 'space-between',
    minHeight: CARD_HEIGHT,
    ...THEME.shadows.card,
  },
  emoji: {
    fontSize: 32,
  },
  labelBlock: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: THEME.spacing.xs,
    gap: 2,
  },
  label: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
  },
  subtitle: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.9,
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
