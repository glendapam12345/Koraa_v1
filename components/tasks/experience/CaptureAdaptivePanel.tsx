import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { KoraaAdaptiveExperience } from '@/components/tasks/experience/KoraaAdaptiveExperience';

type CaptureAdaptivePanelProps = {
  displayName?: string;
  userId?: string;
};

/**
 * Experiencia adaptiva como flujo principal en Capturar.
 * Brain dump → reorganizar → semana con datos reales.
 */
export function CaptureAdaptivePanel({ displayName, userId }: CaptureAdaptivePanelProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('tasksExperience.vision.captureTitle')}</Text>
          <Text style={styles.sub}>{t('tasksExperience.vision.captureSub')}</Text>
        </View>
      </View>
      <KoraaAdaptiveExperience displayName={displayName} userId={userId} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
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
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
