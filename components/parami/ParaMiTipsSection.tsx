import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TipsCategoryGrid } from '@/components/tips/TipsCategoryGrid';
import { openTipsCategory } from '@/lib/tipsNavigation';
import type { TipCategoryId, TipsUserContext } from '@/lib/tipsTypes';
import { getCatalogCountByCategory, getDisplayTipsCountByCategory } from '@/lib/tipsAccess';

const CATEGORY_ORDER: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

type ParaMiTipsSectionProps = {
  context: TipsUserContext;
  /** @deprecated Tip destacado eliminado — se mantiene por compatibilidad de llamadas. */
  highlightTipIds?: string[];
  tipLead?: string;
  fromAi?: boolean;
};

/** Categorías de consejos — ritmo de espacio 8pt consistente. */
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
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t('parami.tipsSectionTitle')}
        </Text>
        <Text style={styles.lead}>{t('parami.tipsSectionLead')}</Text>
        {!isSubscribed ? (
          <Text style={styles.planNote}>{t('parami.tipsFreePlanNote')}</Text>
        ) : null}
      </View>

      <TipsCategoryGrid
        order={CATEGORY_ORDER}
        labels={labels}
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
    gap: THEME.spacing.md,
  },
  header: {
    gap: THEME.spacing.xs,
    alignItems: 'center',
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  lead: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  planNote: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
});
