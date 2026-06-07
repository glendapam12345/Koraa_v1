import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TipsActionHeroContent } from '@/lib/tipsActionHero';

type TipsActionHeroProps = {
  content: TipsActionHeroContent;
  emotionLabel: string;
  onPausePress?: () => void;
};

export function TipsActionHero({ content, emotionLabel, onPausePress }: TipsActionHeroProps) {
  const { t } = useI18n();

  const messageParams = {
    emotion: emotionLabel,
    ...content.messageParams,
  };

  const handlePress = () => {
    if (content.action.type === 'pause') {
      onPausePress?.();
      return;
    }
    router.push(content.action.route);
  };

  const a11yHint =
    content.action.type === 'pause'
      ? t('tipsExtra.a11yActionHeroPauseHint')
      : t('tipsExtra.a11yActionHeroHint');

  return (
    <LinearGradient
      colors={[THEME.colors.calm.lavenderDeep, THEME.colors.gradient.blue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={t(content.messageKey, messageParams)}
    >
      <Text style={styles.eyebrow}>{t('tips.actionHeroEyebrow')}</Text>
      <Text style={styles.message}>{t(content.messageKey, messageParams)}</Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t(content.ctaKey)}
        accessibilityHint={a11yHint}
      >
        <Text style={styles.ctaText}>{t(content.ctaKey)}</Text>
        <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.medium,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    lineHeight: 24,
    fontFamily: THEME.fonts.heading.medium,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
