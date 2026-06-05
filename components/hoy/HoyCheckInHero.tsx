import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

type HoyCheckInHeroProps = {
  onCheckIn: () => void;
};

export function HoyCheckInHero({ onCheckIn }: HoyCheckInHeroProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Heart size={28} color={THEME.colors.onGradient} fill={THEME.colors.onGradient} />
        </View>
        <Text style={styles.title}>{t('hoy.checkInHero.title')}</Text>
        <Text style={styles.subtitle}>{t('hoy.checkInHero.subtitle')}</Text>
        <CalmPrimaryButton
          label={t('hoy.checkInHero.cta')}
          onPress={onCheckIn}
          variant="soft"
          accessibilityLabel={t('hoy.checkInHero.cta')}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.md,
  },
  card: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    lineHeight: 22,
    marginBottom: THEME.spacing.md,
  },
});
