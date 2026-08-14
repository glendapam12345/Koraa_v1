import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { ParamiChartInsight } from '@/lib/paramiChartInsights';

type ParaMiChartInsightFooterProps = {
  insight: ParamiChartInsight;
};

/**
 * Pie de card estilo Musa: cifra destacada + frase que interpreta el gráfico.
 * Tipografía unificada con el resto de Para mí (cardTitle + caption).
 */
export function ParaMiChartInsightFooter({ insight }: ParaMiChartInsightFooterProps) {
  return (
    <View
      style={styles.box}
      accessibilityRole="summary"
      accessibilityLabel={`${insight.highlight}. ${insight.text}`}
    >
      <Text style={styles.highlight}>{insight.highlight}</Text>
      <Text style={styles.text}>{insight.text}</Text>
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
  highlight: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.calm.lavenderDeep,
    minWidth: 44,
  },
  text: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
});
