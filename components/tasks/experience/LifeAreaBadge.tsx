import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { LifeArea } from '@/lib/lifeAreas/types';

type LifeAreaBadgeProps = {
  area: Pick<LifeArea, 'name' | 'emoji' | 'color'>;
  compact?: boolean;
};

export function LifeAreaBadge({ area, compact = false }: LifeAreaBadgeProps) {
  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { backgroundColor: `${area.color}18`, borderColor: `${area.color}40` },
      ]}
    >
      <Text style={[styles.emoji, compact && styles.emojiCompact]}>{area.emoji}</Text>
      <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
        {area.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  wrapCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  emoji: {
    fontSize: THEME.typography.caption.fontSize,
    lineHeight: 18,
  },
  emojiCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  name: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  nameCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
