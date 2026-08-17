import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { prioritizeTasksIntelligently } from '@/lib/smartPrioritization';
import { markOnboardingCompletedIfNeeded } from '@/lib/onboardingGate';
import { getFocusedProjectId } from '@/lib/focusedProjectStorage';
import { logger } from '@/lib/logger';
import { fetchCurrentStreak, isStreakMilestone } from '@/lib/streak';
import type { AppLocale } from '@/lib/i18n';
import type { Task } from '@/components/tasks/TaskCard';
import type { CheckInReplanSummary } from '@/lib/checkInReplanSummary';
import { fetchAndApplyKoraaBrainFocusPlan } from '@/lib/ai/fetchAndApplyKoraaBrainFocusPlan';
import { clearKoraaDailyBriefCache } from '@/lib/ai/koraaDailyBriefCache';
import { seedHoyLiteFirstDayIfUnset } from '@/lib/hoyLiteDay';
import { trackCohortDay0Once } from '@/lib/retentionD1';
import { track } from '@/lib/analytics';

export type DailyCheckInInput = {
  userId: string;
  emotion: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
  locale: AppLocale;
  displayName?: string;
  emotionLabel?: string;
};

export type SaveCheckInResult = {
  success: boolean;
  offline?: boolean;
  errorMessage?: string;
  /** Perfil no marcó onboarding_completed; el check-in sí se guardó. */
  onboardingMarkFailed?: boolean;
  celebration?: { streak: number; milestone: boolean } | null;
  replan?: CheckInReplanSummary | null;
};

export async function prioritizeTasksForCheckIn(
  userId: string,
  input: Pick<
    DailyCheckInInput,
    'energyLevel' | 'emotion' | 'availableTime' | 'focusLevel' | 'locale' | 'displayName' | 'emotionLabel'
  >,
): Promise<void> {
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('created_at', { ascending: false });

  if (tasksError || !tasks?.length) return;

  const focusedProjectId = await getFocusedProjectId(userId);
  const scopedTasks = focusedProjectId
    ? tasks.filter((task: Task) => task.project_id === focusedProjectId)
    : tasks;

  if (!scopedTasks.length) return;

  const brainResult = await fetchAndApplyKoraaBrainFocusPlan(
    userId,
    {
      locale: input.locale,
      displayName: input.displayName ?? '',
      emotion: input.emotion,
      emotionLabel: input.emotionLabel ?? input.emotion,
      energyLevel: input.energyLevel,
      availableTime: input.availableTime,
      focusLevel: input.focusLevel,
    },
    scopedTasks as Task[],
  );

  if (brainResult.applied) return;

  const previousPriorityTaskIds = tasks
    .filter((task: { is_priority: boolean }) => task.is_priority)
    .map((task: { id: string }) => task.id);

  const tasksMap = new Map<string, Task & { subtasks: Task[] }>();
  const mainTasks: Array<Task & { subtasks: Task[] }> = [];

  tasks.forEach((task: Task) => {
    const taskWithSubtasks = { ...task, subtasks: [] as Task[] };
    tasksMap.set(task.id, taskWithSubtasks);
    if (!task.parent_task_id && scopedTasks.some((st: Task) => st.id === task.id)) {
      mainTasks.push(taskWithSubtasks);
    }
  });

  tasks.forEach((task: Task) => {
    if (task.parent_task_id) {
      const parent = tasksMap.get(task.parent_task_id);
      const child = tasksMap.get(task.id);
      if (parent && child) parent.subtasks.push(child);
    }
  });

  try {
    const today = getLocalDateString();
    await AsyncStorage.setItem(
      `prioritization_${userId}_${today}`,
      JSON.stringify({ totalTasksBefore: mainTasks.length, date: today }),
    );
  } catch {
    /* non-critical */
  }

  const prioritizedTasks = prioritizeTasksIntelligently(
    mainTasks,
    {
      energyLevel: input.energyLevel,
      emotion: input.emotion,
      availableTime: input.availableTime,
      focusLevel: input.focusLevel,
    },
    input.locale,
  );

  const { error: unprioritizeError } = await supabase
    .from('tasks')
    .update({ is_priority: false })
    .eq('user_id', userId)
    .eq('is_completed', false);

  if (unprioritizeError) return;

  if (prioritizedTasks.length > 0) {
    const taskIds = prioritizedTasks.map((t) => t.id);
    const { error: prioritizeError } = await supabase
      .from('tasks')
      .update({ is_priority: true })
      .in('id', taskIds);

    if (prioritizeError && previousPriorityTaskIds.length > 0) {
      await supabase.from('tasks').update({ is_priority: true }).in('id', previousPriorityTaskIds);
    }
  }
}

export async function saveDailyCheckInAndPrioritize(input: DailyCheckInInput): Promise<SaveCheckInResult> {
  const today = getLocalDateString();
  const emotionStored = input.emotion.trim().toLowerCase();

  const { error: checkInError } = await supabase.from('daily_check_ins').upsert(
    {
      user_id: input.userId,
      date: today,
      emotion: emotionStored,
      energy_level: input.energyLevel,
      available_time: input.availableTime,
      focus_level: input.focusLevel,
    },
    { onConflict: 'user_id,date' },
  );

  let offline = false;

  if (checkInError) {
    const msg = checkInError.message?.toLowerCase() ?? '';
    const isNetwork =
      msg.includes('network') || msg.includes('fetch') || msg.includes('connection');
    if (isNetwork) {
      const { saveCheckInOffline } = await import('@/lib/offlineStorage');
      await saveCheckInOffline({
        date: today,
        emotion: emotionStored,
        energy_level: input.energyLevel,
        available_time: input.availableTime,
        focus_level: input.focusLevel,
      });
      offline = true;
    } else {
      return { success: false, errorMessage: checkInError.message };
    }
  }

  await clearKoraaDailyBriefCache(input.userId);

  await prioritizeTasksForCheckIn(input.userId, {
    energyLevel: input.energyLevel,
    emotion: emotionStored,
    availableTime: input.availableTime,
    focusLevel: input.focusLevel,
    locale: input.locale,
    displayName: input.displayName,
    emotionLabel: input.emotionLabel,
  });

  // Dates stay as they are until the person accepts a replan in Hoy.
  const replan: SaveCheckInResult['replan'] = null;

  const { error: onboardingError, newlyCompleted } = await markOnboardingCompletedIfNeeded(
    input.userId,
  );
  if (newlyCompleted) {
    await seedHoyLiteFirstDayIfUnset(input.userId);
    void track('onboarding_completed', { source: 'check_in' });
    await trackCohortDay0Once(input.userId, undefined, 'check_in');
  }
  if (onboardingError) {
    logger.debug('checkInService: onboarding mark failed', onboardingError.message);
  }

  let celebration: SaveCheckInResult['celebration'] = null;
  if (!offline) {
    try {
      const streak = await fetchCurrentStreak(supabase, input.userId);
      celebration = { streak, milestone: isStreakMilestone(streak) };
    } catch {
      celebration = null;
    }
  }

  if (!offline) {
    void import('@/hooks/useNotifications').then(({ scheduleRecheckReminder }) =>
      scheduleRecheckReminder(input.locale),
    );
  }

  return {
    success: true,
    offline,
    onboardingMarkFailed: Boolean(onboardingError),
    celebration,
    replan,
  };
}
