import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Wind, Moon, Pause } from 'lucide-react-native';
import { router } from 'expo-router';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getHoyContextualSupport } from '@/lib/hoyContextualSupport';
import { useCheckInInsightsData } from '@/hooks/useCheckInInsightsData';
import { subscribeCheckInRefresh } from '@/lib/checkInRefresh';
import { useHoyMeditation } from '@/hooks/useHoyMeditation';
import { getSituationalMeditationType } from '@/lib/meditationSituational';
import { MeditationCircleSimple } from '@/components/MeditationCircleSimple';
import { Toast } from '@/components/Toast';

const WEEK_INSIGHT_DAYS = 7;
const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type HoySupportPanelProps = {
  userId?: string;
  emotionKey: string;
  emotionLabel: string;
  energyLevel: number;
};

export function HoySupportPanel({
  userId,
  emotionKey,
  emotionLabel,
  energyLevel,
}: HoySupportPanelProps) {
  const { t, locale } = useI18n();
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

  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const dayLabels = useMemo(
    () =>
      [
        t('yo.dayShortSun'),
        t('yo.dayShortMon'),
        t('yo.dayShortTue'),
        t('yo.dayShortWed'),
        t('yo.dayShortThu'),
        t('yo.dayShortFri'),
        t('yo.dayShortSat'),
      ] as const,
    [t],
  );

  const { progressData, load: loadWeekInsights } = useCheckInInsightsData(monthNames, dayLabels, {
    progressDays: WEEK_INSIGHT_DAYS,
    includeHistory: false,
  });

  const reloadInsights = useCallback(() => {
    void loadMeditations();
    if (!userId) return;
    void loadWeekInsights(userId);
  }, [loadMeditations, loadWeekInsights, userId]);

  useEffect(() => {
    reloadInsights();
  }, [reloadInsights]);

  useEffect(() => subscribeCheckInRefresh(reloadInsights), [reloadInsights]);

  const weekData = useMemo(() => progressData.slice(-WEEK_INSIGHT_DAYS), [progressData]);

  const content = useMemo(
    () => getHoyContextualSupport({ emotion: emotionKey, energyLevel }, weekData),
    [emotionKey, energyLevel, weekData],
  );

  const messageParams = {
    emotion: emotionLabel,
    ...content.messageParams,
  };

  const startPauseMeditation = useCallback(() => {
    const type = getSituationalMeditationType(morningMeditationDone, eveningMeditationDone);
    handleStartMeditation(type);
  }, [eveningMeditationDone, handleStartMeditation, morningMeditationDone]);

  const handlePrimaryAction = () => {
    if (content.ctaKey === 'hoy.supportCtaPause') {
      startPauseMeditation();
      return;
    }
    if (content.action.type === 'session') {
      router.push({
        pathname: '/focus-session',
        params: { minutes: String(content.action.minutes) },
      });
      return;
    }
    router.push({
      pathname: '/tips/[category]',
      params: { category: 'mindset', emotion: emotionKey, energy: String(energyLevel) },
    });
  };

  const startFocusPause = useCallback(() => {
    router.push({ pathname: '/focus-session', params: { minutes: '5' } });
  }, []);

  const openTipsCategory = (category: 'mindset' | 'rest') => {
    router.push({
      pathname: '/tips/[category]',
      params: { category, emotion: emotionKey, energy: String(energyLevel) },
    });
  };

  const showSessionPrimary =
    content.action.type === 'session' ||
    content.ctaKey === 'hoy.supportCtaSession';

  return (
    <>
      <CalmCard style={styles.card}>
        <Text style={styles.title}>{t('hoy.supportPanelTitle')}</Text>
        <Text style={styles.message}>{t(content.messageKey, messageParams)}</Text>

        <View style={styles.chipRow}>
          <SupportChip
            icon={<Wind size={16} color={THEME.colors.calm.lavenderDeep} />}
            label={t('hoy.supportChipBreathe')}
            onPress={() => openTipsCategory('mindset')}
            a11y={t('hoy.supportChipBreatheA11y')}
          />
          <SupportChip
            icon={<Moon size={16} color={THEME.colors.calm.lavenderDeep} />}
            label={t('hoy.supportChipMeditate')}
            onPress={startPauseMeditation}
            a11y={t('hoy.supportChipMeditateA11y')}
          />
          <SupportChip
            icon={<Pause size={16} color={THEME.colors.calm.lavenderDeep} />}
            label={t('hoy.supportChipPause')}
            onPress={startFocusPause}
            a11y={t('hoy.supportChipPauseA11y')}
          />
        </View>

        {showSessionPrimary ? (
          <CalmPrimaryButton
            label={t(content.ctaKey)}
            onPress={handlePrimaryAction}
            variant="soft"
          />
        ) : (
          <TouchableOpacity
            style={styles.softCta}
            onPress={handlePrimaryAction}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t(content.ctaKey)}
          >
            <Text style={styles.softCtaText}>{t(content.ctaKey)}</Text>
            <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.moreTips}
          onPress={() => openTipsCategory('rest')}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel={t('hoy.supportMoreTips')}
        >
          <Text style={styles.moreTipsText}>{t('hoy.supportMoreTips')}</Text>
          <ChevronRight size={14} color={THEME.colors.text.secondary} />
        </TouchableOpacity>
      </CalmCard>

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

function SupportChip({
  icon,
  label,
  onPress,
  a11y,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      {icon}
      <Text style={styles.chipLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1,
  },
  title: {
    ...THEME.typography.sectionTitle,
    fontSize: 17,
    color: THEME.colors.text.main,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    minHeight: 36,
  },
  chipLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  softCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: THEME.spacing.xs,
  },
  softCtaText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  moreTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingTop: THEME.spacing.xs,
  },
  moreTipsText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
