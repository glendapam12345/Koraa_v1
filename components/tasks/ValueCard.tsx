import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface ValueCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  message?: string;
  highlight?: boolean;
}

export function ValueCard({ title, value, icon, message, highlight }: ValueCardProps) {
  return (
    <View style={styles.valueCard}>
      <View style={styles.valueHeader}>
        {icon}
        <Text style={styles.valueTitle}>{title}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={highlight ? styles.valueNumberHighlight : styles.valueNumber}>
          {value}
        </Text>
      </View>
      {message && <Text style={styles.valueMessage}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  valueCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  valueTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  valueNumber: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueNumberHighlight: {
    ...THEME.typography.h3,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  valueMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
  },
});
