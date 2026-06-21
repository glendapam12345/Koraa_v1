import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import type { MonthPlannerCell, MonthPlannerModel } from '@/lib/lifeAreas/monthPlanner';

type MonthPlannerViewProps = {
  model: MonthPlannerModel;
  selectedDate?: string;
  onSelectDate: (date: string) => void;
};

const LOAD_COLORS = {
  none: THEME.colors.calm.mist,
  light: `${THEME.colors.calm.lavenderDeep}33`,
  medium: `${THEME.colors.calm.lavenderDeep}66`,
  full: THEME.colors.calm.lavenderDeep,
} as const;

function MonthCell({
  cell,
  selected,
  onPress,
}: {
  cell: MonthPlannerCell;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.cell,
        { backgroundColor: LOAD_COLORS[cell.loadLevel] },
        !cell.isCurrentMonth && styles.cellOutside,
        cell.isToday && styles.cellToday,
        selected && styles.cellSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cell.dayNumber}, ${cell.taskCount} tasks`}
    >
      <Text
        style={[
          styles.cellDay,
          !cell.isCurrentMonth && styles.cellDayOutside,
          cell.isToday && styles.cellDayToday,
        ]}
      >
        {cell.dayNumber}
      </Text>
      {cell.taskCount > 0 ? (
        <View style={styles.dotRow}>
          {Array.from({ length: Math.min(cell.taskCount, 3) }).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export function MonthPlannerView({ model, selectedDate, onSelectDate }: MonthPlannerViewProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.monthTitle}>{model.monthLabel}</Text>
      <View style={styles.weekdayRow}>
        {model.weekdayHeaders.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      {model.weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((cell) => (
            <MonthCell
              key={cell.date}
              cell={cell}
              selected={cell.date === selectedDate}
              onPress={() => onSelectDate(cell.date)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  monthTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 4,
  },
  cellOutside: {
    opacity: 0.45,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.pink,
  },
  cellDay: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  cellDayOutside: {
    color: THEME.colors.text.tertiary,
  },
  cellDayToday: {
    color: THEME.colors.calm.lavenderDeep,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
});
