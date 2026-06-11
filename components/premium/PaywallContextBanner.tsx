import { View, Text, StyleSheet } from 'react-native';
import { Crown, Info, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type PaywallContextBannerVariant = 'onboarding' | 'expoGo' | 'devSim';

type PaywallContextBannerProps = {
  variant: PaywallContextBannerVariant;
};

export function PaywallContextBanner({ variant }: PaywallContextBannerProps) {
  const { t } = useI18n();

  const config = {
    onboarding: {
      icon: Crown,
      iconColor: THEME.colors.calm.lavenderDeep,
      title: t('paywallExtra.onboardingBannerTitle'),
      body: t('paywallExtra.onboardingBannerBody'),
      style: styles.onboarding,
    },
    expoGo: {
      icon: Info,
      iconColor: THEME.colors.gradient.blue,
      title: t('paywallExtra.expoGoBannerTitle'),
      body: t('paywallExtra.expoGoBannerBody'),
      style: styles.expoGo,
    },
    devSim: {
      icon: Sparkles,
      iconColor: THEME.colors.calm.lavenderDeep,
      title: t('paywallExtra.devSimBannerTitle'),
      body: t('paywallExtra.devSimBannerBody'),
      style: styles.devSim,
    },
  }[variant];

  const Icon = config.icon;

  return (
    <View style={[styles.banner, config.style]} accessibilityRole="summary">
      <Icon size={20} color={config.iconColor} />
      <View style={styles.textCol}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.body}>{config.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
  },
  onboarding: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  expoGo: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  devSim: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.border,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
