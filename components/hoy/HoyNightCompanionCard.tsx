import { View, Text, StyleSheet, Linking, Platform, Alert, TouchableOpacity } from 'react-native';
import { Moon, Music, BellOff } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
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
        <Moon size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('hoy.nightCompanionTitle')}</Text>
      </View>
      <Text style={styles.body} numberOfLines={3}>
        {anxious ? t('hoy.nightCompanionAnxiety') : t('hoy.nightCompanionBody')}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={() => void executeTipAction('spotify', t)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.nightCompanionMusicA11y')}
        >
          <Music size={15} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.actionLabel} numberOfLines={2}>
            {t('hoy.nightCompanionMusicCta')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={openQuietSettings}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.nightCompanionQuietA11y')}
        >
          <BellOff size={15} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.actionLabel} numberOfLines={2}>
            {t('hoy.nightCompanionQuietCta')}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint} numberOfLines={2}>
        {t('hoy.nightCompanionQuietHint')}
      </Text>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  actionLabel: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 14,
  },
  hint: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
