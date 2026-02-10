/*
  # Fix Security Issues - Add Foreign Key Indexes

  1. Performance Improvements
    - Add index on `tasks.user_id` foreign key for optimal query performance
    - Add index on `daily_check_ins.user_id` foreign key for optimal query performance
    - Drop `idx_tasks_user_priority` index that is not being used

  2. Security Notes
    - Auth DB connection strategy: Change to Percentage in Dashboard → Database → Performance Advisor
    - Leaked password protection: Enable in Dashboard → Authentication → Settings → Security
*/

-- Remove unused index on tasks table
DROP INDEX IF EXISTS idx_tasks_user_priority;

-- Add indexes for foreign key columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_id ON public.daily_check_ins(user_id);