import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import type { ScoredTip } from '@/lib/tipsPersonalization';
const BADGE_ROW_HEIGHT = 22;

type TipGridCardProps = {
  tip: ScoredTip;
  forYouLabel?: string;
  onPress?: () => void;
};

export function TipGridCard({ tip, forYouLabel, onPress }: TipGridCardProps) {
  const { t } = useI18n();
  const showBadge = Boolean(tip.forYou && forYouLabel);
  const a11yLabel = `${tip.title}${showBadge ? t('tipsExtra.a11yTipForYou') : ''}`;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11yLabel}
      accessibilityHint={onPress ? t('tipsExtra.a11yTipOpenHint') : undefined}
    >
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          {showBadge ? (
            <View style={styles.forYouPill}>
              <Text style={styles.forYouText}>{forYouLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.emoji}>{tip.emoji}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {tip.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

type TipDetailExpandedProps = {
  tip: ScoredTip;
  actionLabel?: string;
  onAction?: () => void;
};

/** Tarjeta expandida con el consejo completo */
export function TipDetailExpanded({ tip, actionLabel, onAction }: TipDetailExpandedProps) {
  const { t } = useI18n();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t('tipsExtra.a11yTipExpanded', { title: tip.title, body: tip.body })}
    >
      <LinearGradient
        colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
        style={styles.expanded}
      >
        <Text style={styles.expandedEmoji} importantForAccessibility="no" accessibilityElementsHidden>
          {tip.emoji}
        </Text>
      <Text style={styles.expandedTitle}>{tip.title}</Text>
      <Text style={styles.expandedBody}>{tip.body}</Text>
      {actionLabel && onAction ? (
        <CalmPrimaryButton label={actionLabel} onPress={onAction} variant="soft" />
      ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: THEME.spacing.sm,
  },
  card: {
    flex: 1,
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
  badgeRow: {
    height: BADGE_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  forYouPill: {
    backgroundColor: THEME.colors.gradient.pink,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  forYouText: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 10,
  },
  emoji: {
    fontSize: 28,
    marginBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
    flex: 1,
  },
  expanded: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.sm,
  },
  expandedEmoji: {
    fontSize: 40,
  },
  expandedTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  expandedBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
});
