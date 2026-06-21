import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { X, CalendarRange, FolderKanban, Layers } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getErrorMessage } from '@/lib/supabase';
import type { Task } from '@/hooks/useTasks';
import {
  computeMaxTasksPerDay,
  redistributeTaskDates,
  redistributeLooseTasks,
  toISODateLocal,
  type RedistributionResult,
} from '@/lib/redistributeWorkload';
import { useI18n } from '@/contexts/I18nContext';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';

type ProjectRow = { id: string; name: string; color: string; due_date: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  tasks: Task[];
  /** Check-in de hoy; si falta, se usan valores neutros para el ritmo. */
  energyLevel: number;
  availableTime: string;
  emotion: string;
  onApplied: () => void;
};

export function RedistributeWorkloadModal({
  visible,
  onClose,
  userId,
  tasks,
  energyLevel,
  availableTime,
  emotion,
  onApplied,
}: Props) {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsLoadError, setProjectsLoadError] = useState<string | null>(null);
  const [supportsProjectDueDate, setSupportsProjectDueDate] = useState(true);
  const [mode, setMode] = useState<'project' | 'loose'>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dueInput, setDueInput] = useState('');
  const [saveDueToProject, setSaveDueToProject] = useState(true);
  const [horizonDays, setHorizonDays] = useState<7 | 14 | 21>(7);
  const [preview, setPreview] = useState<RedistributionResult | null>(null);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Fecha de entrega usada en la vista previa (para guardar en el proyecto). */
  const [appliedDue, setAppliedDue] = useState('');

  const todayStr = useMemo(() => toISODateLocal(new Date()), []);

  const effectiveEnergy = energyLevel > 0 ? energyLevel : 3;
  const effectiveTime = availableTime || 'Medio (2-4hrs)';
  const effectiveEmotion = emotion || 'tranquila';

  const maxPerDay = useMemo(
    () => computeMaxTasksPerDay(effectiveEnergy, effectiveTime, effectiveEmotion),
    [effectiveEnergy, effectiveTime, effectiveEmotion]
  );

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectsLoadError(null);
    setSupportsProjectDueDate(true);

    const { data, supportsDueDate, error: err } = await fetchUserProjects(userId);
    setLoadingProjects(false);

    if (err) {
      setProjects([]);
      setProjectsLoadError(getErrorMessage(err, locale));
      return;
    }

    setSupportsProjectDueDate(supportsDueDate);
    setProjects(data);
  }, [userId, locale]);

  useEffect(() => {
    if (visible && userId) {
      void loadProjects();
      setStep('form');
      setPreview(null);
      setError(null);
      setDueInput('');
      setProjectsLoadError(null);
    }
  }, [visible, userId, loadProjects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const projectTaskIds = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks
      .filter(
        (t) =>
          !t.is_completed &&
          !t.parent_task_id &&
          t.project_id === selectedProjectId
      )
      .sort((a, b) => {
        if (a.is_priority !== b.is_priority) return b.is_priority ? 1 : -1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .map((t) => t.id);
  }, [tasks, selectedProjectId]);

  const looseTaskIds = useMemo(() => {
    return tasks
      .filter((t) => !t.is_completed && !t.parent_task_id && !t.project_id)
      .sort((a, b) => {
        if (a.is_priority !== b.is_priority) return b.is_priority ? 1 : -1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .map((t) => t.id);
  }, [tasks]);

  const handlePreview = () => {
    setError(null);
    if (mode === 'project') {
      if (!selectedProjectId) {
        setError(t('redistribute.pickProject'));
        return;
      }
      if (projectTaskIds.length === 0) {
        setError(t('redistribute.noPendingInProject'));
        return;
      }
      const due =
        selectedProject?.due_date?.trim() ||
        dueInput.trim();
      if (!due) {
        setError(t('redistribute.pickDue'));
        return;
      }
      const result = redistributeTaskDates(projectTaskIds, due, todayStr, maxPerDay, locale);
      if (result.assignments.length === 0 && result.warning) {
        setError(result.warning);
        return;
      }
      setAppliedDue(due);
      setPreview(result);
      setStep('preview');
      return;
    }

    if (looseTaskIds.length === 0) {
      setError(t('redistribute.noLoosePending'));
      return;
    }
    const result = redistributeLooseTasks(looseTaskIds, horizonDays, todayStr, maxPerDay, locale);
    setAppliedDue('');
    setPreview(result);
    setStep('preview');
  };

  const previewSummary = useMemo(() => {
    if (!preview?.assignments.length) return [];
    const byDay = new Map<string, number>();
    for (const a of preview.assignments) {
      byDay.set(a.scheduled_date, (byDay.get(a.scheduled_date) ?? 0) + 1);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [preview]);

  const handleApply = async () => {
    if (!preview?.assignments.length) return;
    setSaving(true);
    setError(null);
    const writtenUpdates: { id: string; previousDate: string | null }[] = [];
    try {
      for (const a of preview.assignments) {
        const parent = tasks.find((t) => t.id === a.id);
        writtenUpdates.push({ id: a.id, previousDate: parent?.scheduled_date ?? null });
        const { error: u1 } = await supabase
          .from('tasks')
          .update({ scheduled_date: a.scheduled_date })
          .eq('id', a.id)
          .eq('user_id', userId);
        if (u1) throw u1;
        const subs = tasks.filter((t) => t.parent_task_id === a.id);
        for (const s of subs) {
          writtenUpdates.push({ id: s.id, previousDate: s.scheduled_date ?? null });
          const { error: u2 } = await supabase
            .from('tasks')
            .update({ scheduled_date: a.scheduled_date })
            .eq('id', s.id)
            .eq('user_id', userId);
          if (u2) throw u2;
        }
      }

      if (mode === 'project' && selectedProjectId && saveDueToProject && appliedDue && supportsProjectDueDate) {
        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update({ due_date: appliedDue })
          .eq('id', selectedProjectId)
          .eq('user_id', userId);
        if (projectUpdateError) {
          setError(t('redistribute.partialDueSave'));
        }
      }

      onApplied();
      onClose();
      setStep('form');
      setPreview(null);
    } catch (e) {
      if (writtenUpdates.length > 0) {
        for (const item of writtenUpdates) {
          await supabase
            .from('tasks')
            .update({ scheduled_date: item.previousDate })
            .eq('id', item.id)
            .eq('user_id', userId);
        }
      }
      setError(getErrorMessage(e, locale));
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (saving) return;
    setStep('form');
    setPreview(null);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('redistribute.title')}</Text>
            <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel={t('redistribute.close')}>
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'form' ? (
              <>
                <Text style={styles.lead}>{t('redistribute.lead', { max: maxPerDay })}</Text>

                <View style={styles.segment}>
                  <TouchableOpacity
                    style={[styles.segBtn, mode === 'project' && styles.segBtnOn]}
                    onPress={() => setMode('project')}
                  >
                    <FolderKanban size={18} color={mode === 'project' ? THEME.colors.onGradient : THEME.colors.text.secondary} />
                    <Text style={[styles.segText, mode === 'project' && styles.segTextOn]}>{t('redistribute.byProject')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segBtn, mode === 'loose' && styles.segBtnOn]}
                    onPress={() => setMode('loose')}
                  >
                    <Layers size={18} color={mode === 'loose' ? THEME.colors.onGradient : THEME.colors.text.secondary} />
                    <Text style={[styles.segText, mode === 'loose' && styles.segTextOn]}>{t('redistribute.loose')}</Text>
                  </TouchableOpacity>
                </View>

                {mode === 'project' ? (
                  <>
                    <Text style={styles.label}>{t('redistribute.projectLabel')}</Text>
                    <Text style={styles.modeExplain}>{t('redistribute.projectExplain')}</Text>
                    {loadingProjects ? (
                      <ActivityIndicator color={THEME.colors.gradient.blue} style={styles.projectsSpinner} />
                    ) : projectsLoadError ? (
                      <View style={styles.projectsErrorBox}>
                        <Text style={styles.projectsErrorText}>{projectsLoadError}</Text>
                        <TouchableOpacity onPress={() => void loadProjects()} style={styles.retryBtn} accessibilityRole="button">
                          <Text style={styles.retryBtnText}>{t('redistribute.retry')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : projects.length === 0 ? (
                      <Text style={styles.hint}>{t('redistribute.noProjects')}</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                        {projects.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              styles.chip,
                              selectedProjectId === p.id && styles.chipOn,
                              { borderLeftWidth: 4, borderLeftColor: p.color || THEME.colors.gradient.blue },
                            ]}
                            onPress={() => {
                              setSelectedProjectId(p.id);
                              setDueInput(p.due_date || '');
                            }}
                          >
                            <Text style={styles.chipText} numberOfLines={1}>
                              {p.name}
                            </Text>
                            {p.due_date ? (
                              <Text style={styles.chipSub}>{p.due_date}</Text>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <Text style={styles.label}>{t('redistribute.dueLabel')}</Text>
                    <TextInput
                      style={styles.input}
                      value={dueInput}
                      onChangeText={setDueInput}
                      placeholder={t('redistribute.duePlaceholder')}
                      placeholderTextColor={THEME.colors.text.secondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{t('redistribute.saveDue')}</Text>
                      <Switch
                        value={saveDueToProject}
                        onValueChange={setSaveDueToProject}
                        disabled={!supportsProjectDueDate}
                      />
                    </View>
                    {!supportsProjectDueDate ? (
                      <Text style={styles.hint}>{t('redistribute.noDueColumn')}</Text>
                    ) : null}

                    <Text style={styles.meta}>
                      {t('redistribute.tasksInProject', { count: projectTaskIds.length })}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>{t('redistribute.distributeDays')}</Text>
                    <View style={styles.horizonRow}>
                      {([7, 14, 21] as const).map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.horizonChip, horizonDays === d && styles.horizonChipOn]}
                          onPress={() => setHorizonDays(d)}
                        >
                          <Text style={[styles.horizonText, horizonDays === d && styles.horizonTextOn]}>
                            {t('redistribute.daysCount', { count: d })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.meta}>{t('redistribute.looseCount', { count: looseTaskIds.length })}</Text>
                  </>
                )}

                {error ? (
                  <View style={styles.errBox}>
                    <Text style={styles.errText}>{error}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.previewTitle}>{t('redistribute.previewTitle')}</Text>
                {preview?.warning ? <Text style={styles.warnText}>{preview.warning}</Text> : null}
                <View style={styles.previewList}>
                  {previewSummary.map(([date, count]) => (
                    <View key={date} style={styles.previewRow}>
                      <CalendarRange size={18} color={THEME.colors.gradient.blue} />
                      <Text style={styles.previewDate}>{date}</Text>
                      <Text style={styles.previewCount}>
                        {count} {count === 1 ? t('redistribute.taskOne') : t('redistribute.taskMany')}
                      </Text>
                    </View>
                  ))}
                </View>
                {error ? (
                  <View style={styles.errBox}>
                    <Text style={styles.errText}>{error}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step === 'preview' ? (
              <>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep('form')} disabled={saving}>
                  <Text style={styles.btnSecondaryText}>{t('redistribute.back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimaryWrap} onPress={handleApply} disabled={saving}>
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnPrimary}
                  >
                    {saving ? (
                      <ActivityIndicator color={THEME.colors.onGradient} />
                    ) : (
                      <Text style={styles.btnPrimaryText}>{t('redistribute.apply')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.btnPrimaryWrap} onPress={handlePreview}>
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>{t('redistribute.calculate')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: Platform.OS === 'web' ? '90%' : '88%',
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  closeBtn: { padding: THEME.spacing.xs },
  body: { paddingHorizontal: THEME.spacing.lg, maxHeight: 420 },
  lead: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 22,
  },
  segment: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
  },
  segBtnOn: { backgroundColor: THEME.colors.gradient.blue },
  segText: { ...THEME.typography.small, color: THEME.colors.text.main, fontFamily: THEME.fonts.heading.medium },
  segTextOn: { color: THEME.colors.onGradient },
  label: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  hint: { ...THEME.typography.caption, color: THEME.colors.text.secondary, marginBottom: THEME.spacing.sm },
  modeExplain: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 18,
  },
  projectsSpinner: { marginVertical: THEME.spacing.sm },
  projectsErrorBox: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.semantic.dangerSoft,
    borderWidth: 1,
    borderColor: THEME.colors.semantic.dangerBorder,
  },
  projectsErrorText: { ...THEME.typography.small, color: THEME.colors.text.main, marginBottom: THEME.spacing.sm },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.gradient.blue,
  },
  retryBtnText: { ...THEME.typography.small, color: THEME.colors.onGradient, fontFamily: THEME.fonts.heading.medium },
  chipsScroll: { marginBottom: THEME.spacing.md },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    maxWidth: 200,
  },
  chipOn: { borderColor: THEME.colors.gradient.blue, backgroundColor: THEME.colors.tint.blue.veryLight },
  chipText: { ...THEME.typography.small, fontFamily: THEME.fonts.heading.medium, color: THEME.colors.text.main },
  chipSub: { ...THEME.typography.caption, color: THEME.colors.text.secondary, marginTop: 2 },
  input: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  switchLabel: { flex: 1, ...THEME.typography.small, color: THEME.colors.text.secondary, paddingRight: THEME.spacing.sm },
  meta: { ...THEME.typography.caption, color: THEME.colors.text.tertiary, marginBottom: THEME.spacing.md },
  horizonRow: { flexDirection: 'row', gap: THEME.spacing.sm, marginBottom: THEME.spacing.md },
  horizonChip: {
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
  },
  horizonChipOn: { backgroundColor: THEME.colors.gradient.blue },
  horizonText: { ...THEME.typography.small, color: THEME.colors.text.main },
  horizonTextOn: { color: THEME.colors.onGradient, fontFamily: THEME.fonts.heading.medium },
  errBox: {
    backgroundColor: THEME.colors.errorSurface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    marginBottom: THEME.spacing.sm,
  },
  errText: { ...THEME.typography.small, color: THEME.colors.gradient.pink },
  previewTitle: {
    ...THEME.typography.h3,
    marginBottom: THEME.spacing.sm,
    color: THEME.colors.text.main,
  },
  warnText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    fontStyle: 'italic',
  },
  previewList: { gap: THEME.spacing.sm },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  previewDate: { flex: 1, ...THEME.typography.body, color: THEME.colors.text.main },
  previewCount: { ...THEME.typography.small, color: THEME.colors.text.secondary },
  footer: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
  btnSecondary: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
  },
  btnSecondaryText: { ...THEME.typography.body, color: THEME.colors.text.main },
  btnPrimaryWrap: { flex: 1, borderRadius: THEME.borderRadius.rounded, overflow: 'hidden' },
  btnPrimary: {
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimaryText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
