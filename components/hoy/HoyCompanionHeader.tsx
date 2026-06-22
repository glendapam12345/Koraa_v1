import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { TimeOfDayChip } from '@/components/hoy/TimeOfDayChip';

type HoyCompanionHeaderProps = {
  displayName: string;
};

export function HoyCompanionHeader({ displayName }: HoyCompanionHeaderProps) {
  const { t } = useI18n();
  const { period, lateNight, greeting, timeChipLabel, greetingSubline } = useKoraaGreeting();
  const firstName = getFirstName(displayName);

  const title = lateNight
    ? formatNightReturnGreeting(t, firstName, period)
    : formatGreetingWithName(t, greeting, firstName);

  const subline = lateNight
    ? t('hoy.nightReturnSubline', { name: firstName })
    : greetingSubline;

  return (
    <View style={styles.wrap}>
      <TimeOfDayChip period={period} label={timeChipLabel} />
      <Text style={styles.greeting}>{title}</Text>
      <Text style={styles.subline}>{subline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  greeting: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 32,
  },
  subline: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    fontFamily: THEME.fonts.heading.medium,
  },
});
