import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { FrontGroupCard } from '@/components/frentes/FrontGroupCard';
import { CaptureProjectsSection } from '@/components/frentes/CaptureProjectsSection';
import { CaptureLiveSkeleton } from '@/components/tasks/CaptureLiveSkeleton';
import type { LiveCapturePreview } from '@/lib/liveCapturePreview';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';

type FrentesLivePreviewProps = {
  preview: LiveCapturePreview | null;
  isThinking: boolean;
  isUpdating?: boolean;
  projects?: ProjectForMatch[];
  onAddProject?: () => void;
};

export function FrentesLivePreview({
  preview,
  isThinking,
  isUpdating = false,
  projects = [],
  onAddProject,
}: FrentesLivePreviewProps) {
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

  const showSkeleton = isThinking && !preview;
  const headerIsThinking = isThinking || (isUpdating && !preview);

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={styles.header}>
        <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.headerTitle}>
          {headerIsThinking ? t('frentes.liveThinking') : t('frentes.liveUnderstood')}
        </Text>
      </View>

      {showSkeleton ? (
        <>
          <Text style={styles.thinkingText}>{t('frentes.liveGrouping')}</Text>
          <CaptureLiveSkeleton />
        </>
      ) : preview ? (
        <>
          <Text style={styles.subline}>
            {t('frentes.liveGrouped', {
              tasks: preview.items.length,
              fronts: preview.fronts.frontCount,
            })}
          </Text>

          <View style={styles.cards}>
            {preview.fronts.fronts.map((front, index) => (
              <FrontGroupCard key={front.key} front={front} index={index} compact />
            ))}
          </View>

          <CaptureProjectsSection projects={projects} onAddProject={onAddProject} />

          <Text style={styles.adjustHint}>{t('frentes.liveAdjustHint')}</Text>
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
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.medium,
  },
  cards: {
    gap: 10,
  },
  adjustHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
