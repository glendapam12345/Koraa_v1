import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { TipHighlightCarouselCard, TIP_HIGHLIGHT_CARD_WIDTH } from '@/components/tips/TipHighlightCarouselCard';
import type { ScoredTip } from '@/lib/tipsPersonalization';
import type { TranslationKey } from '@/lib/i18n';

type KoraaDailyTipsSectionProps = {
  tips: ScoredTip[];
  tipLead?: string;
  fromAi?: boolean;
  titleKey?: TranslationKey;
  embedded?: boolean;
  hideHeader?: boolean;
  onOpenTip: (tip: ScoredTip) => void;
};

export function KoraaDailyTipsSection({
  tips,
  tipLead,
  fromAi = false,
  titleKey = 'koraaDailyTips.title',
  embedded = false,
  hideHeader = false,
  onOpenTip,
}: KoraaDailyTipsSectionProps) {
  const { t } = useI18n();

  if (tips.length === 0) return null;

  const forYouLabel = t('tips.forYouBadge');
  const showSubheader = !hideHeader;

  const content = (
    <View
      style={[styles.inner, embedded && styles.innerEmbedded]}
      accessibilityRole="summary"
      accessibilityLabel={t('koraaDailyTips.a11ySection')}
    >
      {showSubheader ? (
        <View style={styles.header}>
          <Sparkles size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.title} accessibilityRole="header">
            {t(titleKey)}
          </Text>
          {fromAi ? (
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>{t('koraaDailyTips.aiBadge')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {tipLead ? <Text style={styles.lead}>{tipLead}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        snapToInterval={TIP_HIGHLIGHT_CARD_WIDTH + THEME.spacing.sm}
        snapToAlignment="start"
      >
        {tips.map((tip) => (
          <TipHighlightCarouselCard
            key={tip.id}
            tip={tip}
            forYouLabel={forYouLabel}
            onPress={() => onOpenTip(tip)}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (embedded) {
    return <View style={styles.embeddedPanel}>{content}</View>;
  }

  return <CalmCard style={styles.card}>{content}</CalmCard>;
}

const styles = StyleSheet.create({
  card: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  embeddedPanel: {
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.blush,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  inner: {
    gap: THEME.spacing.xs,
  },
  innerEmbedded: {
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    flexShrink: 1,
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
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    paddingRight: THEME.spacing.xs,
    paddingBottom: 2,
  },
});
