import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { KoraaMascotAvatar } from '@/components/branding/KoraaMascotAvatar';

export type CaptureHeroLiveState = {
  isThinking: boolean;
  frontCount: number;
  itemCount: number;
};

type CaptureScreenHeroProps = {
  displayName: string;
  liveState?: CaptureHeroLiveState | null;
};

export function CaptureScreenHero({ displayName, liveState }: CaptureScreenHeroProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

  const subtitle = useMemo(() => {
    if (!liveState) return t('vaciar.subtitle');
    if (liveState.isThinking) return t('vaciar.liveHeroThinking');
    if (liveState.itemCount > 0) {
      return t('vaciar.liveHeroDetected', {
        fronts: liveState.frontCount,
        tasks: liveState.itemCount,
      });
    }
    return t('vaciar.subtitle');
  }, [liveState, t]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>koraa</Text>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <KoraaMascotAvatar size={44} />
      </View>

      <Text style={styles.greeting}>
        {t('hoy.inicio.greetingWithName', { greeting, name: firstName })}
      </Text>
        <Text style={styles.prompt}>{t('frentes.brainDumpTitle')}</Text>
      <Animated.Text
        key={subtitle}
        entering={FadeIn.duration(220)}
        style={styles.subtitle}
      >
        {liveState?.itemCount ? t('frentes.brainDumpSubActive') : t('frentes.brainDumpSub')}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    ...THEME.typography.titleCompact,
    lineHeight: 26,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: -0.5,
  },
  greeting: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 34,
  },
  prompt: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    fontFamily: THEME.fonts.heading.medium,
  },
});
