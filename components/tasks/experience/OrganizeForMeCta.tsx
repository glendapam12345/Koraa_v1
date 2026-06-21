import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { VISION_GRADIENT_CTA } from '@/lib/lifeAreas/visionPalette';

type OrganizeForMeCtaProps = {
  onPress: () => void;
};

export function OrganizeForMeCta({ onPress }: OrganizeForMeCtaProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={t('tasksExperience.vision.organizeCtaA11y')}
      style={styles.wrap}
    >
      <LinearGradient
        colors={[...VISION_GRADIENT_CTA]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <Sparkles size={22} color={THEME.colors.onGradient} />
        <View style={styles.textCol}>
          <Text style={styles.label}>{t('tasksExperience.vision.organizeCta')}</Text>
          <Text style={styles.sub}>{t('tasksExperience.vision.organizeCtaSub')}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 28,
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: THEME.spacing.md,
    minHeight: 72,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.onGradient,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    lineHeight: 16,
  },
});
