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

type CaptureLiveSkeletonProps = {
  count?: number;
};

function ColumnSkeleton() {
  return (
    <View style={styles.columnCard}>
      <View style={styles.row}>
        <ShimmerBar width={28} height={28} />
        <View style={styles.col}>
          <ShimmerBar width="70%" height={12} />
          <ShimmerBar width="40%" height={10} />
        </View>
      </View>
      <ShimmerBar width="92%" height={10} />
      <ShimmerBar width="78%" height={10} />
      <ShimmerBar width="65%" height={10} />
    </View>
  );
}

export function CaptureLiveSkeleton({ count = 2 }: CaptureLiveSkeletonProps) {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, index) => (
        <ColumnSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  columnCard: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 8,
    alignSelf: 'stretch',
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
