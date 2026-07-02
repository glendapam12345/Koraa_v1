import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TipsCategoryGrid } from '@/components/tips/TipsCategoryGrid';
import { KoraaDailyTipsSection } from '@/components/koraa/KoraaDailyTipsSection';
import { resolveTipsByIds } from '@/lib/ai/resolveBriefTips';
import { openTipsCategory } from '@/lib/tipsNavigation';
import type { TipCategoryId, TipsUserContext } from '@/lib/tipsTypes';
import { getCatalogCountByCategory, getDisplayTipsCountByCategory } from '@/lib/tipsAccess';
import type { ScoredTip } from '@/lib/tipsPersonalization';

const CATEGORY_ORDER: TipCategoryId[] = ['mindset', 'rest', 'action', 'productivity'];

type ParaMiTipsSectionProps = {
  context: TipsUserContext;
  highlightTipIds?: string[];
  tipLead?: string;
  fromAi?: boolean;
};

export function ParaMiTipsSection({
  context,
  highlightTipIds = [],
  tipLead = '',
  fromAi = false,
}: ParaMiTipsSectionProps) {
  const { t, locale } = useI18n();
  const { isSubscribed } = useSubscription();

  const highlightedTips = useMemo(
    () => resolveTipsByIds(highlightTipIds, locale),
    [highlightTipIds, locale],
  );

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

  const openTip = (tip: ScoredTip) => {
    openTipsCategory(router, tip.category, context, tip.id);
  };

  const sectionLead = tipLead || t('parami.tipsSectionLead');

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('parami.tipsSectionA11y')}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          {t('parami.tipsSectionTitle')}
        </Text>
        {fromAi && highlightedTips.length > 0 ? (
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>{t('koraaDailyTips.aiBadge')}</Text>
          </View>
        ) : null}
      </View>
      {highlightedTips.length > 0 ? (
        <KoraaDailyTipsSection
          tips={highlightedTips}
          tipLead={tipLead || undefined}
          fromAi={fromAi}
          embedded
          hideHeader
          hideForYouBadge
          onOpenTip={openTip}
        />
      ) : (
        <Text style={styles.lead}>{sectionLead}</Text>
      )}
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
    borderTopColor: THEME.colors.calm.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  aiPillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  lead: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
