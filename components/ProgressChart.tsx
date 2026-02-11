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

const CHART_HEIGHT = 120;
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
      return ['#6BB6FF', '#4A90E2'] as const; // Azul suave
    case 'enfocada':
      return ['#52C9A2', '#2E9D7A'] as const; // Verde
    case 'motivada':
      return ['#FFD93D', '#FFB84D'] as const; // Amarillo/Naranja
    case 'ansiosa':
      return ['#FF9F66', '#FF7F50'] as const; // Naranja suave
    case 'agotada':
      return ['#FF6B6B', '#E55555'] as const; // Rojo suave
    case 'abrumada':
      return ['#B794F6', '#9B7EDE'] as const; // Morado suave
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

      {/* Leyenda de emociones */}
      {emotionsInData.length > 0 && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Colores por emoción:</Text>
          <View style={styles.legendItems}>
            {emotionsInData.map((emotion) => {
              const colors = getEmotionColors(emotion);
              return (
                <View key={emotion} style={styles.legendItem}>
                  <View style={styles.legendItemIcon}>
                    <LinearGradient
                      colors={colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.legendColor}
                    />
                  </View>
                  <Text style={styles.legendText}>{emotion}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.legendNote}>
            La altura indica el nivel de energía (1-5)
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
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  legendTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  legendItemIcon: {
    marginRight: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: THEME.borderRadius.standard / 2,
  },
  legendText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontSize: 11,
  },
  legendNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
