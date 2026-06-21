import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { DayTimelineModel } from '@/lib/lifeAreas/types';
import {
  getTimelineHourHeight,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from '@/lib/lifeAreas/experienceDataMappers';

type DayTimelineViewProps = {
  model: DayTimelineModel;
};

export function DayTimelineView({ model }: DayTimelineViewProps) {
  const hourHeight = getTimelineHourHeight();
  const hours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, index) => TIMELINE_START_HOUR + index,
  );

  const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display} ${suffix}`;
  };

  return (
    <View style={styles.wrap}>
      {model.annotation ? (
        <View style={styles.annotation}>
          <Text style={styles.annotationText}>{model.annotation}</Text>
        </View>
      ) : null}

      <View style={styles.timeline}>
        <View style={styles.rail}>
          {hours.map((hour) => (
            <View key={hour} style={[styles.hourRow, { height: hourHeight }]}>
              <Text style={styles.hourLabel}>{formatHour(hour)}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
        </View>

        <View style={[styles.blocksCol, { height: hours.length * hourHeight }]}>
          {model.blocks.map((block) => {
            const top = (block.startHour - TIMELINE_START_HOUR) * hourHeight + 4;
            const height = Math.max(block.durationHours * hourHeight - 8, 36);
            return (
              <View
                key={block.id}
                style={[
                  styles.block,
                  {
                    top,
                    height,
                    backgroundColor: `${block.areaColor}55`,
                    borderColor: block.areaColor,
                  },
                  block.isNewEvent && styles.blockNewEvent,
                ]}
              >
                <Text style={styles.blockTitle} numberOfLines={2}>
                  {block.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  annotation: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: THEME.colors.calm.lavender,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  annotationText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.medium,
  },
  timeline: {
    flexDirection: 'row',
    gap: 8,
  },
  rail: {
    width: 52,
  },
  hourRow: {
    justifyContent: 'flex-start',
  },
  hourLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
  },
  hourLine: {
    position: 'absolute',
    left: 48,
    right: -300,
    top: 8,
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.calm.border,
  },
  blocksCol: {
    flex: 1,
    position: 'relative',
  },
  block: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  blockNewEvent: {
    borderStyle: 'dashed',
  },
  blockTitle: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
});
