import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { THEME } from '@/constants/theme';

interface ProgressBarProps {
  completed: number;
  total: number;
  progressWidth?: number;
}

export function ProgressBar({ completed, total, progressWidth = 0 }: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (total > 0) {
      const percentage = (completed / total) * 100;
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false, // width no soporta useNativeDriver
      }).start();
    }
  }, [completed, total]);

  if (total === 0) {
    return null;
  }

  const percentage = (completed / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.text}>
        {completed} de {total} completadas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.md,
  },
  track: {
    height: 8,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    marginBottom: THEME.spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: THEME.borderRadius.pill,
  },
  text: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
});
