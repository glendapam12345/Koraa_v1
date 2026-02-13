import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export function ProgressBar({
  completedCount,
  totalCount,
  progressPercentage,
}: ProgressBarProps) {
  return (
    <View style={styles.progressIndicator}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progreso de hoy</Text>
        <Text style={styles.progressCount}>
          {completedCount}/{totalCount}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressIndicator: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  progressLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  progressCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 4,
  },
});
