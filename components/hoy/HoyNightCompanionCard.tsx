import { View, Text, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Moon } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { executeTipAction } from '@/lib/tipActions';
import { isOverwhelmedState } from '@/lib/emotionalSafety';

type HoyNightCompanionCardProps = {
  todayMood?: string;
  energyLevel?: number;
};

export function HoyNightCompanionCard({ todayMood = '', energyLevel = 0 }: HoyNightCompanionCardProps) {
  const { t } = useI18n();
  const anxious =
    isOverwhelmedState(todayMood, energyLevel) ||
    ['ansiosa', 'abrumada', 'agotada'].includes(todayMood.toLowerCase());

  const openQuietSettings = () => {
    if (Platform.OS === 'ios') {
      void Linking.openSettings();
      return;
    }
    Alert.alert(t('hoy.nightCompanionQuietTitle'), t('hoy.nightCompanionQuietHint'));
  };

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Moon size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('hoy.nightCompanionTitle')}</Text>
      </View>
      <Text style={styles.body}>
        {anxious ? t('hoy.nightCompanionAnxiety') : t('hoy.nightCompanionBody')}
      </Text>
      <View style={styles.actions}>
        <CalmPrimaryButton
          label={t('hoy.nightCompanionMusicCta')}
          onPress={() => void executeTipAction('spotify', t)}
          variant="soft"
          accessibilityLabel={t('hoy.nightCompanionMusicA11y')}
        />
        <CalmPrimaryButton
          label={t('hoy.nightCompanionQuietCta')}
          onPress={openQuietSettings}
          variant="soft"
          accessibilityLabel={t('hoy.nightCompanionQuietA11y')}
        />
      </View>
      <Text style={styles.hint}>{t('hoy.nightCompanionQuietHint')}</Text>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  actions: {
    gap: THEME.spacing.xs,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
