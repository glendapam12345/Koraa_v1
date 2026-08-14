import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { THEME } from '@/constants/theme';

export type EllieMood = 'default' | 'breathing' | 'sleepy' | 'happy' | 'grateful';

const ELLIE_MOODS: Record<EllieMood, number> = {
  default: require('@/assets/images/ellie-mascot.png'),
  breathing: require('@/assets/images/ellie-mood-breathing.png'),
  sleepy: require('@/assets/images/ellie-mood-sleepy.png'),
  happy: require('@/assets/images/ellie-mood-happy.png'),
  grateful: require('@/assets/images/ellie-mood-grateful.png'),
};

type OnboardingEllieCoachProps = {
  message: string;
  mood?: EllieMood;
  /** Tamaño de Ellie — compacto tipo Duolingo. */
  size?: number;
  breathe?: boolean;
};

/**
 * Ellie + burbuja — guía amigable en onboarding (no hero gigante).
 */
export function OnboardingEllieCoach({
  message,
  mood = 'default',
  size = 56,
  breathe = true,
}: OnboardingEllieCoachProps) {
  const breath = useSharedValue(1);

  useEffect(() => {
    if (!breathe) {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="summary"
      accessibilityLabel={message}
    >
      <Animated.View style={[{ width: size, height: size }, breathStyle]}>
        <Image
          source={ELLIE_MOODS[mood]}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      </Animated.View>
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  bubble: {
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  tail: {
    position: 'absolute',
    left: -6,
    top: '42%',
    width: 12,
    height: 12,
    backgroundColor: THEME.colors.calm.card,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.calm.border,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
});
