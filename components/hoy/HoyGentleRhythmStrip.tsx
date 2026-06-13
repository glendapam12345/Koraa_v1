import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wind, Moon, Pause, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import { Toast } from '@/components/Toast';
import { useHoyMeditation } from '@/hooks/useHoyMeditation';
import { getSituationalMeditationType } from '@/lib/meditationSituational';
import {
  getGentleRhythmState,
  type RhythmChipId,
  type RhythmHintKey,
} from '@/lib/hoyGentleRhythm';

const BREAK_COUNT = 2;

type HoyGentleRhythmStripProps = {
  crisisMode: boolean;
  energyLevel: number;
  prioritiesDone: number;
  prioritiesTotal: number;
  allFocusDone: boolean;
};

const HINT_KEYS: Record<RhythmHintKey, TranslationKey> = {
  default: 'hoy.rhythmSubDefault',
  afterStep: 'hoy.rhythmSubAfterStep',
  morning: 'hoy.rhythmSubMorning',
  care: 'hoy.rhythmSubCare',
  allDone: 'hoy.rhythmSubAllDone',
};

const CHIP_LABELS: Record<RhythmChipId, TranslationKey> = {
  breathe: 'hoy.rhythmChipBreathe',
  meditate: 'hoy.rhythmChipMeditate',
  pause: 'hoy.rhythmChipPause',
};

const CHIP_A11Y: Record<RhythmChipId, TranslationKey> = {
  breathe: 'hoy.planBreakBreatheA11y',
  meditate: 'hoy.planBreakMeditateA11y',
  pause: 'hoy.supportChipPauseA11y',
};

export function HoyGentleRhythmStrip({
  crisisMode,
  energyLevel,
  prioritiesDone,
  prioritiesTotal,
  allFocusDone,
}: HoyGentleRhythmStripProps) {
  const { t } = useI18n();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setShowConfetti] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const {
    showMeditation,
    setShowMeditation,
    meditationType,
    morningMeditationDone,
    eveningMeditationDone,
    loadMeditations,
    handleMeditationComplete,
    handleStartMeditation,
  } = useHoyMeditation({ showToast, setShowConfetti, confettiTimeoutRef });

  useEffect(() => {
    void loadMeditations();
  }, [loadMeditations]);

  const rhythm = useMemo(
    () =>
      getGentleRhythmState({
        crisisMode,
        energyLevel,
        prioritiesDone,
        prioritiesTotal,
        morningMeditationDone,
        eveningMeditationDone,
        allFocusDone,
      }),
    [
      allFocusDone,
      crisisMode,
      energyLevel,
      eveningMeditationDone,
      morningMeditationDone,
      prioritiesDone,
      prioritiesTotal,
    ],
  );

  const openBreathe = () => {
    router.push({ pathname: '/focus-session', params: { minutes: '5' } });
  };

  const openMeditate = () => {
    const type = getSituationalMeditationType(morningMeditationDone, eveningMeditationDone);
    handleStartMeditation(type);
  };

  const openPause = () => {
    router.push({ pathname: '/focus-session', params: { minutes: '5' } });
  };

  const openParaMi = () => {
    router.push('/(tabs)/parami');
  };

  const onChipPress = (id: RhythmChipId) => {
    switch (id) {
      case 'breathe':
        openBreathe();
        break;
      case 'meditate':
        openMeditate();
        break;
      case 'pause':
        openPause();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('hoy.rhythmTitle')}</Text>
          <Text style={styles.countLine}>{t('hoy.rhythmSubCount', { count: BREAK_COUNT })}</Text>
          <Text style={styles.subtitle}>{t(HINT_KEYS[rhythm.hintKey])}</Text>
        </View>

        <View style={styles.chipsRow}>
          {rhythm.visibleChips.map((chipId) => (
            <RhythmChip
              key={chipId}
              chipId={chipId}
              label={t(CHIP_LABELS[chipId])}
              a11y={t(CHIP_A11Y[chipId])}
              highlighted={rhythm.highlightedChip === chipId}
              done={rhythm.doneChips.includes(chipId)}
              onPress={() => onChipPress(chipId)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.moreTipsRow}
          onPress={openParaMi}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.rhythmMoreTipsA11y')}
        >
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.moreTipsText}>{t('hoy.rhythmMoreTips')}</Text>
          <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      </View>

      {showMeditation ? (
        <MeditationCircleSimple
          visible={showMeditation}
          onComplete={handleMeditationComplete}
          onClose={() => setShowMeditation(false)}
          type={meditationType}
        />
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} type="success" onHide={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

function RhythmChip({
  chipId,
  label,
  a11y,
  highlighted,
  done,
  onPress,
}: {
  chipId: RhythmChipId;
  label: string;
  a11y: string;
  highlighted: boolean;
  done: boolean;
  onPress: () => void;
}) {
  const Icon =
    chipId === 'breathe' ? Wind : chipId === 'meditate' ? Moon : Pause;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        highlighted && styles.chipHighlighted,
        done && !highlighted && styles.chipDone,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected: highlighted }}
    >
      {done ? (
        <Check size={14} color={THEME.colors.calm.lavenderDeep} />
      ) : (
        <Icon
          size={14}
          color={highlighted ? THEME.colors.calm.lavenderDeep : THEME.colors.text.secondary}
        />
      )}
      <Text
        style={[
          styles.chipLabel,
          highlighted && styles.chipLabelHighlighted,
          done && styles.chipLabelDone,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  header: {
    gap: 2,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  countLine: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  chip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  chipHighlighted: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 1.5,
  },
  chipDone: {
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  chipLabel: {
    ...THEME.typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  chipLabelHighlighted: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  chipLabelDone: {
    color: THEME.colors.calm.lavenderDeep,
  },
  moreTipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
  },
  moreTipsText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
  },
});
