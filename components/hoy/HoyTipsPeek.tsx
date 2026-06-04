import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Lightbulb, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TipCategoryId } from '@/lib/tipsTypes';
import {
  countTipsByCategory,
  getPersonalizedTips,
  TIP_CATEGORY_META,
} from '@/lib/tipsPersonalization';

type HoyTipsPeekProps = {
  emotion: string;
  energyLevel?: number;
};

const PEEK_CATEGORIES: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

const CATEGORY_LABEL_KEYS = {
  mindset: 'tips.categories.mindset',
  rest: 'tips.categories.rest',
  action: 'tips.categories.action',
  productivity: 'tips.categories.productivity',
} as const;

export function HoyTipsPeek({ emotion, energyLevel = 3 }: HoyTipsPeekProps) {
  const { t, locale } = useI18n();
  const ctx = { emotion, energyLevel };
  const counts = countTipsByCategory(ctx, locale);
  const topTip = getPersonalizedTips(ctx, locale)[0];

  const openCategory = (category: TipCategoryId) => {
    router.push({
      pathname: '/tips/[category]',
      params: {
        category,
        emotion,
        energy: String(energyLevel),
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Lightbulb size={20} color={THEME.colors.gradient.blue} />
        <Text style={styles.title}>{t('hoy.inicio.tipsPeekTitle')}</Text>
      </View>
      {topTip ? (
        <TouchableOpacity
          style={styles.featured}
          onPress={() => openCategory(topTip.category)}
          activeOpacity={0.88}
        >
          <Text style={styles.featuredEmoji}>{topTip.emoji}</Text>
          <View style={styles.featuredText}>
            <Text style={styles.featuredLabel}>{t('hoy.inicio.tipForYou')}</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {topTip.title}
            </Text>
          </View>
          <ChevronRight size={20} color={THEME.colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PEEK_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.chip}
            onPress={() => openCategory(cat)}
            activeOpacity={0.85}
          >
            <Text style={styles.chipEmoji}>{TIP_CATEGORY_META[cat].emoji}</Text>
            <Text style={styles.chipLabel}>{t(CATEGORY_LABEL_KEYS[cat])}</Text>
            <Text style={styles.chipCount}>{counts[cat]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/tips')}
        style={styles.allBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.allBtnText}>{t('hoy.inicio.tipsPeekCta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  featuredEmoji: {
    fontSize: 28,
  },
  featuredText: {
    flex: 1,
  },
  featuredLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
  },
  featuredTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  chips: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  chipCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  allBtn: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'center',
  },
  allBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
