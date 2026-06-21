import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';

type HoyGreetingBarProps = {
  displayName: string;
};

export function HoyGreetingBar({ displayName }: HoyGreetingBarProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.greeting}>
        {t('hoy.inicio.greetingWithName', { greeting, name: firstName })}
      </Text>
      <Text style={styles.subline}>{t('hoy.greetingSubline')}</Text>
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
