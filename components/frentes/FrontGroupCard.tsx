import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import type { CaptureFront } from '@/lib/captureProjectFronts';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';

type FrontGroupCardProps = {
  front: CaptureFront;
  index?: number;
  compact?: boolean;
};

export function FrontGroupCard({ front, index = 0, compact = false }: FrontGroupCardProps) {
  const theme = frontThemeForFront(front, index);
  const displayName = front.name.replace(/\s+App$/i, '');

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).duration(320).springify().damping(20)}
      style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{front.emoji}</Text>
        <Text style={[styles.title, { color: theme.accent }]}>{displayName}</Text>
        <Text style={styles.badge}>
          {front.tasks.length === 1 ? '1' : front.tasks.length}
        </Text>
      </View>

      <View style={styles.tasks}>
        {front.tasks.map((task) => (
          <View
            key={task.captureId}
            style={[styles.taskRow, { backgroundColor: theme.taskBg }]}
          >
            <View style={[styles.taskDot, { backgroundColor: theme.accent }]} />
            <Text style={styles.taskText} numberOfLines={compact ? 1 : 2}>
              {task.content}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
    lineHeight: 22,
  },
  badge: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    backgroundColor: THEME.colors.surfaceOverlay.glassHeavy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  tasks: {
    gap: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  taskText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.medium,
  },
});
