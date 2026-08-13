import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';
import { KoraaMascotAvatar } from '@/components/branding/KoraaMascotAvatar';

export type CaptureHeroLiveState = {
  isThinking: boolean;
  areaCount: number;
  itemCount: number;
};

type CaptureScreenHeroProps = {
  displayName: string;
  liveState?: CaptureHeroLiveState | null;
};

/** Hero calm de Capturar: marca + una pregunta + apoyo. */
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
    <LinearGradient
      colors={[...THEME.colors.calm.heroWash]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.mascotRow} accessibilityElementsHidden>
        <KoraaMascotAvatar size={88} variant="ellie" breathe />
      </View>
      <Text style={styles.greeting}>{greetingLine}</Text>
      <Text style={styles.prompt}>{t('vaciar.brainDumpSimpleTitle')}</Text>
      <Animated.Text
        key={subtitle}
        entering={FadeIn.duration(220)}
        style={styles.subtitle}
      >
        {liveState?.itemCount ? t('frentes.brainDumpSubActive') : subtitle}
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  mascotRow: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  greeting: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
    textAlign: 'center',
  },
  prompt: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
});
