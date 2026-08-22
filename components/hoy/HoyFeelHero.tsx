import { type ReactNode, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { OnboardingEllieCoach } from '@/components/onboarding/OnboardingEllieCoach';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { resolveEllieDayVoice, type EllieMiddayStep } from '@/lib/ellieDayVoice';
import type { HoyEllieDailyState } from '@/lib/hoyEllieDailyState';
import { buildEllieAdaptMessage, energyBand, mindBand, timeBand } from '@/lib/ellieCheckInInterpret';
import {
  resolveEllieCompanionCue,
  resolveElliePresence,
  type EllieMood,
} from '@/lib/elliePersonality';
import type { TranslationKey } from '@/lib/i18n';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';

const NIGHT_LEFTOVER_PREVIEW_MAX = 5;
const NIGHT_LEFTOVER_TITLE_MAX = 56;

export type NightLeftoverItem = {
  id: string;
  content: string;
};

function truncateNightTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= NIGHT_LEFTOVER_TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, NIGHT_LEFTOVER_TITLE_MAX - 1).trimEnd()}…`;
}

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
  leftoverCount?: number;
  /** Pasos pendientes de hoy (noche): id + título. */
  leftoverItems?: NightLeftoverItem[];
  /** @deprecated Prefer leftoverItems */
  leftoverTitles?: string[];
  hasSuggestedSteps?: boolean;
  isReturningLater?: boolean;
  emotionLabel?: string;
  emotionKey?: string;
  energyLevel?: number;
  focusLevel?: string;
  availableTime?: string;
  displayName?: string;
  middayStep?: EllieMiddayStep;
  nightOutcome?: 'done' | 'some' | null;
  onUpdateFeel: () => void;
  onMiddayOkay?: () => void;
  onMiddayShowPlan?: () => void;
  onOkayChangePlan?: () => void;
  onMiddayDayChanged?: () => void;
  onMiddayChangedConfirm?: (reason?: WhatChangedReason) => void;
  onMiddayMind?: () => void;
  onMiddayEmptyHead?: () => void;
  onReturnAccept?: () => void;
  onReturnEdit?: () => void;
  onConfirmFeel?: () => void;
  onAdaptLooksGood?: () => void;
  onAdaptEdit?: () => void;
  onAdaptAdd?: () => void;
  planPreview?: ReactNode;
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
  onNightDid?: () => void;
  onNightSome?: () => void;
  onNightPickConfirm?: (doneTaskIds: string[]) => void;
  onNightPickBack?: () => void;
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
  hasTasks = true,
  hasNightLeftovers = false,
  leftoverCount = 0,
  leftoverItems = [],
  leftoverTitles = [],
  hasSuggestedSteps = false,
  emotionLabel = '',
  emotionKey = '',
  energyLevel = 0,
  focusLevel = '',
  availableTime = '',
  displayName = '',
  middayStep = 'ask',
  nightOutcome = null,
  onUpdateFeel,
  onMiddayOkay,
  onMiddayShowPlan,
  onOkayChangePlan,
  onMiddayDayChanged,
  onMiddayChangedConfirm,
  onMiddayMind,
  onMiddayEmptyHead,
  onReturnAccept,
  onReturnEdit,
  onConfirmFeel,
  onAdaptLooksGood,
  onAdaptEdit,
  onAdaptAdd,
  planPreview,
  onFreeRest,
  onFreeEmpty,
  onFreeExplore: _onFreeExplore,
  planCloseAccepted = false,
  onPlanDoneEmpty,
  onPlanDoneRest,
  onPlanDoneSeeYou,
  onMoodReplan,
  onMoodKeep,
  onNightUrgent,
  onNightDid,
  onNightSome,
  onNightPickConfirm,
  onNightPickBack,
  onNightDone,
  onNightSeeLeft,
}: HoyFeelHeroProps) {
  const { t } = useI18n();
  const { greeting, period } = useKoraaGreeting();
  const firstName = getFirstName(displayName);
  const afternoonOpen = period === 'afternoon' || period === 'evening';
  const leadWithEmpty = afternoonOpen || mindBand(focusLevel) === 'foggy';

  const resolvedLeftovers: NightLeftoverItem[] =
    leftoverItems.length > 0
      ? leftoverItems
      : leftoverTitles.map((content, index) => ({ id: `legacy-${index}`, content }));

  const [pickedDoneIds, setPickedDoneIds] = useState<string[]>([]);

  const routing = dailyState === 'returning' && middayStep === 'ask';
  const showOkayNext = dailyState === 'returning' && middayStep === 'okayNext';
  const showMind = dailyState === 'returning' && middayStep === 'mind';
  const showChangedAsk = dailyState === 'returning' && middayStep === 'changedAsk';
  const showReturnPropose = dailyState === 'returning' && middayStep === 'propose';
  const showAdaptReview = dailyState === 'adapting' && middayStep !== 'propose';
  const showAdaptPreview = dailyState === 'adapting' && middayStep === 'propose';
  const showFreeActions = dailyState === 'free_day';
  const showPlanDoneActions = dailyState === 'plan_done' && !planCloseAccepted;
  const showPlanDoneClosedActions = dailyState === 'plan_done' && planCloseAccepted;
  const showStartCheckIn = dailyState === 'not_started';
  const showEmptyStart = showStartCheckIn && !hasTasks;
  const showMoodActions = dailyState === 'mood_updated';
  const showNightAsk = dailyState === 'evening' && middayStep === 'ask' && hasNightLeftovers;
  const showNightPick = dailyState === 'evening' && middayStep === 'nightPick' && hasNightLeftovers;
  const showNightClose =
    dailyState === 'evening' &&
    (middayStep === 'nightClose' || (middayStep === 'ask' && !hasNightLeftovers));
  const hideFeelingChip =
    routing ||
    showOkayNext ||
    showMind ||
    showChangedAsk ||
    (dailyState === 'returning' && middayStep === 'adjust') ||
    showNightAsk ||
    showNightPick;

  useEffect(() => {
    if (showNightPick) {
      setPickedDoneIds([]);
    }
  }, [showNightPick]);

  const togglePickedDone = (taskId: string) => {
    setPickedDoneIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  const nightClearMessage = firstName
    ? t('hoy.ellieNightClear', { name: firstName })
    : t('hoy.ellieNightClearNoName');
  const nightAskMessage = firstName
    ? t('hoy.ellieNightAsk', { name: firstName })
    : t('hoy.ellieNightAskNoName');

  const notStartedMessage = showEmptyStart
    ? [
        firstName
          ? t('hoy.ellieNoPending', { name: firstName })
          : t('hoy.ellieNoPendingNoName'),
        t('hoy.ellieNoPendingHowFeel'),
      ].join('\n')
    : firstName
      ? t('hoy.ellieDailyStart', { name: firstName, greeting })
      : t('hoy.ellieDailyStartNoName', { greeting });

  const returningMessage = afternoonOpen
    ? firstName
      ? t('hoy.ellieMiddayAskAfternoon', { name: firstName, greeting })
      : t('hoy.ellieMiddayAskNoNameAfternoon', { greeting })
    : firstName
      ? t('hoy.ellieMiddayAsk', { name: firstName, greeting })
      : t('hoy.ellieMiddayAskNoName', { greeting });

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

  const timeKey =
    timeBand(availableTime) === 'little'
      ? 'hoy.ellieTimeLittle'
      : timeBand(availableTime) === 'plenty'
        ? 'hoy.ellieTimePlenty'
        : timeBand(availableTime) === 'allDay'
          ? 'hoy.ellieTimeAllDay'
          : 'hoy.ellieTimeSome';

  const summaryKey = afternoonOpen
    ? period === 'evening'
      ? 'hoy.ellieCheckInSummaryEvening'
      : 'hoy.ellieCheckInSummaryAfternoon'
    : 'hoy.ellieCheckInSummary';
  const summary = t(summaryKey, {
    emotion: emotionLabel || t('hoy.ellieFeelingUnnamed'),
    energy: t(energyKey),
    mind: t(mindKey),
    time: t(timeKey),
  });

  const adaptingMessage = buildEllieAdaptMessage({
    emotionLabel,
    energyLevel,
    focusLevel,
    hasTasks: true,
    gotYou: t('hoy.ellieGotYou'),
    summary,
    lighter: t('hoy.ellieReturnFeelRight'),
    freeDay: t(afternoonOpen ? 'hoy.ellieFreeAfternoonAsk' : 'hoy.ellieFreeDayAsk'),
  });

  const overwhelmed =
    /overwhelm|ansio|anxious|agotad/i.test(`${emotionKey} ${emotionLabel}`) ||
    energyBand(energyLevel) === 'low';
  const adaptPreviewMessage = [
    t('hoy.ellieSeeWhatFits'),
    overwhelmed ? t('hoy.ellieKeepLighter') : t('hoy.ellieEnoughEnergy'),
  ].join('\n');

  const freeDayMessage = buildEllieAdaptMessage({
    emotionLabel,
    energyLevel,
    focusLevel,
    hasTasks: false,
    gotYou: t('hoy.ellieGotYou'),
    summary,
    lighter: t('hoy.ellieMakeLighter'),
    freeDay: t(afternoonOpen ? 'hoy.ellieFreeAfternoonAsk' : 'hoy.ellieFreeDayAsk'),
  });

  const returnProposeMessage = hasSuggestedSteps
    ? [t('hoy.ellieGotYouShort'), t('hoy.ellieHereAreTodaysSteps')].join('\n')
    : [t('hoy.ellieGotYouShort'), t('hoy.ellieRestOfTodayLighter')].join('\n');

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
        : hasSuggestedSteps
          ? t('hoy.ellieOkayKeepGoing')
          : t(afternoonOpen ? 'hoy.ellieFreeAfternoonAsk' : 'hoy.ellieMiddayEmptyPlan'),
    changedAskMessage: t('hoy.ellieChangedAsk'),
    adjustMessage: t('hoy.ellieAdjustGotIt'),
    mindGoMessage: t('hoy.ellieListening'),
    proposeMessage: returnProposeMessage,
    adaptPreviewMessage,
    adaptingMessage,
    freeDayMessage,
    inProgressMessage: t('hoy.ellieHereIfChanges'),
    moodUpdatedMessage: t('hoy.ellieMoodLighter'),
    planDoneMessage: t('hoy.elliePlanDone'),
    planDoneClosedMessage: t('hoy.elliePlanDoneClosed'),
    planCloseAccepted,
    eveningMessage: hasNightLeftovers
      ? [
          nightAskMessage,
          leftoverCount === 1
            ? t('hoy.ellieNightLeftOne')
            : t('hoy.ellieNightLeftMany', { count: leftoverCount }),
          leftoverCount === 1 ? t('hoy.ellieNightDidIt') : t('hoy.ellieNightDidAny'),
        ].join('\n')
      : nightClearMessage,
    nightCloseMessage: hasNightLeftovers ? t('hoy.ellieNightCanWait') : nightClearMessage,
    nightPickMessage: t('hoy.ellieNightPickWhich'),
    dayClosedMessage:
      nightOutcome === 'some'
        ? t('hoy.ellieNightMovedForward')
        : t('hoy.ellieYouDidEnough'),
  });

  const message = voice.message;
  const mood = ellieMoodForDailyState(dailyState, middayStep, portrait.mood);
  const showFeelingCaption = hasCheckIn && Boolean(emotionLabel);
  const canTapElliePortrait =
    showStartCheckIn || (hasCheckIn && !hideFeelingChip);

  const elliePortraitHint = canTapElliePortrait
    ? showStartCheckIn
      ? t('hoy.feelHeroEllieTapStart')
      : t('hoy.feelHeroTapToChange')
    : undefined;

  const elliePortraitA11yLabel = canTapElliePortrait
    ? showStartCheckIn
      ? t('hoy.feelHeroEllieTapStart')
      : emotionLabel
        ? t('hoy.feelHeroFeelingChip', { emotion: emotionLabel })
        : t('hoy.feelHeroTapUpdate')
    : undefined;

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
        onPortraitPress={canTapElliePortrait ? onUpdateFeel : undefined}
        portraitHint={elliePortraitHint}
        portraitA11yLabel={elliePortraitA11yLabel}
        portraitA11yHint={t('hoy.feelHeroTapUpdate')}
      />
      {planPreview ? <View style={styles.planPreview}>{planPreview}</View> : null}
      {showStartCheckIn ? (
        <View style={styles.middayActions}>
          {showEmptyStart ? (
            <>
              <CalmPrimaryButton
                label={t('hoy.ellieCheckInWithMe')}
                variant="soft"
                onPress={onUpdateFeel}
              />
              <CalmPrimaryButton
                label={t('hoy.ellieMiddayEmptyHead')}
                variant="soft"
                onPress={() => onFreeEmpty?.()}
              />
              <CalmPrimaryButton
                label={t('hoy.ellieWantRest')}
                variant="soft"
                onPress={() => onFreeRest?.()}
              />
            </>
          ) : (
            <CalmPrimaryButton
              label={t('hoy.feelHeroStartCheckIn')}
              variant="soft"
              onPress={onUpdateFeel}
            />
          )}
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
      {showOkayNext ? (
        <View style={styles.middayActions}>
          {hasSuggestedSteps ? (
            <>
              <CalmPrimaryButton
                label={t('hoy.ellieMiddayShowPlan')}
                variant="soft"
                onPress={() => onMiddayShowPlan?.()}
              />
              <CalmPrimaryButton
                label={t('hoy.ellieWantChangeSomething')}
                variant="soft"
                onPress={() => onOkayChangePlan?.()}
              />
            </>
          ) : (
            <>
              <CalmPrimaryButton
                label={t('hoy.ellieFreeEmpty')}
                variant="soft"
                onPress={() => onFreeEmpty?.()}
              />
              <CalmPrimaryButton
                label={t('hoy.ellieFreeRest')}
                variant="soft"
                onPress={() => onFreeRest?.()}
              />
            </>
          )}
        </View>
      ) : null}
      {showMind ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieMiddayEmptyHead')}
            variant="soft"
            onPress={() => onMiddayEmptyHead?.()}
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
            label={t('hoy.ellieLooksGood')}
            variant="soft"
            onPress={() => onReturnAccept?.()}
          />
          {hasSuggestedSteps ? (
            <CalmPrimaryButton
              label={t('hoy.ellieAdjustTodaysSteps')}
              variant="soft"
              onPress={() => onReturnEdit?.()}
            />
          ) : null}
        </View>
      ) : null}
      {showAdaptReview ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieYesFeelsRight')}
            variant="soft"
            onPress={() => onConfirmFeel?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieLetMeChange')}
            variant="soft"
            onPress={onUpdateFeel}
          />
        </View>
      ) : null}
      {showAdaptPreview ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieLooksGood')}
            variant="soft"
            onPress={() => onAdaptLooksGood?.()}
          />
          {hasSuggestedSteps ? (
            <CalmPrimaryButton
              label={t('hoy.ellieAdjustTodaysSteps')}
              variant="soft"
              onPress={() => onAdaptEdit?.()}
            />
          ) : null}
        </View>
      ) : null}
      {showFreeActions ? (
        <View style={styles.middayActions}>
          {leadWithEmpty ? (
            <>
              <CalmPrimaryButton
                label={t('hoy.ellieFreeEmpty')}
                variant="soft"
                onPress={() => onFreeEmpty?.()}
              />
              <CalmPrimaryButton
                label={t('hoy.ellieFreeRest')}
                variant="soft"
                onPress={() => onFreeRest?.()}
              />
            </>
          ) : (
            <>
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
            </>
          )}
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
      {showPlanDoneClosedActions ? (
        <View style={styles.middayActions}>
          <CalmPrimaryButton
            label={t('hoy.ellieAddSomething')}
            variant="soft"
            onPress={() => onPlanDoneEmpty?.()}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieFreeRest')}
            variant="soft"
            onPress={() => onPlanDoneRest?.()}
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
          {resolvedLeftovers.length > 0 ? (
            <View
              style={styles.nightLeftovers}
              accessible
              accessibilityLabel={t('hoy.ellieNightLeftoversA11y', {
                count: leftoverCount || resolvedLeftovers.length,
              })}
            >
              {resolvedLeftovers.slice(0, NIGHT_LEFTOVER_PREVIEW_MAX).map((item) => (
                <Text key={item.id} style={styles.nightLeftoverItem}>
                  · {truncateNightTitle(item.content)}
                </Text>
              ))}
              {(leftoverCount || resolvedLeftovers.length) > NIGHT_LEFTOVER_PREVIEW_MAX ? (
                <Text style={styles.nightLeftoverMore}>
                  {t('hoy.ellieNightLeftoversMore', {
                    count: (leftoverCount || resolvedLeftovers.length) - NIGHT_LEFTOVER_PREVIEW_MAX,
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}
          <CalmPrimaryButton
            label={
              leftoverCount === 1 ? t('hoy.ellieNightIDidOne') : t('hoy.ellieNightIDidMany')
            }
            variant="soft"
            onPress={() => onNightDid?.()}
          />
          {leftoverCount !== 1 ? (
            <CalmPrimaryButton
              label={t('hoy.ellieNightSome')}
              variant="soft"
              onPress={() => onNightSome?.()}
            />
          ) : null}
          <CalmPrimaryButton
            label={t('hoy.ellieNightNotYet')}
            variant="soft"
            onPress={() => onNightUrgent?.()}
          />
        </View>
      ) : null}
      {showNightPick ? (
        <View style={styles.middayActions}>
          <View
            style={styles.nightLeftovers}
            accessible
            accessibilityLabel={t('hoy.ellieNightPickA11y')}
          >
            <Text style={styles.nightPickHint}>{t('hoy.ellieNightPickHint')}</Text>
            {resolvedLeftovers.map((item) => {
              const selected = pickedDoneIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.nightPickRow, selected && styles.nightPickRowSelected]}
                  onPress={() => togglePickedDone(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={item.content}
                >
                  <View style={[styles.nightPickCheck, selected && styles.nightPickCheckOn]}>
                    {selected ? (
                      <Check size={14} color={THEME.colors.fill[100]} strokeWidth={2.5} />
                    ) : null}
                  </View>
                  <Text style={styles.nightPickLabel} numberOfLines={2}>
                    {truncateNightTitle(item.content)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <CalmPrimaryButton
            label={
              pickedDoneIds.length === 0
                ? t('hoy.ellieNightPickNone')
                : t('hoy.ellieNightPickConfirm', { count: pickedDoneIds.length })
            }
            variant="soft"
            onPress={() => onNightPickConfirm?.(pickedDoneIds)}
          />
          <CalmPrimaryButton
            label={t('hoy.ellieNightPickBack')}
            variant="soft"
            onPress={() => onNightPickBack?.()}
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
  planPreview: {
    gap: THEME.spacing.xs,
  },
  middayActions: {
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
  },
  nightLeftovers: {
    gap: 4,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  nightLeftoverItem: {
    ...THEME.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.colors.text.main,
  },
  nightLeftoverMore: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  nightPickHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  nightPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: THEME.borderRadius.standard,
  },
  nightPickRowSelected: {
    backgroundColor: THEME.colors.fill[100],
  },
  nightPickCheck: {
    width: 22,
    height: 22,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1.5,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
  nightPickCheckOn: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  nightPickLabel: {
    ...THEME.typography.body,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.colors.text.main,
  },
});
