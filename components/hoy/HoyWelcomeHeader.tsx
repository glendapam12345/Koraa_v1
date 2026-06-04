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
      <Text style={styles.welcomeTitle} accessibilityRole="header">
        {greeting} ✨
      </Text>
      {showUserActions ? (
        <View style={styles.welcomeActionsRow}>
          {currentStreak > 0 ? (
            <TouchableOpacity
              style={styles.streakBadgeInline}
              onPress={() => router.push('/(tabs)/yo')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('hoyPlanFallback.streakA11y', { count: currentStreak })}
              accessibilityHint={t('hoyExtra.profileHint')}
            >
              <Flame size={14} color={THEME.colors.gradient.pink} />
              <Text style={styles.streakTextInline} numberOfLines={1}>
                {currentStreak}
              </Text>
              <Text style={styles.streakDaysLabel}>{t('hoy.streakDays')}</Text>
            </TouchableOpacity>
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
          )}
          <View style={styles.welcomeIconCluster}>
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
          </View>
        </View>
      ) : null}
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
    gap: THEME.spacing.sm,
  },
  welcomeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  welcomeIconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexShrink: 0,
  },
  settingsHeaderBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flexShrink: 0,
    width: '100%',
  },
  streakBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    gap: 4,
    flexShrink: 0,
  },
  streakTextInline: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 18,
    textAlign: 'center',
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
