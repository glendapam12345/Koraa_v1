import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Flame, CircleHelp, Settings } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyWelcomeHeaderProps = {
  greeting: string;
  showUserActions: boolean;
  currentStreak: number;
};

export function HoyWelcomeHeader({
  greeting,
  showUserActions,
  currentStreak,
}: HoyWelcomeHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.welcomeSection}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeTitle}>{greeting} ✨</Text>
        <View style={styles.welcomeHeaderRight}>
          {showUserActions &&
            (currentStreak > 0 ? (
              <View style={styles.streakHeaderCluster}>
                <TouchableOpacity
                  style={styles.streakBadgeInline}
                  onPress={() => router.push('/(tabs)/yo')}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoyPlanFallback.streakA11y', { count: currentStreak })}
                  accessibilityHint={t('hoyExtra.profileHint')}
                >
                  <Flame size={14} color={THEME.colors.gradient.pink} />
                  <Text style={styles.streakTextInline}>{currentStreak}</Text>
                  <Text style={styles.streakDaysLabel}>{t('hoy.streakDays')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.streakBadgeMuted}
                onPress={() => router.push('/(tabs)/sentir')}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('hoyExtra.noStreakA11y')}
                accessibilityHint={t('hoyExtra.noStreakHint')}
              >
                <Flame size={14} color={THEME.colors.text.tertiary} />
                <Text style={styles.streakTextMuted}>{t('hoy.streakLabel')}</Text>
                <Text style={styles.streakTextMutedBold}>0</Text>
              </TouchableOpacity>
            ))}
          {showUserActions ? (
            <>
              <TouchableOpacity
                onPress={() => router.push('/help')}
                style={styles.settingsHeaderBtn}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('hoyExtra.helpA11y')}
                accessibilityHint={t('hoyExtra.helpHint')}
              >
                <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={styles.settingsHeaderBtn}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('hoyExtra.settingsA11y')}
                accessibilityHint={t('hoyExtra.settingsHint')}
              >
                <Settings size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
      {showUserActions ? (
        <Text style={styles.streakHint} accessibilityRole="text">
          {t('hoy.streakHint')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeSection: {
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  welcomeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  streakHeaderCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsHeaderBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    ...THEME.typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  streakBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  streakTextInline: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  streakDaysLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginLeft: 2,
  },
  streakBadgeMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  streakTextMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
  },
  streakTextMutedBold: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  streakHint: {
    ...THEME.typography.small,
    color: THEME.colors.accent.purple,
    lineHeight: 18,
    marginTop: 2,
  },
});
