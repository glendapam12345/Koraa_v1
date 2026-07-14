import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CaptureLiveSkeleton } from '@/components/tasks/CaptureLiveSkeleton';
import type { LiveCapturePreview } from '@/lib/liveCapturePreview';

type BrainDumpLivePreviewProps = {
  preview: LiveCapturePreview | null;
  isThinking: boolean;
  isUpdating?: boolean;
};

/** Sección de apoyo: preview suave mientras escribes (progressive disclosure). */
export function BrainDumpLivePreview({
  preview,
  isThinking,
  isUpdating = false,
}: BrainDumpLivePreviewProps) {
  const { t } = useI18n();
  const prevAreaCount = useRef(0);

  useEffect(() => {
    if (!preview || isThinking) return;
    const areaCount = preview.areaColumns.length;
    if (areaCount > prevAreaCount.current && Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    prevAreaCount.current = areaCount;
  }, [isThinking, preview]);

  if (!preview && !isThinking) return null;

  const showSkeleton = isThinking && !preview;
  const headerIsThinking = isThinking || (isUpdating && !preview);
  const areaCount = preview?.areaColumns.length ?? 0;

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <Text style={styles.headerTitle}>
        {headerIsThinking ? t('vaciar.liveThinking') : t('vaciar.liveAreaDetectedTitle')}
      </Text>

      {showSkeleton ? (
        <>
          <Text style={styles.thinkingText}>{t('vaciar.liveAreaGrouping')}</Text>
          <CaptureLiveSkeleton />
        </>
      ) : preview ? (
        <>
          <Text style={styles.subline}>
            {preview.items.length === 1
              ? t('vaciar.liveAreaDetectedOne')
              : t('vaciar.liveAreaDetectedMany', {
                  tasks: preview.items.length,
                  areas: areaCount,
                })}
          </Text>

          <View style={styles.columnsStack}>
            {preview.areaColumns.map((column) => (
              <View key={column.ref} style={styles.column}>
                <View style={styles.columnHeader}>
                  <Text style={styles.columnEmoji}>{column.emoji}</Text>
                  <Text style={styles.columnLabel} numberOfLines={2}>
                    {column.label}
                  </Text>
                  <Text style={styles.columnCount}>
                    {t('vaciar.liveAreaColumnCount', { count: column.count })}
                  </Text>
                </View>

                <View style={styles.taskList}>
                  {column.previews.map((line, index) => (
                    <View key={`${column.ref}-${index}`} style={styles.taskRow}>
                      <Text style={styles.taskBullet}>·</Text>
                      <Text style={styles.taskLine} numberOfLines={2}>
                        {line}
                      </Text>
                    </View>
                  ))}
                  {column.count > column.previews.length ? (
                    <Text style={styles.moreTasks}>
                      {t('vaciar.liveAreaMoreTasks', {
                        count: column.count - column.previews.length,
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.adjustHint}>{t('vaciar.liveAreaAdjustHint')}</Text>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.colors.calm.border,
  },
  headerTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  thinkingText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  subline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  columnsStack: {
    gap: THEME.spacing.sm,
  },
  column: {
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  columnLabel: {
    ...THEME.typography.body,
    flex: 1,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  columnCount: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  taskList: {
    gap: 4,
    paddingLeft: 24,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  taskBullet: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 20,
  },
  taskLine: {
    ...THEME.typography.caption,
    flex: 1,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  moreTasks: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    paddingLeft: 12,
    lineHeight: 16,
  },
  adjustHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
