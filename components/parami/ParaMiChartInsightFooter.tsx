import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { ParamiChartInsight } from '@/lib/paramiChartInsights';

type ParaMiChartInsightFooterProps = {
  insight: ParamiChartInsight;
  compact?: boolean;
};

/**
 * Pie de card estilo Musa: cifra destacada + frase que interpreta el gráfico.
 * Tipografía unificada con el resto de Para mí (cardTitle + caption).
 */
export function ParaMiChartInsightFooter({
  insight,
  compact = false,
}: ParaMiChartInsightFooterProps) {
  return (
    <View
      style={[styles.box, compact && styles.boxCompact]}
      accessibilityRole="summary"
      accessibilityLabel={`${insight.highlight}. ${insight.text}`}
    >
      <Text style={[styles.highlight, compact && styles.highlightCompact]}>
        {insight.highlight}
      </Text>
      <Text
        style={[styles.text, compact && styles.textCompact]}
        numberOfLines={compact ? 2 : undefined}
      >
        {insight.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  boxCompact: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: THEME.spacing.xs,
  },
  highlight: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.calm.lavenderDeep,
    minWidth: 44,
  },
  highlightCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    minWidth: 36,
  },
  text: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  textCompact: {
    ...THEME.typography.small,
    lineHeight: 16,
    color: THEME.colors.text.secondary,
  },
});
