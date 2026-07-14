import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, PencilLine } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
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
  const showExplainer =
    !hideExplainer &&
    Boolean(explainer.trim()) &&
    explainer !== 'projects.areaGroupedExplainer';

  return (
    <View style={styles.wrap}>
      {showExplainer ? (
        <CalmCard style={styles.explainerCard}>
          <Text style={styles.explainer}>{explainer}</Text>
        </CalmCard>
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
  const areaLabel = t(`lifeAreas.${area.key}` as TranslationKey);

  return (
    <View
      style={[
        styles.areaCard,
        {
          borderLeftColor: theme.accent,
          borderColor: theme.border,
          backgroundColor: THEME.colors.fill[100],
        },
      ]}
    >
      <View style={[styles.areaHeader, { backgroundColor: theme.bg }]}>
        <View style={[styles.areaColorDot, { backgroundColor: theme.accent }]} />
        <Text style={styles.areaEmoji} accessibilityLabel={areaLabel}>
          {area.emoji}
        </Text>
        <View style={styles.areaHeaderText}>
          <Text style={[styles.areaTitle, { color: theme.accent }]}>{areaLabel}</Text>
          <Text style={styles.areaSub}>
            {projects.length === 0
              ? t('projects.areaEmpty')
              : projects.length === 1
                ? t('projects.areaProjectCountOne')
                : t('projects.areaProjectCount', { count: projects.length })}
          </Text>
        </View>
      </View>

      <View style={styles.areaBody}>
        {projects.length > 0 ? (
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
          </View>
        ) : null}

        <View style={styles.areaActionsRow}>
          <TouchableOpacity
            style={styles.areaActionBtnPrimary}
            onPress={() => onCreateProjectInArea?.(area.key)}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={t('projects.createInAreaA11y', { area: areaLabel })}
          >
            <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.areaActionText}>{t('projects.createInArea')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.areaActionBtnMuted}
            onPress={() => onEditAreas?.()}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={t('projects.editAreasA11y')}
          >
            <PencilLine size={14} color={THEME.colors.text.secondary} />
            <Text style={[styles.areaActionText, styles.areaActionTextMuted]}>
              {t('projects.editAreas')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.layout.sectionGapCompact,
  },
  explainerCard: {
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  explainer: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  areaCard: {
    borderLeftWidth: 3,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  areaColorDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.spacing.xs / 2,
    flexShrink: 0,
  },
  areaEmoji: {
    ...THEME.typography.displayEmojiMd,
    flexShrink: 0,
  },
  areaHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
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
  areaBody: {
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  projectList: {
    gap: THEME.spacing.xs,
  },
  areaActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  areaActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: 36,
  },
  areaActionBtnMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    minHeight: 36,
  },
  areaActionText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
    flexShrink: 1,
  },
  areaActionTextMuted: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
