import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type EmergencyKitEntryCardProps = {
  /** Tarjeta más pequeña para Para mí (debajo de consejos). */
  compact?: boolean;
};

export function EmergencyKitEntryCard({ compact = false }: EmergencyKitEntryCardProps) {
  const { t } = useI18n();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t('emergencyKit.entryTitle')}. ${t('emergencyKit.entrySubtitle')}`}
    >
      <LinearGradient
        colors={['#6B5B95', '#9B8EC4', '#C4B5E8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <Text style={[styles.premiumLabel, compact && styles.premiumLabelCompact]}>
          {t('emergencyKit.premiumLabel')}
        </Text>
        <Text style={[styles.title, compact && styles.titleCompact]}>{t('emergencyKit.entryTitle')}</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          {t('emergencyKit.entrySubtitle')}
        </Text>
        <CalmPrimaryButton
          label={t('emergencyKit.entryCta')}
          onPress={() => router.push('/emergency-kit')}
          variant="soft"
          large={!compact}
          accessibilityHint={t('emergencyKit.entryCtaHint')}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.card,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  cardCompact: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
  },
  premiumLabel: {
    ...THEME.typography.sectionEyebrow,
    color: THEME.colors.onGradientMuted,
    alignSelf: 'flex-start',
  },
  premiumLabelCompact: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  title: {
    ...THEME.typography.h2,
    fontSize: 24,
    color: THEME.colors.fill[100],
  },
  titleCompact: {
    ...THEME.typography.h3,
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
  },
  subtitleCompact: {
    ...THEME.typography.caption,
    lineHeight: 20,
    marginBottom: 0,
  },
});
