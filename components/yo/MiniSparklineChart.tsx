import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

type MiniSparklineChartProps = {
  values: number[];
  maxValue?: number;
  height?: number;
};

export function MiniSparklineChart({
  values,
  maxValue = 5,
  height = 56,
}: MiniSparklineChartProps) {
  const max = Math.max(maxValue, 1);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((value, index) => {
        const barHeight = value > 0 ? Math.max(6, (value / max) * (height - 8)) : 4;
        return (
          <View key={`${index}`} style={styles.cell}>
            {value > 0 ? (
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
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  barEmpty: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: THEME.colors.fill[200],
    minWidth: 4,
  },
});
