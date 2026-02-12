import { View, Text, StyleSheet } from 'react-native';
import { memo } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';

interface ProgressBarProps {
  completed: number;
  total: number;
  progressWidth: Animated.SharedValue<number>;
}

export const ProgressBar = memo(function ProgressBar({ completed, total, progressWidth }: ProgressBarProps) {
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  if (total === 0) return null;

  return (
    <View style={styles.progressIndicator}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progreso de hoy</Text>
        <Text style={styles.progressCount}>
          {completed} de {total}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              animatedProgressStyle
            ]} 
          />
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.completed === nextProps.completed &&
    prevProps.total === nextProps.total
  );
});

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
