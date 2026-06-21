import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { FloatingThoughtCard, LifeArea } from '@/lib/lifeAreas/types';
import { areaPastelBg } from '@/lib/lifeAreas/visionMockData';

type BrainDumpFloatingCardProps = {
  thought: FloatingThoughtCard;
  area: LifeArea;
};

export function BrainDumpFloatingCard({ thought, area }: BrainDumpFloatingCardProps) {
  const width = thought.layout.width ?? 140;

  return (
    <View
      style={[
        styles.card,
        {
          top: thought.layout.top,
          left: thought.layout.left,
          width,
          zIndex: thought.layout.zIndex,
          backgroundColor: areaPastelBg(area.color),
          borderColor: `${area.color}55`,
          transform: [
            { rotate: thought.layout.rotate },
            { scale: thought.layout.scale ?? 1 },
          ],
        },
      ]}
    >
      <Text style={styles.icon}>{thought.iconEmoji}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {thought.title}
      </Text>
      <View style={[styles.areaPill, { backgroundColor: `${area.color}28` }]}>
        <Text style={[styles.areaName, { color: area.color }]} numberOfLines={1}>
          {area.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 22,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    ...THEME.shadows.card,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  areaPill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.pill,
  },
  areaName: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
});
