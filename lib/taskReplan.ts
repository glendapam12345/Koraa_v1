import { supabase } from '@/lib/supabase';

export { getNextWeekDateString, getTomorrowDateString } from '@/lib/taskReplanDates';

export async function rescheduleTask(taskId: string, scheduledDate: string | null) {
  return supabase.from('tasks').update({ scheduled_date: scheduledDate }).eq('id', taskId);
}

export async function moveTaskToProject(taskId: string, projectId: string | null) {
  return supabase.from('tasks').update({ project_id: projectId }).eq('id', taskId);
}
