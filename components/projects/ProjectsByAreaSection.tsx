import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, PencilLine } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import {
  groupProjectsByLifeArea,
  LIFE_AREA_CATALOG,
  type LifeAreaCatalogEntry,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import { ProjectLibraryCard } from '@/components/projects/ProjectLibraryCard';

function groupAllLifeAreas(projects: ProjectLibraryItem[]) {
  const buckets = new Map<string, ProjectLibraryItem[]>();
  for (const project of projects) {
    const list = buckets.get(project.lifeAreaKey) ?? [];
    list.push(project);
    buckets.set(project.lifeAreaKey, list);
  }
  return LIFE_AREA_CATALOG.map((area) => ({
    area,
    projects: buckets.get(area.key) ?? [],
  }));
}

type ProjectsByAreaSectionProps = {
  projects: ProjectLibraryItem[];
  userId: string;
  onAddTask: (projectId: string | null) => void;
  onCreateProjectInArea?: (areaKey: LifeAreaCatalogEntry['key']) => void;
  onEditAreas?: () => void;
  hideExplainer?: boolean;
  /** Muestra todas las áreas del catálogo, incluso sin proyectos. */
  showAllAreas?: boolean;
};

export function ProjectsByAreaSection({
  projects,
  userId,
  onAddTask,
  onCreateProjectInArea,
  onEditAreas,
  hideExplainer = false,
  showAllAreas = false,
}: ProjectsByAreaSectionProps) {
  const { t } = useI18n();
  const groups = showAllAreas
    ? groupAllLifeAreas(projects)
    : groupProjectsByLifeArea(projects);
  const explainer = t('projects.areaGroupedExplainer');

  return (
    <View style={styles.wrap}>
      {!hideExplainer && explainer ? (
        <Text style={styles.explainer}>{explainer}</Text>
      ) : null}
      {groups.map((group, index) => (
        <AreaGroup
          key={group.area.key}
          area={group.area}
          themeIndex={index}
          projects={group.projects}
          userId={userId}
          onAddTask={onAddTask}
          onCreateProjectInArea={onCreateProjectInArea}
          onEditAreas={onEditAreas}
        />
      ))}
    </View>
  );
}

function AreaGroup({
  area,
  themeIndex,
  projects,
  userId,
  onAddTask,
  onCreateProjectInArea,
  onEditAreas,
}: {
  area: LifeAreaCatalogEntry;
  themeIndex: number;
  projects: ProjectLibraryItem[];
  userId: string;
  onAddTask: (projectId: string | null) => void;
  onCreateProjectInArea?: (areaKey: LifeAreaCatalogEntry['key']) => void;
  onEditAreas?: () => void;
}) {
  const { t } = useI18n();
  const theme = frontThemeForKey(area.key, themeIndex);

  return (
    <View style={[styles.areaCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.areaHeader}>
        <Text style={styles.areaEmoji}>{area.emoji}</Text>
        <View style={styles.areaHeaderText}>
          <Text style={[styles.areaTitle, { color: theme.accent }]}>
            {t(`lifeAreas.${area.key}` as TranslationKey)}
          </Text>
          <Text style={styles.areaSub}>
            {projects.length === 0
              ? t('projects.areaEmpty')
              : projects.length === 1
                ? t('projects.areaProjectCountOne')
                : t('projects.areaProjectCount', { count: projects.length })}
          </Text>
        </View>
      </View>
      <View style={styles.projectList}>
        {projects.map((project) => (
          <ProjectLibraryCard
            key={project.id}
            mode="project"
            project={project}
            userId={userId}
            onAddTask={onAddTask}
            compact
          />
        ))}
        <View style={styles.areaActionsRow}>
          <TouchableOpacity
            style={styles.areaActionBtn}
            onPress={() => onCreateProjectInArea?.(area.key)}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={t('projects.createInAreaA11y', { area: t(`lifeAreas.${area.key}` as TranslationKey) })}
          >
            <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.areaActionText}>{t('projects.createInArea')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.areaActionBtn}
            onPress={() => onEditAreas?.()}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={t('projects.editAreasA11y')}
          >
            <PencilLine size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.areaActionText}>{t('projects.editAreas')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.md,
  },
  explainer: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: 2,
  },
  areaCard: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  areaHeaderText: {
    flex: 1,
    gap: 2,
  },
  areaTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
    flexShrink: 1,
  },
  areaSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flexShrink: 1,
  },
  projectList: {
    gap: 8,
  },
  areaActionsRow: {
    flexDirection: 'column',
    gap: THEME.spacing.xs,
    marginTop: 2,
  },
  areaActionBtn: {
    width: '100%',
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 8,
  },
  areaActionText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 18,
  },
});
