import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';

export type CaptureHeroLiveState = {
  isThinking: boolean;
  areaCount: number;
  itemCount: number;
};

type CaptureScreenHeroProps = {
  displayName: string;
  liveState?: CaptureHeroLiveState | null;
};

/** Hero calm de Capturar: una pregunta, una línea de apoyo. */
export function CaptureScreenHero({ displayName, liveState }: CaptureScreenHeroProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);
  const { period, greeting, lateNight } = useKoraaGreeting();

  const greetingLine = useMemo(() => {
    if (lateNight) return formatNightReturnGreeting(t, firstName, period);
    return formatGreetingWithName(t, greeting, firstName);
  }, [firstName, greeting, lateNight, period, t]);

  const subtitle = useMemo(() => {
    if (lateNight && !liveState?.itemCount) return t('vaciar.captureNightSub');
    if (!liveState) return t('vaciar.subtitle');
    if (liveState.isThinking) return t('vaciar.liveHeroThinking');
    if (liveState.itemCount > 0) {
      return t('vaciar.liveHeroDetectedAreas', {
        areas: liveState.areaCount,
        tasks: liveState.itemCount,
      });
    }
    return t('vaciar.subtitle');
  }, [lateNight, liveState, t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.greeting}>{greetingLine}</Text>
      <Text style={styles.prompt}>{t('vaciar.brainDumpSimpleTitle')}</Text>
      <Animated.Text
        key={subtitle}
        entering={FadeIn.duration(220)}
        style={styles.subtitle}
      >
        {liveState?.itemCount ? t('frentes.brainDumpSubActive') : subtitle}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingBottom: THEME.spacing.sm,
  },
  greeting: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  prompt: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
});
