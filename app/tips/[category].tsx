import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import type { TipCategoryId } from '@/lib/tipsTypes';
import {
  getCategoryLead,
  getTipsForCategory,
  type ScoredTip,
} from '@/lib/tipsPersonalization';
import { TipDetailExpanded, TipGridCard } from '@/components/tips/TipGridCard';

const CATEGORY_KEYS: Record<TipCategoryId, TranslationKey> = {
  mindset: 'tips.categories.mindset',
  rest: 'tips.categories.rest',
  action: 'tips.categories.action',
  productivity: 'tips.categories.productivity',
};

const VALID: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

function parseCategory(raw: string | string[] | undefined): TipCategoryId | null {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (id && VALID.includes(id as TipCategoryId)) return id as TipCategoryId;
  return null;
}

export default function TipsCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { category: catParam, emotion, energy } = useLocalSearchParams<{
    category?: string;
    emotion?: string;
    energy?: string;
  }>();

  const category = parseCategory(catParam);
  const ctx = useMemo(
    () => ({
      emotion: (emotion ?? 'tranquila').toLowerCase(),
      energyLevel: Math.min(5, Math.max(1, parseInt(energy ?? '3', 10) || 3)),
    }),
    [emotion, energy],
  );

  const tips = useMemo(
    () => (category ? getTipsForCategory(category, ctx, locale) : []),
    [category, ctx, locale],
  );

  const [selected, setSelected] = useState<ScoredTip | null>(null);

  if (!category) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.error}>{t('tips.categoryNotFound')}</Text>
      </View>
    );
  }

  const lead = getCategoryLead(category, ctx, locale);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={28} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t(CATEGORY_KEYS[category])}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>{lead}</Text>

        {selected ? (
          <>
            <TipDetailExpanded tip={selected} />
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.backToGrid}
              activeOpacity={0.8}
            >
              <Text style={styles.backToGridText}>{t('tips.backToGrid')}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.grid}>
          {tips.map((tip) => (
            <TipGridCard
              key={tip.id}
              tip={tip}
              forYouLabel={t('tips.forYouBadge')}
              onPress={() => setSelected(tip)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  backBtn: {
    padding: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    ...THEME.typography.h2,
    flex: 1,
    textAlign: 'center',
    color: THEME.colors.text.main,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
    fontFamily: THEME.fonts.accent.italic,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backToGrid: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.md,
  },
  backToGridText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  error: {
    ...THEME.typography.body,
    padding: THEME.spacing.lg,
    color: THEME.colors.text.secondary,
  },
});
