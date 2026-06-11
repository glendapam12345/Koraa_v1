import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { AddToDeviceCalendarButton } from '@/components/tasks/AddToDeviceCalendarButton';

type TaskCalendarExportRowProps = {
  taskId: string;
  title: string;
  scheduledDate: string;
  variant?: 'chip' | 'row';
};

export function TaskCalendarExportRow({
  taskId,
  title,
  scheduledDate,
  variant = 'chip',
}: TaskCalendarExportRowProps) {
  return (
    <View style={[styles.row, variant === 'row' && styles.rowStack]}>
      <AddToDeviceCalendarButton
        taskId={taskId}
        title={title}
        scheduledDate={scheduledDate}
        variant={variant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  rowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
