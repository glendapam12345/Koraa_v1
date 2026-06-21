import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { BrainDumpCanvas } from '@/components/tasks/experience/BrainDumpCanvas';
import { OrganizeForMeCta } from '@/components/tasks/experience/OrganizeForMeCta';
import type { FloatingThoughtCard, LifeArea } from '@/lib/lifeAreas/types';
import { VISION_PASTELS } from '@/lib/lifeAreas/visionPalette';

type BrainDumpPanelProps = {
  displayName: string;
  thoughts: FloatingThoughtCard[];
  areas: LifeArea[];
  onOrganizePress: () => void;
};

export function BrainDumpPanel({
  displayName,
  thoughts,
  areas,
  onOrganizePress,
}: BrainDumpPanelProps) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={[VISION_PASTELS.pink, THEME.colors.calm.background, VISION_PASTELS.lavender]}
      locations={[0, 0.45, 1]}
      style={styles.shell}
    >
      <View style={styles.sparkleRow}>
        <Text style={styles.sparkle}>✦</Text>
        <Text style={styles.sparkleMuted}>✧</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.greeting}>
          {t('tasksExperience.vision.greeting', { name: displayName })}
        </Text>
        <Text style={styles.prompt}>{t('tasksExperience.vision.mindPrompt')}</Text>
      </View>

      <BrainDumpCanvas thoughts={thoughts} areas={areas} />

      <View style={styles.ctaWrap}>
        <OrganizeForMeCta onPress={onOrganizePress} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    padding: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassBorderSoft,
    ...THEME.shadows.soft,
  },
  sparkleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sparkle: {
    fontSize: THEME.typography.caption.fontSize,
    color: VISION_PASTELS.pinkDeep,
    opacity: 0.5,
  },
  sparkleMuted: {
    fontSize: 12,
    color: THEME.colors.calm.lavenderDeep,
    opacity: 0.35,
  },
  header: {
    gap: 4,
    paddingHorizontal: 4,
  },
  greeting: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 30,
  },
  prompt: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    fontFamily: THEME.fonts.accent.italic,
  },
  ctaWrap: {
    paddingTop: THEME.spacing.xs,
  },
});
