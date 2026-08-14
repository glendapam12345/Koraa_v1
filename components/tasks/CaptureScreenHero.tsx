import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

/**
 * Hero compacto tipo Duolingo: Ellie pequeña al lado + pregunta clara.
 * El espacio grande es para escribir, no para la mascota.
 */
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
      <View style={styles.row}>
        <View style={styles.mascot} accessibilityElementsHidden>
          <KoraaMascotAvatar size={52} variant="ellie" breathe />
        </View>
        <View style={styles.copy}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greetingLine}
          </Text>
          <Text style={styles.prompt}>{t('vaciar.brainDumpSimpleTitle')}</Text>
          <Animated.Text
            key={subtitle}
            entering={FadeIn.duration(220)}
            style={styles.subtitle}
            numberOfLines={2}
          >
            {liveState?.itemCount ? t('frentes.brainDumpSubActive') : subtitle}
          </Animated.Text>
        </View>
      </View>
      <Text style={styles.flowHint}>{t('flow.captionSub')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  mascot: {
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greeting: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  prompt: {
    ...THEME.typography.h3,
    fontSize: 22,
    lineHeight: 28,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  flowHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.accent.italic,
    lineHeight: 16,
    paddingLeft: 52 + THEME.spacing.sm,
  },
});
