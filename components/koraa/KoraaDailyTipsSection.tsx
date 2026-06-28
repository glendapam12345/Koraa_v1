import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { TipGridCard } from '@/components/tips/TipGridCard';
import type { ScoredTip } from '@/lib/tipsPersonalization';
import type { TranslationKey } from '@/lib/i18n';

type KoraaDailyTipsSectionProps = {
  tips: ScoredTip[];
  tipLead?: string;
  fromAi?: boolean;
  titleKey?: TranslationKey;
  embedded?: boolean;
  onOpenTip: (tip: ScoredTip) => void;
};

export function KoraaDailyTipsSection({
  tips,
  tipLead,
  fromAi = false,
  titleKey = 'koraaDailyTips.title',
  embedded = false,
  onOpenTip,
}: KoraaDailyTipsSectionProps) {
  const { t } = useI18n();

  if (tips.length === 0) return null;

  const forYouLabel = t('tips.forYouBadge');
  const content = (
    <View
      style={styles.inner}
      accessibilityRole="summary"
      accessibilityLabel={t('koraaDailyTips.a11ySection')}
    >
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
      {tipLead ? <Text style={styles.lead}>{tipLead}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {tips.map((tip) => (
          <View key={tip.id} style={styles.cardSlot}>
            <TipGridCard
              tip={tip}
              forYouLabel={forYouLabel}
              onPress={() => onOpenTip(tip)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (embedded) return content;

  return <CalmCard style={styles.card}>{content}</CalmCard>;
}

const CARD_WIDTH = 148;

const styles = StyleSheet.create({
  card: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  inner: {
    gap: THEME.spacing.xs,
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
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    paddingRight: THEME.spacing.xs,
  },
  cardSlot: {
    width: CARD_WIDTH,
  },
});
