/*
  # Fix Security Issues

  1. Remove Unused Index
    - Drop `idx_tasks_user_priority` index that is not being used
    - This index was created but queries don't utilize it

  2. Notes
    - Auth DB connection strategy and password leak protection require
      configuration changes in Supabase dashboard or via Auth API
*/

-- Remove unused index on tasks table
DROP INDEX IF EXISTS idx_tasks_user_priority;
