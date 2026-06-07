import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { MeditationMomentCard } from '@/components/meditation/MeditationMomentCard';

type TipsMeditationSectionProps = {
  morningDone: boolean;
  eveningDone: boolean;
  onStartMorning: () => void;
  onStartEvening: () => void;
};

export function TipsMeditationSection({
  morningDone,
  eveningDone,
  onStartMorning,
  onStartEvening,
}: TipsMeditationSectionProps) {
  const { t } = useI18n();

  return (
    <View
      style={styles.section}
      accessibilityRole="summary"
      accessibilityLabel={t('tipsExtra.a11yMeditationSection')}
    >
      <Text style={styles.eyebrow}>{t('tips.meditationEyebrow')}</Text>
      <MeditationMomentCard
        morningDone={morningDone}
        eveningDone={eveningDone}
        onStartMorning={onStartMorning}
        onStartEvening={onStartEvening}
        titleKey="tips.meditationTitle"
        titleAccentKey="tips.meditationTitleAccent"
        subtitleKey="tips.meditationLead"
        expoGoNoteKey="hoy.meditationExpoGoNote"
        gradientColors={[
          THEME.colors.calm.lavender,
          THEME.colors.tint.blue.veryFaint,
          THEME.colors.tint.pink.soft,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  eyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
    paddingHorizontal: THEME.spacing.xs,
  },
});
