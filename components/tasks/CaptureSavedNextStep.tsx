import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureFrontsResult } from '@/lib/captureProjectFronts';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { CaptureReleaseSummary } from '@/components/tasks/CaptureReleaseSummary';

type CaptureSavedNextStepProps = {
  fronts: CaptureFrontsResult;
  hasCheckInToday: boolean | null;
  creatingFrontKey: string | null;
  onCreateProject: (frontKey: string, projectName: string) => void;
  onGoToHoy: () => void;
  onGoToCheckIn: () => void;
};

export function CaptureSavedNextStep({
  fronts,
  hasCheckInToday,
  creatingFrontKey,
  onCreateProject,
  onGoToHoy,
  onGoToCheckIn,
}: CaptureSavedNextStepProps) {
  const { t } = useI18n();
  const [showDetail, setShowDetail] = useState(false);

  const needsCheckIn = !hasCheckInToday;

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <Text style={styles.emoji}>💜</Text>
        <Text style={styles.title}>{t('vaciar.savedNextTitle')}</Text>
        <Text style={styles.body}>
          {needsCheckIn ? t('vaciar.savedNextBodyCheckIn') : t('vaciar.savedNextBodyHoy')}
        </Text>

        <CalmPrimaryButton
          label={needsCheckIn ? t('vaciar.savedGoCheckIn') : t('vaciar.savedGoHoy')}
          onPress={needsCheckIn ? onGoToCheckIn : onGoToHoy}
          large
          style={styles.primaryBtn}
        />

        {!needsCheckIn ? (
          <TouchableOpacity
            onPress={onGoToHoy}
            style={styles.secondaryLink}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{t('vaciar.savedGoHoySecondary')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => setShowDetail((open) => !open)}
        style={styles.detailToggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: showDetail }}
      >
        <Text style={styles.detailToggleText}>
          {showDetail ? t('vaciar.savedHideDetail') : t('vaciar.savedViewDetail')}
        </Text>
      </TouchableOpacity>

      {showDetail ? (
        <CaptureReleaseSummary
          fronts={fronts}
          creatingFrontKey={creatingFrontKey}
          onCreateProject={onCreateProject}
          onGoToHoy={onGoToHoy}
          onDismiss={() => setShowDetail(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  heroCard: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    lineHeight: 44,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    lineHeight: 28,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginTop: THEME.spacing.xs,
  },
  secondaryLink: {
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  secondaryText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  detailToggle: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  detailToggleText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
});
