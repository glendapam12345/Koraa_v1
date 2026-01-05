import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type DayData = {
  date: string;
  hasCheckIn: boolean;
  dayLabel: string;
};

type ProgressChartProps = {
  data: DayData[];
};

const CHART_HEIGHT = 120;
const BAR_WIDTH = 16;
const BAR_SPACING = 4;

export function ProgressChart({ data }: ProgressChartProps) {
  const maxBarHeight = CHART_HEIGHT - 32; // Leave space for labels

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((day) => {
            const barHeight = day.hasCheckIn ? maxBarHeight : 6;

            return (
              <View key={day.date} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  {day.hasCheckIn ? (
                    <LinearGradient
                      colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
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
