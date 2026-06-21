import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeInRight,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureFront, FrontHintKey } from '@/lib/captureProjectFronts';
import type { LiveCapturePreview } from '@/lib/liveCapturePreview';
import { CaptureLiveSkeleton } from '@/components/tasks/CaptureLiveSkeleton';

type CaptureLiveOrganizationProps = {
  preview: LiveCapturePreview | null;
  isThinking: boolean;
  isUpdating?: boolean;
  expanded?: boolean;
};

function hintI18nKey(key: FrontHintKey): string {
  const map: Record<FrontHintKey, string> = {
    highPriority: 'vaciar.frontsHintHighPriority',
    hasDeadline: 'vaciar.frontsHintHasDeadline',
    important: 'vaciar.frontsHintImportant',
    noDeadline: 'vaciar.frontsHintNoDeadline',
    personalLife: 'vaciar.frontsHintPersonalLife',
    empty: 'vaciar.frontsHintEmpty',
  };
  return map[key];
}

function ThinkingPulse() {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return <Animated.View style={[styles.thinkingDot, style]} />;
}

function LiveProgressBar({ progress }: { progress: number }) {
  const pct = `${Math.min(100, Math.max(4, Math.round(progress * 100)))}%`;
  return (
    <View style={styles.progressTrack}>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.progressFill, { width: pct as `${number}%` }]}
      />
    </View>
  );
}

function TaskPill({ content }: { content: string }) {
  return (
    <Animated.View
      entering={FadeInRight.duration(220)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.springify().damping(18)}
      style={styles.taskPill}
    >
      <View style={styles.taskDot} />
      <Text style={styles.taskText} numberOfLines={2}>
        {content}
      </Text>
    </Animated.View>
  );
}

function FrontBucket({ front, index }: { front: CaptureFront; index: number }) {
  const { t } = useI18n();

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(16)}
      entering={FadeIn.delay(index * 50).duration(300).springify().damping(18)}
      style={styles.bucket}
    >
      <View style={styles.bucketHeader}>
        <Text style={styles.bucketEmoji}>{front.emoji}</Text>
        <View style={styles.bucketTitleWrap}>
          <Text style={styles.bucketTitle} numberOfLines={1}>
            {front.name}
          </Text>
          <Text style={styles.bucketMeta}>
            {front.tasks.length === 0
              ? t('vaciar.frontsNoTasksYet')
              : t('vaciar.frontsTaskCount', { count: front.tasks.length })}
          </Text>
        </View>
        {front.suggestedNewProject ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t('vaciar.liveNewProject')}</Text>
          </View>
        ) : null}
      </View>

      {front.hints.length > 0 ? (
        <View style={styles.hintRow}>
          {front.hints.slice(0, 2).map((hint) => (
            <View key={hint} style={styles.hintChip}>
              <Text style={styles.hintText}>{t(hintI18nKey(hint))}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.taskList}>
        {front.tasks.slice(0, 4).map((task) => (
          <TaskPill key={task.captureId} content={task.content} />
        ))}
      </View>

      {front.tasks.length > 4 ? (
        <Text style={styles.moreTasks}>
          +{front.tasks.length - 4} {t('vaciar.liveMoreTasks')}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function CaptureLiveOrganization({
  preview,
  isThinking,
  isUpdating = false,
  expanded = false,
}: CaptureLiveOrganizationProps) {
  const { t } = useI18n();
  const prevFrontCount = useRef(0);

  useEffect(() => {
    if (!preview || isThinking) return;
    if (preview.fronts.frontCount > prevFrontCount.current && Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    prevFrontCount.current = preview.fronts.frontCount;
  }, [isThinking, preview]);

  if (!preview && !isThinking) return null;

  const taskBadge = preview?.items.length ?? 0;
  const progress = preview
    ? Math.min(1, preview.items.length / 8)
    : isThinking
      ? 0.15
      : 0;

  const showSkeleton = isThinking && !preview;
  const headerIsThinking = isThinking || (isUpdating && !preview);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(180)}
      style={[
        styles.wrap,
        expanded && styles.wrapExpanded,
        (headerIsThinking || isUpdating) && styles.wrapThinking,
      ]}
    >
      <LiveProgressBar progress={progress} />

      <View style={styles.header}>
        <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.headerTitle}>
          {headerIsThinking ? t('vaciar.liveOrganizing') : t('vaciar.liveOrganizedTitle')}
        </Text>
        {!headerIsThinking && taskBadge > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{taskBadge}</Text>
          </View>
        ) : null}
        {isUpdating ? <ThinkingPulse /> : null}
      </View>

      {showSkeleton ? (
        <>
          <Text style={styles.thinkingText}>{t('vaciar.liveThinking')}</Text>
          <CaptureLiveSkeleton />
        </>
      ) : preview ? (
        <>
          <Text style={styles.subline}>
            {isUpdating
              ? t('vaciar.liveUpdating')
              : t('vaciar.liveOrganizedSub', {
                  projects: preview.fronts.frontCount,
                  tasks: preview.items.length,
                })}
          </Text>

          <View style={styles.bucketStack}>
            {preview.fronts.fronts.map((front, index) => (
              <FrontBucket key={front.key} front={front} index={index} />
            ))}
          </View>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  wrapExpanded: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  wrapThinking: {
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
    lineHeight: 22,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  countBadgeText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 16,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  thinkingText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  subline: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  bucketStack: {
    gap: THEME.spacing.sm,
  },
  bucket: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 8,
    ...THEME.shadows.soft,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bucketEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  bucketTitleWrap: {
    flex: 1,
    gap: 1,
  },
  bucketTitle: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  bucketMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  newBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 14,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hintChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
  },
  hintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
  taskList: {
    gap: 6,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    marginTop: 5,
  },
  taskText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 18,
  },
  moreTasks: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
    paddingLeft: 4,
  },
});
