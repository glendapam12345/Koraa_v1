import { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { BrainDumpPanel } from '@/components/tasks/experience/BrainDumpPanel';
import { WhatChangedSheet } from '@/components/tasks/experience/WhatChangedSheet';
import { ChaosToClarityTransition } from '@/components/tasks/experience/ChaosToClarityTransition';
import { ReorganizeSuccessPanel } from '@/components/tasks/experience/ReorganizeSuccessPanel';
import { WeekPlannerView } from '@/components/tasks/experience/WeekPlannerView';
import type { KoraaExperienceStep, WhatChangedReason } from '@/lib/lifeAreas/types';
import { useAdaptiveExperience } from '@/hooks/useAdaptiveExperience';
import { VISION_REORGANIZE_RESULT } from '@/lib/lifeAreas/visionMockData';

type KoraaAdaptiveExperienceProps = {
  displayName?: string;
  userId?: string;
};

export function KoraaAdaptiveExperience({
  displayName = 'Pam',
  userId,
}: KoraaAdaptiveExperienceProps) {
  const { t } = useI18n();
  const {
    loading,
    usingSampleData,
    areas,
    floatingThoughts,
    weekDays,
    monthModel,
    lastProposal,
    lastReason,
    usedAi,
    reorganize,
    moveTaskToDay,
  } = useAdaptiveExperience({ userId });

  const [step, setStep] = useState<KoraaExperienceStep>('brain_dump');
  const [whatChangedOpen, setWhatChangedOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<WhatChangedReason | null>(null);
  const [reorganizing, setReorganizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openWhatChanged = useCallback(() => {
    setWhatChangedOpen(true);
  }, []);

  const startReorganize = useCallback(() => {
    setWhatChangedOpen(false);
    setReorganizing(true);
    setErrorMessage(null);
  }, []);

  const finishReorganize = useCallback(async () => {
    const reason = selectedReason ?? 'less_time';
    const result = await reorganize(reason);
    setReorganizing(false);
    if (!result.ok) {
      setErrorMessage(t('tasksExperience.vision.reorganizeError'));
      return;
    }
    setStep('success');
  }, [reorganize, selectedReason, t]);

  const proposal = lastProposal ?? VISION_REORGANIZE_RESULT;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {usingSampleData ? (
        <Text style={styles.sampleBanner}>{t('tasksExperience.vision.sampleDataBanner')}</Text>
      ) : null}

      {usedAi && (step === 'success' || step === 'week') ? (
        <Text style={styles.aiBanner}>{t('tasksExperience.vision.aiReorganizeBanner')}</Text>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {step === 'brain_dump' ? (
        <View style={styles.brainDumpHost}>
          <BrainDumpPanel
            displayName={displayName}
            thoughts={floatingThoughts}
            areas={areas}
            onOrganizePress={openWhatChanged}
          />
          <ChaosToClarityTransition
            active={reorganizing}
            onComplete={() => void finishReorganize()}
          />
        </View>
      ) : null}

      {step === 'success' ? (
        <ReorganizeSuccessPanel
          result={proposal}
          onViewWeek={() => setStep('week')}
        />
      ) : null}

      {step === 'week' ? (
        <WeekPlannerView
          days={weekDays}
          areas={areas}
          monthModel={monthModel}
          lastReason={lastReason}
          onBack={() => setStep('brain_dump')}
          onMoveTask={async (taskId, targetDayId) => {
            const result = await moveTaskToDay(taskId, targetDayId);
            return { ok: result.ok };
          }}
        />
      ) : null}

      <WhatChangedSheet
        visible={whatChangedOpen}
        selected={selectedReason}
        onSelect={setSelectedReason}
        onReorganize={startReorganize}
        onClose={() => setWhatChangedOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    gap: THEME.spacing.sm,
  },
  brainDumpHost: {
    position: 'relative',
    borderRadius: 28,
    overflow: 'hidden',
  },
  loading: {
    paddingVertical: THEME.spacing.lg,
    alignItems: 'center',
  },
  sampleBanner: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    backgroundColor: THEME.colors.calm.lavender,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  aiBanner: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    textAlign: 'center',
    backgroundColor: THEME.colors.calm.mist,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  error: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
});
