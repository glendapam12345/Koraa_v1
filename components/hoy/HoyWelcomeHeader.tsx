import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { Sparkles, CircleHelp, Settings } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyWelcomeHeaderProps = {
  greeting: string;
  showUserActions: boolean;
  checkedInToday: boolean;
};

export function HoyWelcomeHeader({
  greeting,
  showUserActions,
  checkedInToday,
}: HoyWelcomeHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle} accessibilityRole="header">
        {greeting} ✨
      </Text>
      {showUserActions ? (
        <View style={styles.welcomeActionsRow}>
          <TouchableOpacity
            style={checkedInToday ? styles.returnBadgeActive : styles.returnBadgeMuted}
            onPress={() =>
              checkedInToday ? router.push('/(tabs)/parami') : openRecheckCheckIn('hoy_streak')
            }
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={
              checkedInToday ? t('hoy.returnedTodayA11y') : t('hoy.returnInviteA11y')
            }
            accessibilityHint={checkedInToday ? t('hoyExtra.profileHint') : t('hoyExtra.noStreakHint')}
          >
            <Sparkles
              size={14}
              color={
                checkedInToday ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary
              }
            />
            <Text
              style={checkedInToday ? styles.returnTextActive : styles.returnTextMuted}
              numberOfLines={1}
            >
              {checkedInToday ? t('hoy.returnedToday') : t('hoy.returnInvite')}
            </Text>
          </TouchableOpacity>
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
      {showUserActions && checkedInToday ? (
        <Text style={styles.consistencyHint} accessibilityRole="text">
          {t('hoy.consistencyHint')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeSection: {
    marginBottom: THEME.spacing.md,
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
  returnBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    gap: 4,
    flexShrink: 1,
    maxWidth: '62%',
  },
  returnTextActive: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  returnBadgeMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    flexShrink: 1,
    maxWidth: '62%',
  },
  returnTextMuted: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  consistencyHint: {
    ...THEME.typography.small,
    color: THEME.colors.accent.purple,
    lineHeight: 18,
    marginTop: 2,
  },
});
