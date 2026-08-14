import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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

const CARD_HEIGHT = 176;
const LABEL_SLOT_HEIGHT = 40;

/**
 * Tarjeta de categoría — pastel tenue + mood Ellie (como el búho de Duolingo).
 */
export function TipsCategoryCard({
  category,
  label,
  tipCount,
  tipsLabel,
  countBadge,
  onPress,
}: TipsCategoryCardProps) {
  const { t } = useI18n();
  const meta = TIP_CATEGORY_META[category];
  const countText = countBadge ?? `${tipCount} ${tipsLabel}`;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={t('tips.openCategoryA11y', { category: label })}
      accessibilityHint={t('tipsExtra.a11yCategoryHint')}
    >
      <LinearGradient
        colors={[...meta.gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.card}
      >
        <View style={styles.illustration} accessibilityElementsHidden>
          <Image source={meta.moodImage} style={styles.mood} resizeMode="contain" />
        </View>
        <View style={styles.labelSlot}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{countText}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: THEME.borderRadius.xl,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  illustration: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mood: {
    width: 68,
    height: 68,
  },
  labelSlot: {
    height: LABEL_SLOT_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  badge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 28,
    justifyContent: 'center',
  },
  badgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
