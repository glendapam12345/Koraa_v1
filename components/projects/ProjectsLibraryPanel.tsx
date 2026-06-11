import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import {
  FolderKanban,
  ChevronRight,
  Plus,
  Heart,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';
import { useProjectsLibrary } from '@/hooks/useProjectsLibrary';
import { ProjectExpandableCard } from '@/components/projects/ProjectExpandableCard';

type ProjectsLibraryPanelProps = {
  userId: string | undefined;
  /** En pestaña Tareas: sin ScrollView propio; CTAs vuelven a Capturar. */
  embedded?: boolean;
  onGoCapture?: () => void;
  onAddTaskToProject?: (projectId: string | null) => void;
};

export function ProjectsLibraryPanel({
  userId,
  embedded = false,
  onGoCapture,
  onAddTaskToProject,
}: ProjectsLibraryPanelProps) {
  const { t } = useI18n();
  const {
    projects,
    looseCount,
    totalIncomplete,
    focusIncomplete,
    hasCheckInToday,
    loading,
    refreshing,
    refresh,
    reload,
  } = useProjectsLibrary(userId);

  useFocusEffect(
    useCallback(() => {
      if (embedded) void reload();
    }, [embedded, reload]),
  );

  const goCapture = useCallback(() => {
    if (embedded && onGoCapture) {
      onGoCapture();
      return;
    }
    router.push('/(tabs)/vaciar');
  }, [embedded, onGoCapture]);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('projects.signIn')}</Text>
      </View>
    );
  }

  const body =
    loading ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
        <Text style={styles.loadingText}>{t('projects.loading')}</Text>
      </View>
    ) : projects.length === 0 && looseCount === 0 ? (
      <View style={styles.empty}>
        <LinearGradient
          colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft]}
          style={styles.emptyIconWrap}
        >
          <FolderKanban size={48} color={THEME.colors.gradient.blue} strokeWidth={1.5} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{t('projects.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('projects.emptyBody')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={goCapture}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            embedded ? t('vaciar.segmentGoCaptureA11y') : t('projects.goTasksA11y')
          }
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>
              {embedded ? t('vaciar.segmentGoCapture') : t('projects.goTasks')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {!embedded ? (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel={t('projects.back')}
          >
            <Text style={styles.backLinkText}>{t('projects.back')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : (
      <>
        {!loading && totalIncomplete > 0 ? (
          <View style={styles.inventoryBanner}>
            <Text style={styles.inventorySummary}>
              {hasCheckInToday
                ? focusIncomplete > 0
                  ? t('projects.inventorySummary', { total: totalIncomplete, focus: focusIncomplete })
                  : t('projects.inventoryCheckInNoFocus', { total: totalIncomplete })
                : t('projects.inventoryNoFocus', { total: totalIncomplete })}
            </Text>
            <Text style={styles.inventorySub}>{t('projects.inventorySub')}</Text>
            {!hasCheckInToday ? (
              <TouchableOpacity
                style={styles.inventoryFeelBtn}
                onPress={() => router.push(CHECK_IN_ROUTE)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('projects.inventoryGoFeelA11y')}
              >
                <Heart size={16} color={THEME.colors.gradient.pink} />
                <Text style={styles.inventoryFeelText}>{t('projects.inventoryGoFeel')}</Text>
                <ChevronRight size={16} color={THEME.colors.gradient.blue} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.addProjectSection}
          onPress={goCapture}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('projects.addA11y')}
        >
          <View style={styles.addProjectIconWrap}>
            <Plus size={22} color={THEME.colors.gradient.blue} strokeWidth={2.2} />
          </View>
          <View style={styles.addProjectTextWrap}>
            <Text style={styles.addProjectTitle}>{t('projects.addSection')}</Text>
            <Text style={styles.addProjectHint}>{t('projects.addHint')}</Text>
          </View>
          <ChevronRight size={20} color={THEME.colors.gradient.blue} />
        </TouchableOpacity>

        {looseCount > 0 ? (
          <View style={styles.looseSection}>
            {projects.length > 0 && (
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionLabelLine} />
                <Text style={styles.sectionLabel}>{t('projects.looseSection')}</Text>
              </View>
            )}
            <ProjectExpandableCard
              mode="loose"
              looseCount={looseCount}
              userId={userId!}
              onAddTask={onAddTaskToProject}
              onChanged={reload}
            />
          </View>
        ) : null}
        {projects.length > 0 ? (
          <>
            {looseCount > 0 && (
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionLabelLine} />
                <Text style={styles.sectionLabel}>{t('projectsUi.sectionTitle')}</Text>
              </View>
            )}
            {projects.map((project) => (
              <ProjectExpandableCard
                key={project.id}
                mode="project"
                project={project}
                userId={userId!}
                onAddTask={onAddTaskToProject}
                onChanged={reload}
              />
            ))}
          </>
        ) : null}
      </>
    );

  if (embedded) {
    return <View style={styles.embeddedWrap}>{body}</View>;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={THEME.colors.gradient.blue}
        />
      }
    >
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md + 4,
    paddingBottom: THEME.spacing.xl + THEME.spacing.sm,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  inventoryBanner: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  inventorySummary: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  inventorySub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    lineHeight: 20,
  },
  inventoryFeelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  inventoryFeelText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  addProjectSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.md + 4,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  addProjectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProjectTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  addProjectTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  addProjectHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md + 4,
    overflow: 'hidden',
  },
  emptyTitle: {
    ...THEME.typography.h3,
    fontSize: 22,
    color: THEME.colors.text.main,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    fontSize: 15,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: THEME.spacing.sm,
  },
  addButton: {
    marginTop: THEME.spacing.xl + 4,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addButtonGradient: {
    paddingVertical: THEME.spacing.sm + 6,
    paddingHorizontal: THEME.spacing.xl + 8,
  },
  addButtonText: {
    ...THEME.typography.body,
    fontSize: 16,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  backLink: {
    marginTop: THEME.spacing.md + 4,
    paddingVertical: THEME.spacing.xs,
  },
  backLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.sm + 4,
    paddingVertical: THEME.spacing.md + 2,
    paddingRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.card,
  },
  looseSection: {
    marginBottom: THEME.spacing.md + 4,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs + 2,
    gap: THEME.spacing.xs,
  },
  sectionLabelLine: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: THEME.colors.gradient.blue,
    opacity: 0.6,
  },
  sectionLabel: {
    ...THEME.typography.small,
    fontSize: 13,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    letterSpacing: 0.3,
  },
  cardLoose: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md + 4,
    paddingRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  cardLooseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  colorBarLoose: {
    width: 4,
    height: '100%',
    minHeight: 56,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardLooseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.standard + 2,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  cardLooseTitle: {
    ...THEME.typography.body,
    fontSize: 17,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  cardLooseHint: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.tertiary,
    marginTop: 4,
  },
  cardLooseMeta: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  colorBar: {
    width: 5,
    height: '100%',
    minHeight: 48,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    ...THEME.typography.body,
    fontSize: 17,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: 6,
  },
  cardMetaText: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaTextDone: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.semantic.success,
    fontFamily: THEME.fonts.heading.medium,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
});
