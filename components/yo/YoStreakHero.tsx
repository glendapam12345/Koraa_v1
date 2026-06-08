import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { StreakAura } from '@/components/branding/StreakAura';
import { KoraaBloomLogo } from '@/components/branding/KoraaBloomLogo';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type YoStreakHeroProps = {
  checkedInToday: boolean;
};

export function YoStreakHero({ checkedInToday }: YoStreakHeroProps) {
  const { t } = useI18n();

  const onPress = () => {
    if (checkedInToday) {
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
        checkedInToday ? t('yoExtra.a11yStreakHero') : t('yo.streakEmpty')
      }
      accessibilityHint={
        checkedInToday ? t('yoExtra.a11yStreakHeroHint') : t('yoExtra.a11yStreakEmptyHint')
      }
    >
      <CalmCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.textBlock}>
            <Text style={styles.sectionLabel}>{t('yo.progressTitle')}</Text>
            {checkedInToday ? (
              <>
                <Text style={styles.title}>{t('yo.returnedToday')}</Text>
                <Text style={styles.sub}>{t('yo.returnedTodaySub')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>{t('yo.returnInvite')}</Text>
                <Text style={styles.sub}>{t('yo.returnInviteSub')}</Text>
              </>
            )}
          </View>

          <View style={styles.ringWrap}>
            <StreakAura intensity={checkedInToday ? 0.55 : 0.12} contentSize={56}>
              <View style={styles.ringOuter}>
                <View
                  style={[
                    styles.ringFill,
                    { height: checkedInToday ? '72%' : '12%' },
                  ]}
                />
                <View style={styles.ringInner}>
                  <KoraaBloomLogo size={40} active={checkedInToday} />
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
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  sub: {
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
