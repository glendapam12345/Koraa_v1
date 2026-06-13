import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Moon, Sun, Wind, Music, Pause, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import {
  getHoyCalmMomentPeriod,
  shouldShowSleepHealthExtras,
  type HoyCalmMomentPeriod,
} from '@/lib/hoySleepContext';
import { executeTipAction } from '@/lib/tipActions';
import { openTipsCategory as navigateToTipsCategory } from '@/lib/tipsNavigation';
import { useHoyMeditation } from '@/hooks/useHoyMeditation';
import { getSituationalMeditationType } from '@/lib/meditationSituational';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import { Toast } from '@/components/Toast';

type HoySleepCardProps = {
  energyLevel: number;
  emotionKey: string;
  available: boolean;
  connected: boolean;
  lastNightHours: number | null;
  shortSleep: boolean;
  onConnect: () => void;
  onOpenSleep: () => void;
};

const PERIOD_TITLE_KEYS: Record<
  HoyCalmMomentPeriod,
  'hoy.calmMomentMorningTitle' | 'hoy.calmMomentAfternoonTitle' | 'hoy.calmMomentEveningTitle'
> = {
  morning: 'hoy.calmMomentMorningTitle',
  afternoon: 'hoy.calmMomentAfternoonTitle',
  evening: 'hoy.calmMomentEveningTitle',
};

export function HoySleepCard({
  energyLevel,
  emotionKey,
  available,
  connected,
  lastNightHours,
  shortSleep,
  onConnect,
  onOpenSleep,
}: HoySleepCardProps) {
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

  const period = getHoyCalmMomentPeriod();
  const showSleepHealth = shouldShowSleepHealthExtras(energyLevel, emotionKey, period) && available;

  const startMeditation = useCallback(() => {
    const type = getSituationalMeditationType(morningMeditationDone, eveningMeditationDone);
    handleStartMeditation(type);
  }, [eveningMeditationDone, handleStartMeditation, morningMeditationDone]);

  const openMusic = useCallback(() => {
    void executeTipAction('apple_music', t);
  }, [t]);

  const openBreathe = useCallback(() => {
    navigateToTipsCategory(router, 'mindset', { emotion: emotionKey, energyLevel });
  }, [emotionKey, energyLevel]);

  const startPause = useCallback(() => {
    router.push({ pathname: '/focus-session', params: { minutes: '5' } });
  }, []);

  const openMoreTips = useCallback(() => {
    const category = period === 'evening' ? 'rest' : 'mindset';
    navigateToTipsCategory(router, category, { emotion: emotionKey, energyLevel });
  }, [emotionKey, energyLevel, period]);

  const PeriodIcon = period === 'morning' ? Sun : period === 'afternoon' ? Wind : Moon;

  const handleHealthPrimary = () => {
    if (connected) {
      onOpenSleep();
      return;
    }
    onConnect();
  };

  const title = t(PERIOD_TITLE_KEYS[period]);

  return (
    <>
      <View style={styles.strip} accessibilityRole="summary" accessibilityLabel={title}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <PeriodIcon size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.moreTips}
            onPress={openMoreTips}
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={t('hoy.supportMoreTips')}
            hitSlop={8}
          >
            <Text style={styles.moreTipsText}>{t('hoy.calmMomentMoreShort')}</Text>
            <ChevronRight size={12} color={THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {period === 'evening' ? (
            <MiniAction
              icon={<Music size={13} color={THEME.colors.calm.lavenderDeep} />}
              label={t('hoy.calmMomentMusicShort')}
              onPress={openMusic}
              a11y={t('hoy.calmMomentMusicA11y')}
            />
          ) : (
            <MiniAction
              icon={<Wind size={13} color={THEME.colors.calm.lavenderDeep} />}
              label={t('hoy.calmMomentBreatheShort')}
              onPress={openBreathe}
              a11y={t('hoy.supportChipBreatheA11y')}
            />
          )}
          <MiniAction
            icon={<Moon size={13} color={THEME.colors.calm.lavenderDeep} />}
            label={t('hoy.calmMomentMeditateShort')}
            onPress={startMeditation}
            a11y={t('hoy.supportChipMeditateA11y')}
          />
          <MiniAction
            icon={<Pause size={13} color={THEME.colors.calm.lavenderDeep} />}
            label={t('hoy.supportChipPause')}
            onPress={startPause}
            a11y={t('hoy.supportChipPauseA11y')}
          />
        </View>
      </View>

      {showSleepHealth ? (
        <TouchableOpacity
          onPress={handleHealthPrimary}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            connected ? t('hoy.sleepCardCtaHealthA11y') : t('hoy.sleepCardCtaConnectA11y')
          }
          hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
        >
          <Text style={styles.healthLink}>
            {connected && lastNightHours != null
              ? t(shortSleep ? 'hoy.sleepCardShortSleepBody' : 'hoy.sleepCardSleepDataBody', {
                  hours: lastNightHours,
                })
              : connected
                ? t('hoy.sleepCardCtaHealth')
                : t('hoy.sleepCardCtaConnect')}
          </Text>
        </TouchableOpacity>
      ) : null}

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

function MiniAction({
  icon,
  label,
  onPress,
  a11y,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      style={styles.miniBtn}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      {icon}
      <Text style={styles.miniLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.caption,
    fontSize: 13,
    lineHeight: 17,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
  moreTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    flexShrink: 0,
  },
  moreTipsText: {
    ...THEME.typography.meta,
    fontSize: 11,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  miniLabel: {
    ...THEME.typography.meta,
    fontSize: 11,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  healthLink: {
    ...THEME.typography.meta,
    fontSize: 11,
    lineHeight: 15,
    color: THEME.colors.text.secondary,
    textDecorationLine: 'underline',
    marginTop: 2,
    paddingHorizontal: THEME.spacing.xs,
  },
});
