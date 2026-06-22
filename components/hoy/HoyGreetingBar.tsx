import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { TimeOfDayChip } from '@/components/hoy/TimeOfDayChip';

type HoyGreetingBarProps = {
  displayName: string;
};

export function HoyGreetingBar({ displayName }: HoyGreetingBarProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);
  const { period, greeting, timeChipLabel, lateNight, greetingSubline } = useKoraaGreeting();

  const title = lateNight
    ? formatNightReturnGreeting(t, firstName, period)
    : formatGreetingWithName(t, greeting, firstName);

  return (
    <View style={styles.wrap}>
      <TimeOfDayChip period={period} label={timeChipLabel} />
      <Text style={styles.greeting}>{title}</Text>
      <Text style={styles.subline}>{greetingSubline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  greeting: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 32,
  },
  subline: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
});
