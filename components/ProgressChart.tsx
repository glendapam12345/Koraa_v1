import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
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

const getEmotionColors = (emotion?: string): [string, string] => {
  switch (emotion?.toLowerCase()) {
    case 'feliz':
    case 'emocionada':
      return [THEME.colors.gradient.pink, '#FFD700'] as const;
    case 'tranquila':
    case 'relajada':
      return [THEME.colors.gradient.blue, '#87CEEB'] as const;
    case 'ansiosa':
    case 'estresada':
      return ['#FF6B6B', '#FF8C00'] as const;
    case 'triste':
    case 'melancólica':
      return ['#9B59B6', '#E74C3C'] as const;
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
  const heightValue = useRef(new Animated.Value(0)).current;

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
    const delay = index * 40;
    setTimeout(() => {
      Animated.spring(heightValue, {
        toValue: targetHeight,
        tension: 50,
        friction: 7,
        useNativeDriver: false, // height no soporta useNativeDriver
      }).start();
    }, delay);
  }, [day.hasCheckIn, day.energyLevel, index, maxBarHeight, minBarHeight]);

  const emotionColors = getEmotionColors(day.emotion);

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barContainer}>
        {day.hasCheckIn ? (
          <Animated.View style={[{ overflow: 'hidden', height: heightValue }]}>
            <LinearGradient
              colors={emotionColors}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.bar, { height: maxBarHeight }]}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.barEmpty, { height: heightValue }]} />
        )}
      </View>
      <Text style={styles.label}>{day.dayLabel}</Text>
    </View>
  );
}

export function ProgressChart({ data }: ProgressChartProps) {
  const maxBarHeight = CHART_HEIGHT - 32;
  const minBarHeight = 8;

  // Get unique emotions for legend
  const emotions = Array.from(new Set(data.filter(d => d.emotion).map(d => d.emotion)));

  return (
    <View style={styles.container}>
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

      {/* Legend */}
      {emotions.length > 0 && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Emociones:</Text>
          <View style={styles.legendItems}>
            {emotions.map((emotion) => {
              const colors = getEmotionColors(emotion);
              return (
                <View key={emotion} style={styles.legendItem}>
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.legendSquare}
                  />
                  <Text style={styles.legendText}>{emotion}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.legendNote}>
            La altura de las barras representa tu nivel de energía
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    marginBottom: THEME.spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: THEME.borderRadius.standard,
    minHeight: 8,
  },
  barEmpty: {
    width: '100%',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    minHeight: 6,
  },
  label: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    fontSize: 10,
  },
  legend: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
  legendTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: THEME.spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
  legendNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    fontSize: 10,
    marginTop: THEME.spacing.xs,
  },
});
