import { ScrollView, StyleSheet, View } from 'react-native';
import { THEME } from '@/constants/theme';
import { TaskLifeCard } from '@/components/tasks/experience/TaskLifeCard';
import type { LifeArea, TaskLifeCardData } from '@/lib/lifeAreas/types';
import { findLifeArea } from '@/lib/lifeAreas/mockData';

type TaskLifeCardStripProps = {
  tasks: TaskLifeCardData[];
  areas: LifeArea[];
  onTaskPress?: (taskId: string) => void;
};

/** Fila horizontal de tarjetas — sensación de tablero, sin drag real aún. */
export function TaskLifeCardStrip({ tasks, areas, onTaskPress }: TaskLifeCardStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      decelerationRate="fast"
    >
      {tasks.map((task) => {
        const area = findLifeArea(areas, task.areaId);
        if (!area) return null;
        return (
          <View key={task.id} style={styles.cardWrap}>
            <TaskLifeCard
              task={task}
              area={area}
              onPress={onTaskPress ? () => onTaskPress(task.id) : undefined}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: THEME.spacing.sm,
    paddingVertical: 4,
    paddingRight: THEME.spacing.sm,
  },
  cardWrap: {
    flexShrink: 0,
  },
});
