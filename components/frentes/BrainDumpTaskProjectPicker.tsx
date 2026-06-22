import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderKanban, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatProjectDueDate } from '@/lib/projectProgress';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  assignItemToProject,
  projectsForLifeArea,
  type BrainDumpReviewProject,
} from '@/lib/review/brainDumpProjects';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

type BrainDumpTaskProjectPickerProps = {
  item: EnrichedCaptureItem;
  projects: BrainDumpReviewProject[];
  locale: 'es' | 'en';
  onChange: (item: EnrichedCaptureItem) => void;
  onRequestCreateProject?: () => void;
};

export function BrainDumpTaskProjectPicker({
  item,
  projects,
  locale,
  onChange,
  onRequestCreateProject,
}: BrainDumpTaskProjectPickerProps) {
  const { t } = useI18n();

  if (!item.lifeAreaKey) {
    return null;
  }

  const areaRef = item.lifeAreaKey as LifeAreaRef;
  const areaProjects = projectsForLifeArea(projects, areaRef);
  const selected = areaProjects.find((project) => project.id === item.selectedProjectId);

  const handleSelect = (projectId: string | null) => {
    const assignment = assignItemToProject(Boolean(projectId), projectId);
    onChange({ ...item, ...assignment });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('vaciar.areaReviewProjectSection')}</Text>

      <TouchableOpacity
        style={[styles.option, !item.assignToProject ? styles.optionActive : null]}
        onPress={() => handleSelect(null)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ selected: !item.assignToProject }}
      >
        <View style={styles.optionBody}>
          <Text style={styles.optionLabel}>{t('vaciar.areaReviewLooseInArea')}</Text>
          <Text style={styles.optionSub}>{t('vaciar.areaReviewLooseInAreaHint')}</Text>
        </View>
      </TouchableOpacity>

      {areaProjects.map((project) => {
        const active = item.selectedProjectId === project.id;
        return (
          <TouchableOpacity
            key={project.id}
            style={[styles.option, active ? styles.optionActive : null]}
            onPress={() => handleSelect(project.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.dot, { backgroundColor: project.color ?? THEME.colors.gradient.blue }]} />
            <View style={styles.optionBody}>
              <Text style={styles.optionLabel}>{project.name}</Text>
              {project.due_date ? (
                <Text style={styles.optionMeta}>
                  {formatProjectDueDate(project.due_date, locale)}
                </Text>
              ) : null}
              {project.isDraft ? (
                <Text style={styles.draftBadge}>{t('vaciar.areaReviewDraftProject')}</Text>
              ) : null}
            </View>
            {active ? <FolderKanban size={16} color={THEME.colors.calm.lavenderDeep} /> : null}
          </TouchableOpacity>
        );
      })}

      {onRequestCreateProject ? (
        <TouchableOpacity
          style={styles.createLink}
          onPress={onRequestCreateProject}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.createLinkText}>{t('vaciar.areaReviewCreateProjectInline')}</Text>
        </TouchableOpacity>
      ) : null}

      {selected ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => handleSelect(null)}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.clearProjectA11y')}
        >
          <X size={14} color={THEME.colors.text.secondary} />
          <Text style={styles.clearText}>{t('vaciar.areaReviewClearProject')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  optionActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  optionSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  optionMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  draftBadge: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
  },
  createLink: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  createLinkText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
