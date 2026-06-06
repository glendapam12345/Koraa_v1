import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { buildKoraaFocusReasonItems, type KoraaFocusCheckIn } from '@/lib/koraaFocusReasons';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type KoraaLogicExplanationProps = {
  checkIn: KoraaFocusCheckIn;
  emotionLabel: string;
};

export function KoraaLogicExplanation({ checkIn, emotionLabel }: KoraaLogicExplanationProps) {
  const { t } = useI18n();
  const reasons = buildKoraaFocusReasonItems(checkIn, emotionLabel);

  if (reasons.length === 0) return null;

  return (
    <View accessibilityRole="summary" accessibilityLabel={t('hoy.koraaLogicA11y')}>
      <CalmCard style={styles.card}>
        <Text style={styles.title}>{t('hoy.koraaLogicTitle')}</Text>
        {reasons.map((reason, index) => (
          <View key={`${reason.key}-${index}`} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{t(reason.key, reason.params)}</Text>
          </View>
        ))}
      </CalmCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  bullet: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 20,
  },
  bulletText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
