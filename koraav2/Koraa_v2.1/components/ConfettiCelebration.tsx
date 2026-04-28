import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const CONFETTI_COLORS = [...THEME.colors.confettiPalette];

interface ConfettiPieceData {
  id: number;
  color: string;
  startX: number;
  delay: number;
}

export function ConfettiCelebration() {
  // Crear piezas de confetti
  const confettiPieces: ConfettiPieceData[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: Math.random() * 100,
    delay: Math.random() * 200,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} {...piece} />
      ))}
    </View>
  );
}

function ConfettiPieceComponent({ color, startX, delay }: Omit<ConfettiPieceData, 'id'>) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const fallDistance = 400 + Math.random() * 200;
    const horizontalDrift = (Math.random() - 0.5) * 100;
    const rotations = Math.random() * 4 + 2;

    translateY.value = withDelay(
      delay,
      withTiming(fallDistance, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(horizontalDrift, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.ease),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotations * 360, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(
          1500,
          withTiming(0, { duration: 500 })
        )
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 200 })
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animation run-once, deps are refs
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          left: `${startX}%`,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
