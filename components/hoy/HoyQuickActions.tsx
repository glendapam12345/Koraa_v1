import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyQuickActionsProps = {
  /** Pill de captura; en vista con check-in va dentro de «Más para hoy». */
  showAddTasksPill: boolean;
  showSecondaryToggle: boolean;
  showSecondaryModules: boolean;
  onToggleSecondaryModules: () => void;
};

export function HoyQuickActions({
  showAddTasksPill,
  showSecondaryToggle,
  showSecondaryModules,
  onToggleSecondaryModules,
}: HoyQuickActionsProps) {
  const { t } = useI18n();

  if (!showAddTasksPill && !showSecondaryToggle) {
    return null;
  }

  return (
    <>
      {showAddTasksPill ? (
        <TouchableOpacity
          style={styles.addTasksPill}
          onPress={() => router.push('/(tabs)/vaciar')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.goTasksA11y')}
          accessibilityHint={t('hoyExtra.goTasksHint')}
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addTasksPillGradient}
          >
            <Plus size={20} color={THEME.colors.onGradient} />
            <Text style={styles.addTasksPillTitle}>{t('hoy.addTasks')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {showSecondaryToggle ? (
        <>
          <TouchableOpacity
            style={styles.secondaryModulesToggle}
            onPress={onToggleSecondaryModules}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              showSecondaryModules
                ? t('hoyExtra.toggleExtraA11yHide')
                : t('hoyExtra.toggleExtraA11yShow')
            }
            accessibilityHint={t('hoyExtra.toggleExtraHint')}
            accessibilityState={{ expanded: showSecondaryModules }}
          >
            <Text style={styles.secondaryModulesToggleText}>
              {showSecondaryModules ? t('hoy.hideMoreForToday') : t('hoy.showMoreForToday')}
            </Text>
            {showSecondaryModules ? (
              <ChevronDown size={18} color={THEME.colors.text.secondary} />
            ) : (
              <ChevronRight size={18} color={THEME.colors.text.secondary} />
            )}
          </TouchableOpacity>
          <Text style={styles.secondaryModulesHint}>{t('hoy.secondaryModulesHint')}</Text>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  addTasksPill: {
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addTasksPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm + 4,
    paddingHorizontal: THEME.spacing.xl,
    minHeight: 48,
  },
  addTasksPillTitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  secondaryModulesToggle: {
    marginTop: -THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryModulesToggleText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  secondaryModulesHint: {
    ...THEME.typography.meta,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    color: THEME.colors.text.secondary,
  },
});
