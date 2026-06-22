import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CaptureLiveSkeleton } from '@/components/tasks/CaptureLiveSkeleton';
import type { LiveCapturePreview } from '@/lib/liveCapturePreview';

type BrainDumpLivePreviewProps = {
  preview: LiveCapturePreview | null;
  isThinking: boolean;
  isUpdating?: boolean;
};

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
      <View style={styles.header}>
        <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.headerTitle}>
          {headerIsThinking ? t('vaciar.liveThinking') : t('vaciar.liveAreaDetectedTitle')}
        </Text>
      </View>

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
    padding: THEME.spacing.md,
    borderRadius: 24,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  thinkingText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  subline: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  columnsStack: {
    gap: THEME.spacing.sm,
  },
  column: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  columnEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  columnLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 20,
  },
  columnCount: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskList: {
    gap: 4,
    paddingTop: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  taskBullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 17,
    marginTop: -1,
  },
  taskLine: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 17,
    flex: 1,
  },
  moreTasks: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingLeft: 14,
  },
  adjustHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
