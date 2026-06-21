import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type AdaptiveExperienceProjectsCtaProps = {
  onOpenCapture: () => void;
};

export function AdaptiveExperienceProjectsCta({ onOpenCapture }: AdaptiveExperienceProjectsCtaProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onOpenCapture}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('tasksExperience.vision.projectsCtaA11y')}
    >
      <View style={styles.left}>
        <View style={styles.badge}>
          <Sparkles size={18} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{t('tasksExperience.vision.projectsCtaTitle')}</Text>
          <Text style={styles.sub}>{t('tasksExperience.vision.projectsCtaSub')}</Text>
        </View>
      </View>
      <ChevronRight size={22} color={THEME.colors.calm.lavenderDeep} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
});
