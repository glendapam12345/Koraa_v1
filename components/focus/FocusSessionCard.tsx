import { View, Text, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

export function FocusSessionCard() {
  const { t } = useI18n();

  return (
    <CalmCard>
      <View style={styles.row}>
        <View style={styles.timerRing}>
          <Timer size={28} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.timerText}>5</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('focus.sessionTitle')}</Text>
          <Text style={styles.sub}>{t('focus.sessionSub')}</Text>
        </View>
      </View>
      <CalmPrimaryButton
        label={t('focus.sessionStart')}
        onPress={() => router.push({ pathname: '/focus-session', params: { minutes: '5' } })}
        accessibilityLabel={t('focus.sessionCardA11y')}
        accessibilityHint={t('focus.sessionSub')}
      />
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    marginBottom: 0,
  },
  timerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 2,
  },
  copy: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  sub: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
});
