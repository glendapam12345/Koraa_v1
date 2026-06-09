import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { TranslationKey } from '@/lib/i18n';
import type { TipCategoryId } from '@/lib/tipsTypes';
import {
  getCategoryLead,
  getTipsForCategory,
  type ScoredTip,
} from '@/lib/tipsPersonalization';
import { TipDetailExpanded, TipGridCard } from '@/components/tips/TipGridCard';
import { executeTipAction, getTipActionLabel } from '@/lib/tipActions';
import { openPaywall } from '@/lib/paywallNavigation';
import { trackTipActionTapped, trackTipViewed, trackTipsCategoryOpened } from '@/lib/productAnalytics';

const FREE_TIPS_LIMIT = 3;

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
  const { isSubscribed } = useSubscription();
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

  const allTips = useMemo(
    () => (category ? getTipsForCategory(category, ctx, locale) : []),
    [category, ctx, locale],
  );

  const tips = useMemo(
    () => (isSubscribed ? allTips : allTips.slice(0, FREE_TIPS_LIMIT)),
    [allTips, isSubscribed],
  );

  const [overrideTip, setOverrideTip] = useState<ScoredTip | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryTip = tips[0] ?? null;
  const shownTip = overrideTip ?? primaryTip;

  const gridTips = useMemo(() => {
    if (!shownTip) return tips;
    return tips.filter((tip) => tip.id !== shownTip.id);
  }, [tips, shownTip]);

  useEffect(() => {
    if (category) {
      trackTipsCategoryOpened(category, Boolean(emotion));
    }
  }, [category, emotion]);

  useEffect(() => {
    setOverrideTip(null);
    setMoreOpen(false);
  }, [category, emotion, energy]);

  useEffect(() => {
    if (category && shownTip) {
      trackTipViewed(category, shownTip.id);
    }
  }, [category, shownTip?.id]);

  const renderExpanded = (tip: ScoredTip, eyebrow?: string) => (
    <TipDetailExpanded
      tip={tip}
      eyebrow={eyebrow}
      actionLabel={tip.action ? getTipActionLabel(tip.action, t) : undefined}
      onAction={
        tip.action
          ? () => {
              trackTipActionTapped(tip.action!, category!, tip.id);
              void executeTipAction(tip.action!, t);
            }
          : undefined
      }
    />
  );

  if (!category) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={28} color={THEME.colors.text.main} />
        </TouchableOpacity>
        <Text style={styles.error} accessibilityRole="alert">
          {t('tips.categoryNotFound')}
        </Text>
      </View>
    );
  }

  const lead = getCategoryLead(category, ctx, locale);
  const showMoreToggle = gridTips.length > 0;
  const lockedCount = !isSubscribed ? Math.max(0, allTips.length - FREE_TIPS_LIMIT) : 0;

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
        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
          {t(CATEGORY_KEYS[category])}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>{lead}</Text>
        <Text style={styles.optional}>{t('tips.categoryOptional')}</Text>

        {shownTip ? (
          renderExpanded(
            shownTip,
            overrideTip ? undefined : t('tips.categoryPrimaryEyebrow'),
          )
        ) : null}

        {overrideTip && primaryTip ? (
          <TouchableOpacity
            onPress={() => setOverrideTip(null)}
            style={styles.backToPrimary}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('tips.backToGrid')}
            accessibilityHint={t('tipsExtra.a11yBackToGridHint')}
          >
            <Text style={styles.backToPrimaryText}>{t('tips.backToGrid')}</Text>
          </TouchableOpacity>
        ) : null}

        {showMoreToggle ? (
          <TouchableOpacity
            onPress={() => setMoreOpen((open) => !open)}
            activeOpacity={0.85}
            style={styles.moreToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen }}
            accessibilityLabel={
              moreOpen ? t('tips.categoryMoreHide') : t('tips.categoryMoreToggle', { count: gridTips.length })
            }
          >
            <Text style={styles.moreToggleText}>
              {moreOpen ? t('tips.categoryMoreHide') : t('tips.categoryMoreToggle', { count: gridTips.length })}
            </Text>
            {moreOpen ? (
              <ChevronUp size={18} color={THEME.colors.calm.lavenderDeep} />
            ) : (
              <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
            )}
          </TouchableOpacity>
        ) : null}

        {moreOpen && showMoreToggle ? (
          <View style={styles.grid} accessibilityRole="list">
            {gridTips.map((tip) => (
              <TipGridCard
                key={tip.id}
                tip={tip}
                forYouLabel={t('tips.forYouBadge')}
                onPress={() => {
                  setOverrideTip(tip);
                  setMoreOpen(false);
                }}
              />
            ))}
          </View>
        ) : null}

        {lockedCount > 0 ? (
          <View style={styles.premiumBlock}>
            <Text style={styles.premiumHint}>{t('tips.categoryPremiumHint')}</Text>
            <TouchableOpacity
              onPress={() =>
                openPaywall(router, category ? `/tips/${category}` : undefined)
              }
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('tips.categoryPremiumCta')}
            >
              <Text style={styles.premiumCta}>{t('tips.categoryPremiumCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
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
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    fontFamily: THEME.fonts.accent.italic,
  },
  optional: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.xs,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
  },
  moreToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backToPrimary: {
    alignSelf: 'center',
  },
  backToPrimaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  premiumBlock: {
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
  },
  premiumHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumCta: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  error: {
    ...THEME.typography.body,
    padding: THEME.spacing.lg,
    color: THEME.colors.text.secondary,
  },
});
