import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { Project } from '@/hooks/useWeekTasks';

type SemanaProjectFilterProps = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
};

export function SemanaProjectFilter({
  projects,
  selectedProjectId,
  onSelectProject,
}: SemanaProjectFilterProps) {
  const { t } = useI18n();

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          onPress={() => onSelectProject(null)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('semanaExtra.a11yViewAllTasks')}
          accessibilityState={{ selected: selectedProjectId === null }}
          style={styles.chipTouchable}
        >
          {selectedProjectId === null ? (
            <View style={[styles.chip, styles.chipSelected]}>
              <Text style={styles.chipTextSelected}>{t('semana.all')}</Text>
            </View>
          ) : (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{t('semana.all')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const chipColor = project.color || THEME.colors.gradient.blue;

          return (
            <TouchableOpacity
              key={project.id}
              onPress={() => onSelectProject(project.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('semanaExtra.a11yFilterProject', { name: project.name })}
              accessibilityState={{ selected: isSelected }}
              style={styles.chipTouchable}
            >
              {isSelected ? (
                <View style={[styles.chip, styles.chipSelected, { backgroundColor: chipColor }]}>
                  <View style={[styles.chipDotLight, { backgroundColor: THEME.colors.onGradientMuted }]} />
                  <Text style={styles.chipTextSelected} numberOfLines={1}>
                    {project.name}
                  </Text>
                </View>
              ) : (
                <View style={styles.chip}>
                  <View style={[styles.chipDot, { backgroundColor: chipColor }]} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {project.name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 0,
  },
  content: {
    paddingHorizontal: 0,
    gap: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  chipTouchable: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs + 2,
    ...THEME.surfaces.chip,
  },
  chipSelected: {
    ...THEME.surfaces.chipSelected,
    borderWidth: 0,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipDotLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  chipTextSelected: {
    ...THEME.typography.meta,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
