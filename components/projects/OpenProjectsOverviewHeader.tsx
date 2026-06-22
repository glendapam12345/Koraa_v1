import { View, Text, StyleSheet } from 'react-native';
import { FolderKanban, ListChecks } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type OpenProjectsOverviewHeaderProps = {
  projectCount: number;
  pendingCount: number;
  looseCount: number;
};

export function OpenProjectsOverviewHeader({
  projectCount,
  pendingCount,
  looseCount,
}: OpenProjectsOverviewHeaderProps) {
  const { t } = useI18n();

  const summary =
    projectCount === 0 && looseCount === 0
      ? t('projects.organizedEmptySummary')
      : projectCount === 0
        ? t('projects.organizedLooseOnly', { count: looseCount })
        : t('projects.organizedSummary', {
            projects: projectCount,
            tasks: pendingCount,
          });

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('projects.organizedTitle')}</Text>
      <Text style={styles.sub}>{t('projects.organizedSubtitle')}</Text>

      {projectCount > 0 || looseCount > 0 ? (
        <View style={styles.statsRow}>
          {projectCount > 0 ? (
            <View style={styles.statChip}>
              <FolderKanban size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.statText}>
                {projectCount === 1
                  ? t('projects.organizedProjectOne')
                  : t('projects.organizedProjectMany', { count: projectCount })}
              </Text>
            </View>
          ) : null}
          {pendingCount > 0 ? (
            <View style={styles.statChip}>
              <ListChecks size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.statText}>
                {pendingCount === 1
                  ? t('projects.organizedTaskOne')
                  : t('projects.organizedTaskMany', { count: pendingCount })}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.lavender,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 28,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  statText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  summary: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    lineHeight: 22,
    marginTop: 2,
  },
});
