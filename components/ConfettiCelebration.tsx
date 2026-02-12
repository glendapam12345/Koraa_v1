import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const CONFETTI_COLORS = ['#FF6B6B', '#4A90E2', '#9B59B6', '#FFD700', '#FF1493', '#00CED1'];

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  delay: number;
}

function ConfettiPieceComponent({ color, startX, delay }: Omit<ConfettiPiece, 'id'>) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 1000,
        duration: 3000,
        delay,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          delay: delay + 2500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, [delay]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          left: `${startX}%`,
          transform: [
            { translateY },
            { scale },
            { rotate: rotation },
          ],
          opacity,
        },
      ]}
    />
  );
}

export function ConfettiCelebration() {
  // Crear piezas de confetti
  const confettiPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: Math.random() * 100,
    delay: Math.random() * 200,
  }));

  return (
    <View style={styles.container}>
      {confettiPieces.map((piece) => (
        <ConfettiPieceComponent
          key={piece.id}
          color={piece.color}
          startX={piece.startX}
          delay={piece.delay}
        />
      ))}
    </View>
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
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
