import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useWeekTasks, getWeekOptions } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import { Calendar, Plus, FolderKanban, FileText, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SemanaScreen() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  const { weekTasks, projects, loading, loadWeekTasks, getWeekBounds } = useWeekTasks(showToast);

  const currentWeekStart = getWeekBounds().start;
  const weekOptions = useMemo(() => getWeekOptions(6), []);

  useEffect(() => {
    loadWeekTasks(selectedWeekStart || undefined);
  }, [loadWeekTasks, selectedWeekStart]);

  const handleSelectWeek = useCallback((start: string) => {
    setSelectedWeekStart(start);
  }, []);

  const projectsMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const weekLabel =
    weekTasks.length === 7
      ? (() => {
          const d0 = weekTasks[0].day.dateStr;
          const d6 = weekTasks[6].day.dateStr;
          const day0 = d0.slice(8);
          const day6 = d6.slice(8);
          const month = monthNames[parseInt(d0.slice(5, 7), 10) - 1];
          return `${day0} - ${day6} ${month}`;
        })()
      : '';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadWeekTasks}
            tintColor={THEME.colors.gradient.blue}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCalendarButton}
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir y agregar tareas"
          >
            <Calendar size={24} color={THEME.colors.gradient.blue} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Tu semana</Text>
            <Text style={styles.subtitle}>
              Elige una semana y ve tus tareas por día
            </Text>
          </View>
        </View>

        <Text style={styles.weekSelectorHint}>Desliza para elegir otra semana</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekSelectorScroll}
          contentContainerStyle={styles.weekSelectorContent}
        >
          {weekOptions.map((opt) => {
            const isSelected =
              (opt.start === currentWeekStart && !selectedWeekStart) ||
              selectedWeekStart === opt.start;
            return (
              <TouchableOpacity
                key={opt.start}
                style={[styles.weekChip, isSelected && styles.weekChipSelected]}
                onPress={() => handleSelectWeek(opt.start)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Semana ${opt.label}`}
              >
                <Text
                  style={[
                    styles.weekChipText,
                    isSelected && styles.weekChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {weekLabel ? (
          <Text style={styles.weekRange}>{weekLabel}</Text>
        ) : null}

        {loading ? (
          <Text style={styles.loadingWeek}>Cargando días...</Text>
        ) : null}

        {!loading && weekTasks.map(({ day, tasks }) => (
          <View key={day.dateStr} style={styles.daySection}>
            <View
              style={[
                styles.dayHeader,
                day.isToday && styles.dayHeaderToday,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  day.isToday && styles.dayLabelToday,
                ]}
                numberOfLines={1}
              >
                {day.label}
              </Text>
              {day.isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Hoy</Text>
                </View>
              )}
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>Sin tareas este día</Text>
                <TouchableOpacity
                  style={styles.addDayButton}
                  onPress={() => router.push(`/(tabs)/vaciar?date=${day.dateStr}`)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar tareas para ${day.label}`}
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.addDayButtonText}>Agregar tareas o proyectos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.taskList}>
                  {tasks.map((task) => (
                    <WeekTaskItem
                      key={task.id}
                      task={task}
                      projectName={
                        task.project_id
                          ? projectsMap[task.project_id]?.name || 'Proyecto'
                          : null
                      }
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addDayButton}
                  onPress={() => router.push(`/(tabs)/vaciar?date=${day.dateStr}`)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar más tareas para ${day.label}`}
                >
                  <Plus size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.addDayButtonText}>Agregar tareas o proyectos</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/vaciar')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Agregar tareas o proyectos"
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar tareas o proyectos</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function WeekTaskItem({
  task,
  projectName,
}: {
  task: Task;
  projectName: string | null;
}) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskRow}>
        <View
          style={[
            styles.taskCheck,
            task.is_completed && styles.taskCheckCompleted,
          ]}
        />
        <View style={styles.taskBody}>
          {projectName ? (
            <View style={styles.projectBadge}>
              <FolderKanban size={12} color={THEME.colors.gradient.blue} />
              <Text style={styles.projectBadgeText}>{projectName}</Text>
            </View>
          ) : (
            <View style={styles.standaloneBadge}>
              <FileText size={12} color={THEME.colors.text.secondary} />
              <Text style={styles.standaloneBadgeText}>Tarea suelta</Text>
            </View>
          )}
          <Text
            style={[
              styles.taskContent,
              task.is_completed && styles.taskContentCompleted,
            ]}
            numberOfLines={2}
          >
            {task.content}
          </Text>
          {hasSubtasks && (
            <View style={styles.subtasksList}>
              {task.subtasks!.map((st) => (
                <View key={st.id} style={styles.subtaskRow}>
                  <ChevronRight size={14} color={THEME.colors.text.secondary} />
                  <Text
                    style={[
                      styles.subtaskContent,
                      st.is_completed && styles.taskContentCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {st.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  headerCalendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  weekSelectorHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xs,
  },
  weekRange: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
  },
  loadingWeek: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  weekSelectorScroll: {
    marginBottom: THEME.spacing.sm,
    maxHeight: 44,
  },
  weekSelectorContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  weekChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  weekChipSelected: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  weekChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
  },
  weekChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  daySection: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
  },
  dayHeaderToday: {
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  dayLabel: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.text.main,
  },
  dayLabelToday: {
    color: THEME.colors.gradient.blue,
  },
  todayBadge: {
    marginLeft: THEME.spacing.sm,
    backgroundColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.standard,
  },
  todayBadgeText: {
    ...THEME.typography.small,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyDay: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  emptyDayText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: THEME.spacing.sm,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    backgroundColor: THEME.colors.fill[100],
    marginTop: THEME.spacing.xs,
  },
  addDayButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
  },
  taskList: {
    gap: THEME.spacing.xs,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    marginTop: 2,
  },
  taskCheckCompleted: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  taskBody: {
    flex: 1,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  projectBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  standaloneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  standaloneBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  taskContent: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  taskContentCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksList: {
    marginTop: THEME.spacing.xs,
    paddingLeft: THEME.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.fill[200],
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  subtaskContent: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  addButton: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  addButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
});
