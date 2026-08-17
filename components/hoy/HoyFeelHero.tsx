import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { resolveEllieDayVoice, type EllieMiddayStep } from '@/lib/ellieDayVoice';
import type { HoyEllieDailyState } from '@/lib/hoyEllieDailyState';
import { buildEllieAdaptMessage, energyBand, mindBand } from '@/lib/ellieCheckInInterpret';
import {
  resolveEllieCompanionCue,
  resolveElliePresence,
  type EllieMood,
} from '@/lib/elliePersonality';
import type { TranslationKey } from '@/lib/i18n';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';

const CHANGED_REASON_OPTIONS: {
  key: TranslationKey;
  reason?: WhatChangedReason;
}[] = [
  { key: 'hoy.ellieChangedLessTime', reason: 'less_time' },
  { key: 'hoy.ellieChangedCameUp', reason: 'new_event' },
  { key: 'hoy.ellieChangedMoreEnergy', reason: 'more_energy' },
  { key: 'hoy.ellieChangedMoreTired', reason: 'tired' },
  { key: 'hoy.ellieChangedPrioritize', reason: 'priorities_changed' },
  { key: 'hoy.ellieChangedOther' },
];

const ELLIE_MOOD_NOTE: Record<EllieMood, TranslationKey> = {
  default: 'hoy.ellieMoodNoteDefault',
  breathing: 'hoy.ellieMoodNoteBreathing',
  sleepy: 'hoy.ellieMoodNoteSleepy',
  happy: 'hoy.ellieMoodNoteHappy',
  grateful: 'hoy.ellieMoodNoteGrateful',
  focus: 'hoy.ellieMoodNoteFocus',
  comforting: 'hoy.ellieMoodNoteComforting',
  proud: 'hoy.ellieMoodNoteProud',
  cozy: 'hoy.ellieMoodNoteCozy',
  curious: 'hoy.ellieMoodNoteCurious',
};

type HoyFeelHeroProps = {
  hasCheckIn: boolean;
  dailyState: HoyEllieDailyState;
  hasTasks?: boolean;
  hasNightLeftovers?: boolean;
  isReturningLater?: boolean;
  emotionLabel?: string;
  emotionKey?: string;
  energyLevel?: number;
  focusLevel?: string;
  displayName?: string;
  middayStep?: EllieMiddayStep;
  onUpdateFeel: () => void;
  onMiddayOkay?: () => void;
  onMiddayDayChanged?: () => void;
  onMiddayChangedConfirm?: (reason?: WhatChangedReason) => void;
  onMiddayMind?: () => void;
  onReturnAccept?: () => void;
  onReturnEdit?: () => void;
  onAdaptLooksGood?: () => void;
  onAdaptEdit?: () => void;
  onFreeRest?: () => void;
  onFreeEmpty?: () => void;
  onFreeExplore?: () => void;
  planCloseAccepted?: boolean;
  onPlanDoneEmpty?: () => void;
  onPlanDoneRest?: () => void;
  onPlanDoneSeeYou?: () => void;
  onMoodReplan?: () => void;
  onMoodKeep?: () => void;
  onNightUrgent?: () => void;
  onNightNotUrgent?: () => void;
  onNightDone?: () => void;
  onNightSeeLeft?: () => void;
};

function ellieMoodForDailyState(
  dailyState: HoyEllieDailyState,
  middayStep: EllieMiddayStep,
  portraitMood: ReturnType<typeof resolveElliePresence>['mood'],
): ReturnType<typeof resolveElliePresence>['mood'] {
  if (dailyState === 'evening' || dailyState === 'day_closed') return 'cozy';
  if (dailyState === 'plan_done') return 'grateful';
  if (dailyState === 'not_started') return 'curious';
  if (dailyState === 'returning' && middayStep === 'mind') return 'curious';
  return portraitMood;
}

