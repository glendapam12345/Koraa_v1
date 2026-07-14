import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
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

/** Hero de acción calmado — mist, un mensaje + un CTA. */
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
    <View
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  message: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
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
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
