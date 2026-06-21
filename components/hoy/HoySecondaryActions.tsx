import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type HoySecondaryActionsProps = {
  hasCheckIn: boolean;
  emotionEmoji?: string;
  emotionLabel?: string;
  energyLevel?: number;
  onUpdateFeel: () => void;
};

export function HoySecondaryActions({
  hasCheckIn,
  emotionEmoji = '',
  emotionLabel = '',
  energyLevel = 0,
  onUpdateFeel,
}: HoySecondaryActionsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.root}>
      <CalmCard style={styles.feelCard}>
        <View style={styles.feelHeader}>
          <Heart size={18} color={THEME.colors.calm.lavenderDeep} />
          <View style={styles.feelText}>
            <Text style={styles.feelTitle}>
              {hasCheckIn ? t('hoy.focusFeelTitle') : t('hoy.inicio.statusNoCheckIn')}
            </Text>
            <Text style={styles.feelSub}>
              {hasCheckIn ? t('hoy.focusFeelSub') : t('hoy.inicio.contextDefault')}
            </Text>
          </View>
        </View>

        {hasCheckIn && emotionLabel ? (
          <Text style={styles.feelState}>
            {emotionEmoji} {emotionLabel}
            {energyLevel > 0 ? ` · ${energyLevel}/5` : ''}
          </Text>
        ) : null}

        <CalmPrimaryButton
          label={hasCheckIn ? t('hoy.updateFeel') : t('hoy.inicio.primaryCta')}
          onPress={onUpdateFeel}
          variant="soft"
          accessibilityLabel={t('hoy.currentStateEditA11y')}
        />
      </CalmCard>

      <CalmPrimaryButton
        label={t('hoy.focusUnloadTitle')}
        onPress={() => router.push('/(tabs)/vaciar')}
        variant="soft"
        accessibilityLabel={t('tabs.brainDumpA11y')}
        accessibilityHint={t('hoy.focusUnloadSub')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.sm,
  },
  feelCard: {
    gap: THEME.spacing.sm,
  },
  feelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  feelText: {
    flex: 1,
    gap: 2,
  },
  feelTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  feelSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  feelState: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
});
