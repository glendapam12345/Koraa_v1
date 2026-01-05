import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type DayData = {
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
const getEmotionColors = (emotion?: string): string[] => {
  if (!emotion) {
    return [THEME.colors.gradient.blue, THEME.colors.gradient.pink];
  }

  const emotionLower = emotion.toLowerCase();
  
  switch (emotionLower) {
    case 'tranquila':
      return ['#6BB6FF', '#4A90E2']; // Azul suave
    case 'enfocada':
      return ['#52C9A2', '#2E9D7A']; // Verde
    case 'motivada':
      return ['#FFD93D', '#FFB84D']; // Amarillo/Naranja
    case 'ansiosa':
      return ['#FF9F66', '#FF7F50']; // Naranja suave
    case 'agotada':
      return ['#FF6B6B', '#E55555']; // Rojo suave
    case 'abrumada':
      return ['#B794F6', '#9B7EDE']; // Morado suave
    default:
      return [THEME.colors.gradient.blue, THEME.colors.gradient.pink];
  }
};

export function ProgressChart({ data }: ProgressChartProps) {
  const maxBarHeight = CHART_HEIGHT - 32; // Leave space for labels
  const minBarHeight = 20; // Minimum height for bars with check-in

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((day) => {
            // Calculate bar height based on energy level (1-5) or default height
            let barHeight = 6; // Default for no check-in
            
            if (day.hasCheckIn && day.energyLevel) {
              // Map energy level (1-5) to bar height
              const energyPercentage = day.energyLevel / 5;
              barHeight = minBarHeight + (maxBarHeight - minBarHeight) * energyPercentage;
            } else if (day.hasCheckIn) {
              // Fallback if no energy level but has check-in
              barHeight = maxBarHeight;
            }

            const emotionColors = getEmotionColors(day.emotion);

            return (
              <View key={day.date} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  {day.hasCheckIn ? (
                    <LinearGradient
                      colors={emotionColors}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.bar, { height: barHeight }]}
                    />
                  ) : (
                    <View style={[styles.barEmpty, { height: barHeight }]} />
                  )}
                </View>
                <Text style={styles.label}>{day.dayLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>
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
});
