import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { KoraaAdaptiveExperience } from '@/components/tasks/experience/KoraaAdaptiveExperience';

type TasksExperienceShowcaseProps = {
  defaultExpanded?: boolean;
  displayName?: string;
  userId?: string;
};

/**
 * Vista previa interactiva del nuevo sistema adaptativo de Koraa.
 * Flujo: brain dump → ¿qué cambió? → reorganizar → semana.
 */
export function TasksExperienceShowcase({
  defaultExpanded = true,
  displayName,
  userId,
}: TasksExperienceShowcaseProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.toggleHeader}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('tasksExperience.showcaseToggleA11y')}
      >
        <View style={styles.toggleLeft}>
          <View style={styles.badge}>
            <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          </View>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>{t('tasksExperience.vision.showcaseTitle')}</Text>
            <Text style={styles.toggleSub}>{t('tasksExperience.vision.showcaseSub')}</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={22} color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <ChevronDown size={22} color={THEME.colors.calm.lavenderDeep} />
        )}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          <KoraaAdaptiveExperience displayName={displayName} userId={userId} />
          <Text style={styles.prototypeNote}>{t('tasksExperience.prototypeNote')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  toggleSub: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  body: {
    gap: THEME.spacing.sm,
  },
  prototypeNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
