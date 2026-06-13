import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TipsCategoryGrid } from '@/components/tips/TipsCategoryGrid';
import type { TipCategoryId, TipsUserContext } from '@/lib/tipsTypes';
import { getCatalogCountByCategory, getDisplayTipsCountByCategory } from '@/lib/tipsAccess';
import { openTipsCategory } from '@/lib/tipsNavigation';

const CATEGORY_ORDER: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

type ParaMiTipsSectionProps = {
  context: TipsUserContext;
};

export function ParaMiTipsSection({ context }: ParaMiTipsSectionProps) {
  const { t, locale } = useI18n();
  const { isSubscribed } = useSubscription();

  const catalogTotals = useMemo(() => getCatalogCountByCategory(locale), [locale]);

  const counts = useMemo(
    () => getDisplayTipsCountByCategory(locale, isSubscribed),
    [locale, isSubscribed],
  );

  const labels = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_ORDER.map((id) => [id, t(`tips.categories.${id}` as 'tips.categories.rest')]),
      ) as Record<TipCategoryId, string>,
    [t],
  );

  const subtitles = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_ORDER.map((id) => [
          id,
          t(`tips.categorySubtitles.${id}` as 'tips.categorySubtitles.rest'),
        ]),
      ) as Record<TipCategoryId, string>,
    [t],
  );

  const countBadges = useMemo(() => {
    if (isSubscribed) return undefined;
    return Object.fromEntries(
      CATEGORY_ORDER.map((id) => [
        id,
        t('parami.tipsCountFreeBadge', {
          visible: counts[id],
          total: catalogTotals[id],
        }),
      ]),
    ) as Record<TipCategoryId, string>;
  }, [catalogTotals, counts, isSubscribed, t]);

  const openCategory = (category: TipCategoryId) => {
    openTipsCategory(router, category, context);
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('parami.tipsSectionA11y')}
    >
      <Text style={styles.title} accessibilityRole="header">
        {t('parami.tipsSectionTitle')}
      </Text>
      <Text style={styles.lead}>{t('parami.tipsSectionLead')}</Text>
      <TipsCategoryGrid
        order={CATEGORY_ORDER}
        labels={labels}
        subtitles={subtitles}
        counts={counts}
        countBadges={countBadges}
        tipsLabel={t('parami.tipsCountLabel')}
        onPressCategory={openCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.fill[200],
  },
  title: {
    ...THEME.typography.sectionTitle,
    fontSize: 17,
    lineHeight: 22,
    color: THEME.colors.text.main,
  },
  lead: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
