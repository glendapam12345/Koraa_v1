import { View, StyleSheet } from 'react-native';
import { BrainDumpFloatingCard } from '@/components/tasks/experience/BrainDumpFloatingCard';
import type { FloatingThoughtCard, LifeArea } from '@/lib/lifeAreas/types';
import { findVisionArea } from '@/lib/lifeAreas/visionMockData';

type BrainDumpCanvasProps = {
  thoughts: FloatingThoughtCard[];
  areas: LifeArea[];
  height?: number;
};

/** Nube de pensamientos — tarjetas superpuestas, caos bonito. */
export function BrainDumpCanvas({ thoughts, areas, height = 340 }: BrainDumpCanvasProps) {
  return (
    <View style={[styles.canvas, { height }]}>
      {thoughts.map((thought) => {
        const area = findVisionArea(areas, thought.areaId);
        if (!area) return null;
        return <BrainDumpFloatingCard key={thought.id} thought={thought} area={area} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
});
