import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
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
import { openTipsCategory as navigateToTipsCategory } from '@/lib/tipsNavigation';

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
  const [expanded, setExpanded] = useState(false);
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
    navigateToTipsCategory(router, 'mindset', { emotion: emotionKey, energyLevel });
  };

  const openTipsCategory = (category: 'mindset' | 'rest') => {
    navigateToTipsCategory(router, category, { emotion: emotionKey, energyLevel });
  };

  const showSessionPrimary =
    content.action.type === 'session' ||
    content.ctaKey === 'hoy.supportCtaSession';

  return (
    <>
      <CalmCard style={styles.card}>
        <TouchableOpacity
          onPress={() => setExpanded((open) => !open)}
          activeOpacity={0.85}
          style={styles.toggleRow}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={
            expanded ? t('hoy.supportPanelHide') : t('hoy.supportPanelTitle')
          }
        >
          <Text style={styles.title}>{t('hoy.supportPanelTitle')}</Text>
          {expanded ? (
            <ChevronUp size={18} color={THEME.colors.calm.lavenderDeep} />
          ) : (
            <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
          )}
        </TouchableOpacity>

        {!expanded ? (
          <Text style={styles.collapsedHint}>{t('hoy.supportPanelCollapsedHint')}</Text>
        ) : (
          <>
        <Text style={styles.message}>{t(content.messageKey, messageParams)}</Text>

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
          </>
        )}
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

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
    flex: 1,
  },
  collapsedHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
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
