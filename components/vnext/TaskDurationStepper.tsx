import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import {
  formatDurationLabel,
  stepEstimatedMinutes,
} from '@/lib/taskPlanningMeta';

type TaskDurationStepperProps = {
  minutes: number;
  onChange: (minutes: number) => void;
};

export function TaskDurationStepper({ minutes, onChange }: TaskDurationStepperProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(stepEstimatedMinutes(minutes, -15))}
        accessibilityRole="button"
        accessibilityLabel="Reduce duration"
      >
        <Minus size={18} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
      <Text style={styles.value}>{formatDurationLabel(minutes)}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(stepEstimatedMinutes(minutes, 15))}
        accessibilityRole="button"
        accessibilityLabel="Increase duration"
      >
        <Plus size={18} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
  },
  btn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    minWidth: 108,
    textAlign: 'center',
  },
});
