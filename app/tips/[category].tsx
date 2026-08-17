import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { applyTipHighlights } from '@/lib/ai/applyTipHighlights';
import { useAuth } from '@/contexts/AuthContext';
import { useKoraaTipHighlights } from '@/hooks/useKoraaTipHighlights';
import { TipDetailExpanded } from '@/components/tips/TipGridCard';
import { QuickBreathModal } from '@/components/hoy/QuickBreathModal';
import { executeTipAction, getTipActionLabel } from '@/lib/tipActions';
import { openPaywall } from '@/lib/paywallNavigation';
import { tipsGoBack } from '@/lib/tipsNavigation';
import { trackTipActionTapped, trackTipViewed, trackTipsCategoryOpened } from '@/lib/productAnalytics';
import {
  FREE_TIPS_LIMIT,
  getCatalogCountByCategory,
  getLockedTipsInCategory,
} from '@/lib/tipsAccess';

const CATEGORY_KEYS: Record<TipCategoryId, TranslationKey> = {
  mindset: 'tips.categories.mindset',
  rest: 'tips.categories.rest',
  action: 'tips.categories.action',
  productivity: 'tips.categories.productivity',
};

const CATEGORY_SUBTITLE_KEYS: Record<TipCategoryId, TranslationKey> = {
  mindset: 'tips.categorySubtitles.mindset',
  rest: 'tips.categorySubtitles.rest',
  action: 'tips.categorySubtitles.action',
  productivity: 'tips.categorySubtitles.productivity',
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
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [breathOpen, setBreathOpen] = useState(false);
  const { category: catParam, emotion, energy, focusTipId: focusTipParam } = useLocalSearchParams<{
    category?: string;
    emotion?: string;
    energy?: string;
    focusTipId?: string;
  }>();

  const category = parseCategory(catParam);
  const focusTipId = useMemo(() => {
    const raw = Array.isArray(focusTipParam) ? focusTipParam[0] : focusTipParam;
    const id = raw?.trim();
    return id || null;
  }, [focusTipParam]);
  const ctx = useMemo(
    () => ({
      emotion: (emotion ?? 'tranquila').toLowerCase(),
      energyLevel: Math.min(5, Math.max(1, parseInt(energy ?? '3', 10) || 3)),
    }),
    [emotion, energy],
  );

  const { tipIds: highlightTipIds, tipLead: aiTipLead } = useKoraaTipHighlights({
    userId: user?.id,
    emotion: ctx.emotion,
    energyLevel: ctx.energyLevel,
    locale,
  });

  const categoryHighlightIds = useMemo(() => {
    if (!category) return [];
    const base = getTipsForCategory(category, ctx, locale);
    return highlightTipIds.filter((id) => base.some((tip) => tip.id === id));
  }, [category, ctx, locale, highlightTipIds]);

  const allTips = useMemo(() => {
    if (!category) return [];
    const base = getTipsForCategory(category, ctx, locale);
    return applyTipHighlights(base, categoryHighlightIds);
  }, [category, ctx, locale, categoryHighlightIds]);

  const tips = useMemo(
    () => (isSubscribed ? allTips : allTips.slice(0, FREE_TIPS_LIMIT)),
    [allTips, isSubscribed],
  );

  /** Orden: tip enfocado primero (si viene de Hoy), luego el resto — todos mismo peso visual. */
  const orderedTips = useMemo(() => {
    if (!focusTipId) return tips;
    const focused = tips.find((tip) => tip.id === focusTipId);
    if (!focused) return tips;
    return [focused, ...tips.filter((tip) => tip.id !== focusTipId)];
  }, [tips, focusTipId]);

  useEffect(() => {
    if (category) {
      trackTipsCategoryOpened(category, Boolean(emotion));
    }
  }, [category, emotion]);

  useEffect(() => {
    if (category && orderedTips[0]) {
      trackTipViewed(category, orderedTips[0].id);
    }
  }, [category, orderedTips]);

  const renderTip = (tip: ScoredTip, index: number) => (
    <TipDetailExpanded
      key={tip.id}
      tip={tip}
      eyebrow={index === 0 ? t('tips.categoryPrimaryEyebrow') : undefined}
      actionLabel={tip.action ? getTipActionLabel(tip.action, t) : undefined}
      onAction={
        tip.action
          ? () => {
              trackTipActionTapped(tip.action!, category!, tip.id);
              if (tip.action === 'breath') {
                setBreathOpen(true);
                return;
              }
              void executeTipAction(tip.action!, t);
            }
          : undefined
      }
      optionalAppLabel={
        tip.optionalApp ? getTipActionLabel(tip.optionalApp, t) : undefined
      }
      onOptionalApp={
        tip.optionalApp
          ? () => {
              trackTipActionTapped(tip.optionalApp!, category!, tip.id);
              void executeTipAction(tip.optionalApp!, t);
            }
          : undefined
      }
    />
  );

  if (!category) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[...THEME.colors.calm.screenWash]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity
          onPress={() => tipsGoBack(router)}
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

  const lead =
    categoryHighlightIds.length > 0 && aiTipLead
      ? aiTipLead
      : getCategoryLead(category, ctx, locale);
  const catalogTotal = getCatalogCountByCategory(locale)[category];
  const lockedCount = getLockedTipsInCategory(category, locale, isSubscribed);
  const visibleCount = isSubscribed ? catalogTotal : Math.min(catalogTotal, FREE_TIPS_LIMIT);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[...THEME.colors.calm.screenWash]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => tipsGoBack(router)}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={28} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
            {t(CATEGORY_KEYS[category])}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t(CATEGORY_SUBTITLE_KEYS[category])}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + THEME.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>{lead}</Text>
        <Text style={styles.optional}>{t('tips.categoryOptional')}</Text>

        <View style={styles.list} accessibilityRole="list">
          {orderedTips.map((tip, index) => renderTip(tip, index))}
        </View>

        {lockedCount > 0 ? (
          <View style={styles.premiumBlock}>
            <Text style={styles.premiumHint}>
              {t('tips.categoryPremiumHint', { count: lockedCount })}
            </Text>
            {!isSubscribed ? (
              <Text style={styles.visibleCount}>
                {t('tips.categoryVisibleCount', { visible: visibleCount, total: catalogTotal })}
              </Text>
            ) : null}
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
      <QuickBreathModal
        visible={breathOpen}
        onClose={() => setBreathOpen(false)}
        onComplete={() => setBreathOpen(false)}
      />
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
  },
  backBtn: {
    padding: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    ...THEME.typography.h2,
    textAlign: 'center',
    color: THEME.colors.text.main,
  },
  headerSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
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
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  list: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  visibleCount: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumBlock: {
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
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
    fontFamily: THEME.fonts.heading.medium,
  },
  error: {
    ...THEME.typography.body,
    padding: THEME.spacing.lg,
    color: THEME.colors.text.secondary,
  },
});
