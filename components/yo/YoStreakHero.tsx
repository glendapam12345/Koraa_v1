import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { StreakAura } from '@/components/branding/StreakAura';
import { KoraaBloomLogo } from '@/components/branding/KoraaBloomLogo';
import {
  getNextStreakMilestone,
  getStreakAuraIntensity,
  getStreakLevelKey,
  getStreakRingProgress,
} from '@/lib/streakLevel';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type YoStreakHeroProps = {
  streak: number;
};

export function YoStreakHero({ streak }: YoStreakHeroProps) {
  const { t } = useI18n();
  const ringProgress = getStreakRingProgress(streak);
  const nextMilestone = getNextStreakMilestone(streak);
  const levelKey = getStreakLevelKey(streak) as TranslationKey;
  const auraIntensity = getStreakAuraIntensity(streak);

  const onPress = () => {
    if (streak > 0) {
      router.push('/(tabs)/parami');
      return;
    }
    router.push(CHECK_IN_ROUTE);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        streak > 0
          ? t('yoExtra.a11yStreakHero', { count: streak, level: t(levelKey) })
          : t('yo.streakEmpty')
      }
      accessibilityHint={streak > 0 ? t('yoExtra.a11yStreakHeroHint') : t('yoExtra.a11yStreakEmptyHint')}
    >
      <CalmCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.textBlock}>
            <Text style={styles.sectionLabel}>{t('yo.progressTitle')}</Text>
            <Text style={styles.level}>{t(levelKey)}</Text>
            {streak > 0 ? (
              <>
                <Text style={styles.streakLine}>
                  <Text style={styles.streakCount}>{streak}</Text>{' '}
                  {streak === 1 ? t('yo.streakDayOne') : t('yo.streakDayMany')}
                </Text>
                {streak < nextMilestone ? (
                  <Text style={styles.milestoneHint}>
                    {t('yoExtra.streakNextMilestone', { days: nextMilestone - streak })}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.empty}>{t('yo.streakEmpty')}</Text>
            )}
          </View>

          <View style={styles.ringWrap}>
            <StreakAura intensity={auraIntensity} contentSize={56}>
              <View style={styles.ringOuter}>
                <View
                  style={[
                    styles.ringFill,
                    { height: `${Math.max(8, Math.round(ringProgress * 100))}%` },
                  ]}
                />
                <View style={styles.ringInner}>
                  <KoraaBloomLogo size={40} active={streak > 0} />
                </View>
              </View>
            </StreakAura>
          </View>
        </View>
      </CalmCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: THEME.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  level: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  streakLine: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  streakCount: {
    ...THEME.typography.h2,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  milestoneHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  empty: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: THEME.colors.fill[100],
  },
  ringFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.22,
  },
  ringInner: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
