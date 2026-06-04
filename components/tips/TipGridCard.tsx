import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import type { ScoredTip } from '@/lib/tipsPersonalization';

type TipGridCardProps = {
  tip: ScoredTip;
  forYouLabel?: string;
  onPress?: () => void;
};

export function TipGridCard({ tip, forYouLabel, onPress }: TipGridCardProps) {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={tip.title}
    >
      <View style={styles.card}>
        {tip.forYou && forYouLabel ? (
          <View style={styles.forYouPill}>
            <Text style={styles.forYouText}>{forYouLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.emoji}>{tip.emoji}</Text>
        <Text style={styles.title} numberOfLines={3}>
          {tip.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** Tarjeta expandida con el consejo completo */
export function TipDetailExpanded({ tip }: { tip: ScoredTip }) {
  return (
    <LinearGradient
      colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
      style={styles.expanded}
    >
      <Text style={styles.expandedEmoji}>{tip.emoji}</Text>
      <Text style={styles.expandedTitle}>{tip.title}</Text>
      <Text style={styles.expandedBody}>{tip.body}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    marginBottom: THEME.spacing.sm,
  },
  card: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  forYouPill: {
    position: 'absolute',
    top: THEME.spacing.xs,
    right: THEME.spacing.xs,
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
    lineHeight: 22,
  },
  expanded: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  expandedEmoji: {
    fontSize: 40,
    marginBottom: THEME.spacing.sm,
  },
  expandedTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  expandedBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
});
