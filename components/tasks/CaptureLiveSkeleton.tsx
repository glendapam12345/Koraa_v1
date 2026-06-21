import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '@/constants/theme';

function ShimmerBar({ width, height }: { width: `${number}%` | number; height: number }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width, height, borderRadius: height / 2 },
        style,
      ]}
    />
  );
}

export function CaptureLiveSkeleton() {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.card}>
        <View style={styles.row}>
          <ShimmerBar width={28} height={28} />
          <View style={styles.col}>
            <ShimmerBar width="55%" height={12} />
            <ShimmerBar width="35%" height={10} />
          </View>
        </View>
        <ShimmerBar width="90%" height={10} />
        <ShimmerBar width="72%" height={10} />
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <ShimmerBar width={28} height={28} />
          <View style={styles.col}>
            <ShimmerBar width="48%" height={12} />
            <ShimmerBar width="30%" height={10} />
          </View>
        </View>
        <ShimmerBar width="80%" height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  card: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  bar: {
    backgroundColor: THEME.colors.calm.lavender,
  },
});
