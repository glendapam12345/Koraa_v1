import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

export type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
  emotion?: string;
  energyLevel?: number;
};

type ProgressChartProps = {
  data: DayData[];
};

const CHART_HEIGHT = 100;
const BAR_WIDTH = 16;
const BAR_SPACING = 4;

// Función para obtener colores según emoción
const getEmotionColors = (emotion?: string): readonly [string, string] => {
  if (!emotion) {
    return [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const;
  }

  const emotionLower = emotion.toLowerCase();

  switch (emotionLower) {
    case 'tranquila':
      return [THEME.colors.chartPalette[0], THEME.colors.gradient.blue] as const;
    case 'enfocada':
      return [THEME.colors.chartPalette[2], THEME.colors.chartPalette[3]] as const;
    case 'motivada':
      return [THEME.colors.accent.yellow, THEME.colors.chartPalette[5]] as const;
    case 'ansiosa':
      return [THEME.colors.chartPalette[6], THEME.colors.chartPalette[7]] as const;
    case 'agotada':
      return [THEME.colors.gradient.pink, THEME.colors.chartPalette[9]] as const;
    case 'abrumada':
      return [THEME.colors.chartPalette[10], THEME.colors.chartPalette[11]] as const;
    default:
      return [THEME.colors.gradient.blue, THEME.colors.gradient.pink] as const;
  }
};

// Componente de barra animada
function AnimatedBar({
  day,
  index,
  maxBarHeight,
  minBarHeight
}: {
  day: DayData;
  index: number;
  maxBarHeight: number;
  minBarHeight: number;
}) {
  const heightValue = useSharedValue(0);

  useEffect(() => {
    // Calculate target height
    let targetHeight = 6;
    if (day.hasCheckIn && day.energyLevel) {
      const energyPercentage = day.energyLevel / 5;
      targetHeight = minBarHeight + (maxBarHeight - minBarHeight) * energyPercentage;
    } else if (day.hasCheckIn) {
      targetHeight = maxBarHeight;
    }

    // Animate with staggered delay
    heightValue.value = withDelay(
      index * 40,
      withSpring(targetHeight, {
        damping: 12,
        stiffness: 100,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- heightValue is a ref
  }, [day.hasCheckIn, day.energyLevel, index, maxBarHeight, minBarHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
  }));

  const emotionColors = getEmotionColors(day.emotion);

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barContainer}>
        {day.hasCheckIn ? (
          <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
            <LinearGradient
              colors={emotionColors}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.bar, { height: maxBarHeight }]}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.barEmpty, animatedStyle]} />
        )}
      </View>
      <Text style={styles.label}>{day.dayLabel}</Text>
    </View>
  );
}

export function ProgressChart({ data }: ProgressChartProps) {
  const maxBarHeight = CHART_HEIGHT - 32;
  const minBarHeight = 20;

  // Extraer emociones únicas de los datos
  const emotionsInData = Array.from(
    new Set(data.filter(d => d.emotion).map(d => d.emotion))
  );

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((day, index) => (
            <AnimatedBar
              key={day.date}
              day={day}
              index={index}
              maxBarHeight={maxBarHeight}
              minBarHeight={minBarHeight}
            />
          ))}
        </View>
      </View>

      {/* Leyenda simplificada */}
      {emotionsInData.length > 0 && (
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={styles.legendItems}>
              {emotionsInData.slice(0, 6).map((emotion) => {
                const colors = getEmotionColors(emotion);
                return (
                  <View key={emotion} style={styles.legendItem}>
                    <LinearGradient
                      colors={colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.legendColor}
                    />
                    <Text style={styles.legendText}>{emotion}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Text style={styles.legendNote}>
            Altura = energía (1-5) • Color = emoción
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    height: CHART_HEIGHT + 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    paddingHorizontal: THEME.spacing.xs,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: BAR_WIDTH + BAR_SPACING,
  },
  barContainer: {
    width: BAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: THEME.borderRadius.standard / 2,
    minHeight: 6,
  },
  barEmpty: {
    width: BAR_WIDTH,
    borderRadius: THEME.borderRadius.standard / 2,
    backgroundColor: THEME.colors.fill[200],
    minHeight: 6,
  },
  label: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 9,
    textAlign: 'center',
    width: BAR_WIDTH + 4,
  },
  legendContainer: {
    marginTop: THEME.spacing.sm,
  },
  legendRow: {
    marginBottom: THEME.spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontSize: 11,
  },
  legendNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
});