export function HoyFeelHero({
  hasCheckIn,
  dailyState,
  hasNightLeftovers = false,
  emotionLabel = '',
  emotionKey = '',
  energyLevel = 0,
  focusLevel = '',
  displayName = '',
  middayStep = 'ask',
  onUpdateFeel,
  onMiddayOkay,
  onMiddayDayChanged,
  onMiddayChangedConfirm,
  onMiddayMind,
  onReturnAccept,
  onReturnEdit,
  onAdaptLooksGood,
  onAdaptEdit,
  onFreeRest,
  onFreeEmpty,
  onFreeExplore,
  planCloseAccepted = false,
  onPlanDoneEmpty,
  onPlanDoneRest,
  onPlanDoneSeeYou,
  onMoodReplan,
  onMoodKeep,
  onNightUrgent,
  onNightNotUrgent,
  onNightDone,
  onNightSeeLeft,
}: HoyFeelHeroProps) {
  const { t } = useI18n();
  const { greeting } = useKoraaGreeting();
  const firstName = getFirstName(displayName);

  const routing = dailyState === 'returning' && middayStep === 'ask';
  const showChangedAsk = dailyState === 'returning' && middayStep === 'changedAsk';
  const showReturnPropose = dailyState === 'returning' && middayStep === 'propose';
  const showAdaptActions = dailyState === 'adapting';
  const showFreeActions = dailyState === 'free_day';
  const showPlanDoneActions = dailyState === 'plan_done' && !planCloseAccepted;
  const showStartCheckIn = dailyState === 'not_started';
  const showMoodActions = dailyState === 'mood_updated';
  const showNightAsk = dailyState === 'evening' && middayStep === 'ask' && hasNightLeftovers;
  const showNightClose =
    dailyState === 'evening' &&
    (middayStep === 'nightClose' || (middayStep === 'ask' && !hasNightLeftovers));

  const nightClearMessage = firstName
    ? t('hoy.ellieNightClear', { name: firstName })
    : t('hoy.ellieNightClearNoName');
  const nightAskMessage = firstName
    ? t('hoy.ellieNightAsk', { name: firstName })
    : t('hoy.ellieNightAskNoName');

  const notStartedMessage = firstName
    ? t('hoy.ellieDailyStart', { name: firstName, greeting })
    : t('hoy.ellieDailyStartNoName', { greeting });

  const returningMessage = firstName
    ? t('hoy.ellieMiddayAsk', { name: firstName })
    : t('hoy.ellieMiddayAskNoName');

  const energyKey =
    energyBand(energyLevel) === 'low'
      ? 'hoy.ellieEnergyLow'
      : energyBand(energyLevel) === 'high'
        ? 'hoy.ellieEnergyHigh'
        : 'hoy.ellieEnergyOk';
  const mindKey =
    mindBand(focusLevel) === 'foggy'
      ? 'hoy.ellieMindFoggy'
      : mindBand(focusLevel) === 'cloudy'
        ? 'hoy.ellieMindCloudy'
        : mindBand(focusLevel) === 'clear'
          ? 'hoy.ellieMindClear'
          : 'hoy.ellieMindOk';

  const summary = t('hoy.ellieCheckInSummary', {
    emotion: emotionLabel || t('hoy.ellieFeelingUnnamed'),
    energy: t(energyKey),
    mind: t(mindKey),
  });

  const adaptingMessage = buildEllieAdaptMessage({
    emotionLabel,
    energyLevel,
    focusLevel,
    hasTasks: true,
    gotYou: t('hoy.ellieGotYou'),
    summary,
    lighter: t('hoy.ellieMakeLighter'),
    freeDay: t('hoy.ellieFreeDayAsk'),
  });

  const freeDayMessage = buildEllieAdaptMessage({
    emotionLabel,
    energyLevel,
    focusLevel,
    hasTasks: false,
    gotYou: t('hoy.ellieGotYou'),
    summary,
    lighter: t('hoy.ellieMakeLighter'),
    freeDay: t('hoy.ellieFreeDayAsk'),
  });

  const returnProposeMessage = buildEllieAdaptMessage({
    emotionLabel,
    energyLevel,
    focusLevel,
    hasTasks: true,
    gotYou: t('hoy.ellieGotYou'),
    summary,
    lighter: t('hoy.ellieReturnFeelRight'),
    freeDay: t('hoy.ellieReturnFeelRight'),
  });

  const portrait =
    hasCheckIn && (emotionKey || emotionLabel)
      ? resolveEllieCompanionCue(emotionKey || emotionLabel, energyLevel, {
          planEmpty: false,
          allFocusDone: dailyState === 'plan_done',
        })
      : resolveElliePresence('hoy_idle');

  const voice = resolveEllieDayVoice({
    dailyState,
    middayStep,
    notStartedMessage,
    returningMessage,
    okayNextMessage:
      dailyState === 'evening'
        ? t('hoy.ellieNightFocus')
        : t('hoy.ellieOkayKeepGoing'),
    changedAskMessage: t('hoy.ellieChangedAsk'),
    adjustMessage: t('hoy.ellieAdjustGotIt'),
    mindGoMessage: t('hoy.ellieMindPlace'),
    proposeMessage: returnProposeMessage,
    adaptingMessage,
    freeDayMessage,
    inProgressMessage: t('hoy.ellieLighterPlan'),
    moodUpdatedMessage: t('hoy.ellieMoodLighter'),
    planDoneMessage: t('hoy.elliePlanDone'),
    planDoneClosedMessage: t('hoy.elliePlanDoneClosed'),
    planCloseAccepted,
    eveningMessage: hasNightLeftovers ? nightAskMessage : nightClearMessage,
    nightCloseMessage: hasNightLeftovers ? t('hoy.ellieNightCallIt') : nightClearMessage,
    dayClosedMessage: t('hoy.ellieDayClosed'),
  });

  const message = voice.message;
  const mood = ellieMoodForDailyState(dailyState, middayStep, portrait.mood);
  const showFeelingCaption = hasCheckIn && Boolean(emotionLabel);

  const feelingUpdate =
    hasCheckIn && !showStartCheckIn && !routing ? (
      <TouchableOpacity
        onPress={onUpdateFeel}
        delayPressIn={0}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={
          emotionLabel
            ? t('hoy.feelHeroFeelingChip', { emotion: emotionLabel })
            : t('hoy.feelHeroTapUpdate')
        }
        accessibilityHint={t('hoy.feelHeroTapUpdate')}
      >
        <Text style={styles.feelingChip}>
          {emotionLabel ? t('hoy.feelHeroTapToChange') : t('hoy.feelHeroTapUpdate')}
        </Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View style={styles.companionBlock}>
      <OnboardingEllieCoach
        message={message}
        mood={mood}
        moodCaption={showFeelingCaption ? emotionLabel : t(ELLIE_MOOD_NOTE[mood])}
        moodCaptionAccent={showFeelingCaption}
        size={80}
        withBottomGap={false}
        accessible={false}
      />
      {feelingUpdate}
      {showStartCheckIn ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.feelHeroStartCheckIn')}
            variant="soft"
            onPress={onUpdateFeel}
          />
        </View>
      ) : null}
      {routing ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieMiddayOkay')}
            variant="soft"
            onPress={() => onMiddayOkay?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieMiddayChanged')}
            variant="soft"
            onPress={() => onMiddayDayChanged?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieMiddayMind')}
            variant="soft"
            onPress={() => onMiddayMind?.()}
          />
        </View>
      ) : null}
      {showChangedAsk ? (
        <View style={styles.middayActions}>
          {CHANGED_REASON_OPTIONS.map((option) => (
            <CalmPrimaryButton
              key={option.key}
              label={t(option.key)}
              variant="soft"
              onPress={() => onMiddayChangedConfirm?.(option.reason)}
            />
          ))}
        </View>
      ) : null}
      {showReturnPropose ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieReturnAccept')}
            variant="soft"
            onPress={() => onReturnAccept?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieReturnEdit')}
            variant="soft"
            onPress={() => onReturnEdit?.()}
          />
        </View>
      ) : null}
      {showAdaptActions ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieSeeMyPlan')}
            variant="soft"
            onPress={() => onAdaptLooksGood?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieEditMyDay')}
            variant="soft"
            onPress={() => onAdaptEdit?.()}
          />
        </View>
      ) : null}
      {showFreeActions ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieFreeRest')}
            variant="soft"
            onPress={() => onFreeRest?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieFreeEmpty')}
            variant="soft"
            onPress={() => onFreeEmpty?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieFreeExplore')}
            variant="soft"
            onPress={() => onFreeExplore?.()}
          />
        </View>
      ) : null}
      {showPlanDoneActions ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieFreeEmpty')}
            variant="soft"
            onPress={() => onPlanDoneEmpty?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieFreeRest')}
            variant="soft"
            onPress={() => onPlanDoneRest?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.elliePlanDoneSeeYou')}
            variant="soft"
            onPress={() => onPlanDoneSeeYou?.()}
          />
        </View>
      ) : null}
      {showMoodActions ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieMoodReplan')}
            variant="soft"
            onPress={() => onMoodReplan?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieMoodKeep')}
            variant="soft"
            onPress={() => onMoodKeep?.()}
          />
        </View>
      ) : null}
      {showNightAsk ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieNightUrgentYes')}
            variant="soft"
            onPress={() => onNightUrgent?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieNightUrgentNo')}
            variant="soft"
            onPress={() => onNightNotUrgent?.()}
          />
        </View>
      ) : null}
      {showNightClose ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieNightDone')}
            variant="soft"
            onPress={() => onNightDone?.()}
          />
          {hasNightLeftovers ? (
            <CalmPrimaryButton
              label={t('hoy.ellieNightSeeLeft')}
              variant="soft"
              onPress={() => onNightSeeLeft?.()}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  companionBlock: {
    gap: THEME.spacing.xs,
  },
  feelingChip: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.xs,
    paddingTop: 2,
    paddingBottom: 4,
  },
  middayActions: {
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
  },
});
