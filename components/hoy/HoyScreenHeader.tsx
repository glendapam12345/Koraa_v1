import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { HoyStreakPill } from '@/components/hoy/HoyStreakPill';
import { HoyCareModeToggle } from '@/components/hoy/HoyCareModeToggle';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';

type HoyScreenHeaderProps = {
  displayName?: string;
  hasCheckInToday?: boolean;
  showSubtitle?: boolean;
  compact?: boolean;
  minimal?: boolean;
  streak?: number;
  checkedInToday?: boolean;
  crisisModeActive?: boolean;
  onCareModePress?: () => void;
};

/**
 * Cabecera Hoy al estilo mock: wordmark → saludo → headline de cuidado.
 */
export function HoyScreenHeader({
  displayName = '',
  hasCheckInToday = true,
  showSubtitle = true,
  minimal = false,
  streak = 0,
  checkedInToday = false,
  crisisModeActive = false,
  onCareModePress,
}: HoyScreenHeaderProps) {
  const { t } = useI18n();
  const { period, lateNight, greeting } = useKoraaGreeting();
  const firstName = getFirstName(displayName);

  const greetingLine = lateNight
    ? formatNightReturnGreeting(t, firstName, period)
    : formatGreetingWithName(t, greeting, firstName);

  const careHeadline = !hasCheckInToday
    ? t('hoy.careHeadlineNoCheckIn')
    : lateNight
      ? t('hoy.nightReturnSubline', { name: firstName })
      : t('hoy.careHeadline');

  const trailing = (
    <>
      {onCareModePress ? (
        <HoyCareModeToggle active={crisisModeActive} onPress={onCareModePress} />
      ) : null}
      <HoyStreakPill streak={streak} checkedInToday={checkedInToday} />
      <HeaderIconButton
        onPress={() => router.push('/help')}
        accessibilityLabel={t('settings.help')}
      >
        <CircleHelp size={22} color={THEME.colors.calm.lavenderDeep} />
      </HeaderIconButton>
    </>
  );

  if (minimal) {
    return (
      <View style={styles.minimalRow} accessibilityRole="toolbar">
        {trailing}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>koraa</Text>
        <View style={styles.trailing}>{trailing}</View>
      </View>

      <Text style={styles.greeting} accessibilityRole="header">
        {greetingLine}
      </Text>

      {showSubtitle ? (
        <Text style={styles.careHeadline}>{careHeadline}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  wordmark: {
    ...THEME.typography.titleCompact,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  greeting: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginTop: 2,
  },
  careHeadline: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
});
