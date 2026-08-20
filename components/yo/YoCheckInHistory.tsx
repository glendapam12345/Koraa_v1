import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getEmotionEmoji } from '@/lib/emotionalInsights';
import { goToCheckIn } from '@/lib/checkInNavigation';
import { openPaywall } from '@/lib/paywallNavigation';

import type { TranslationKey } from '@/lib/i18n';

export type YoHistoryEntry = {
  date: string;
  dateLabel: string;
  emotion: string;
  energyLevel: number;
};

type YoCheckInHistoryProps = {
  entries: YoHistoryEntry[];
  isSubscribed: boolean;
  freeVisibleCount?: number;
  titleKey?: TranslationKey;
  /** Ruta a la que volver tras cerrar paywall (p. ej. Para mí). */
  paywallReturnTo?: string;
};

export function YoCheckInHistory({
  entries,
  isSubscribed,
  freeVisibleCount = 7,
  titleKey = 'yo.historyTitle',
  paywallReturnTo,
}: YoCheckInHistoryProps) {
  const { t } = useI18n();
  const visible = isSubscribed ? entries : entries.slice(0, freeVisibleCount);
  const hasMore = !isSubscribed && entries.length > freeVisibleCount;

  if (entries.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>{t('yo.historyEmpty')}</Text>
        <TouchableOpacity
          onPress={() => goToCheckIn()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('yo.historyGoCheckIn')}
        >
          <Text style={styles.emptyCta}>{t('yo.historyGoCheckIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>{t(titleKey)}</Text>
        {!isSubscribed ? (
          <Text style={styles.limitHint}>
            {t('yo.historyFreeLimit', { days: freeVisibleCount })}
          </Text>
        ) : null}
      </View>
      {visible.map((entry) => (
        <View key={entry.date} style={styles.row}>
          <Text style={styles.dateLabel}>{entry.dateLabel}</Text>
          <View style={styles.emotionWrap}>
            <Text style={styles.emoji}>{getEmotionEmoji(entry.emotion)}</Text>
            <Text style={styles.emotionLabel} numberOfLines={1}>
              {t(`sentir.emotions.${entry.emotion.toLowerCase()}` as 'sentir.emotions.tranquila')}
            </Text>
          </View>
          <View style={styles.energyBadge}>
            <Text style={styles.energyText}>{entry.energyLevel}/5</Text>
          </View>
        </View>
      ))}
      {hasMore ? (
        <TouchableOpacity
          onPress={() => openPaywall(router, paywallReturnTo)}
          activeOpacity={0.85}
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityLabel={t('yo.historySeeAllPremium')}
        >
          <Text style={styles.moreBtnText}>{t('yo.historySeeAllPremium')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  sectionLabel: {
    ...THEME.typography.sectionEyebrow,
    color: THEME.colors.text.secondary,
  },
  limitHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  dateLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    width: 56,
  },
  emotionWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  emoji: {
    fontSize: 18,
  },
  emotionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    flex: 1,
  },
  energyBadge: {
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  energyText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  moreBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyCard: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyCta: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
