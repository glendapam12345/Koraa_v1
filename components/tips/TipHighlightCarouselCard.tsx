import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { TIP_CATEGORY_META } from '@/lib/tipsPersonalization';
import type { ScoredTip } from '@/lib/tipsPersonalization';

type TipHighlightCarouselCardProps = {
  tip: ScoredTip;
  forYouLabel?: string;
  onPress?: () => void;
};

export const TIP_HIGHLIGHT_CARD_WIDTH = 272;
const TIP_HIGHLIGHT_CARD_HEIGHT = 148;

export function TipHighlightCarouselCard({
  tip,
  forYouLabel,
  onPress,
}: TipHighlightCarouselCardProps) {
  const { t } = useI18n();
  const meta = TIP_CATEGORY_META[tip.category];
  const showBadge = Boolean(tip.forYou && forYouLabel);

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${tip.title}. ${tip.body}`}
      accessibilityHint={onPress ? t('tipsExtra.a11yTipOpenHint') : undefined}
    >
      <LinearGradient
        colors={[meta.gradient[0], meta.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{tip.emoji}</Text>
          {showBadge ? (
            <View style={styles.forYouPill}>
              <Text style={styles.forYouText} numberOfLines={1}>
                {forYouLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {tip.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {tip.body}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.openLabel}>{t('tipsExtra.openTip')}</Text>
          <ChevronRight size={14} color={THEME.colors.onGradient} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: TIP_HIGHLIGHT_CARD_WIDTH,
    height: TIP_HIGHLIGHT_CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    justifyContent: 'space-between',
    ...THEME.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  forYouPill: {
    maxWidth: 96,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.border,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: THEME.colors.surfaceOverlay.light,
  },
  forYouText: {
    ...THEME.typography.micro,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 12,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
    marginTop: 2,
  },
  body: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    opacity: 0.92,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: THEME.spacing.xs,
  },
  openLabel: {
    ...THEME.typography.micro,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.medium,
    opacity: 0.9,
  },
});
