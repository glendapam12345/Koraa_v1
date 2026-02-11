/*
  # Add Foreign Key Indexes - Security Fix
  
  This migration adds indexes on foreign key columns to improve query performance
  and address security advisor warnings.
  
  ## Changes Made
  
  1. **Added index on `tasks.user_id`**
     - Covers the foreign key `tasks_user_id_fkey`
     - Improves performance for queries filtering tasks by user
     - Essential for efficient JOIN operations with profiles table
     
  2. **Added index on `tasks.parent_task_id`**
     - Covers the foreign key `tasks_parent_task_id_fkey`
     - Improves performance for subtask queries
     - Essential for efficient CASCADE operations on task deletion
  
  ## Why These Indexes Are Important
  
  - **Performance**: As data grows, queries filtering by these columns will benefit significantly
  - **Referential Integrity**: PostgreSQL uses these indexes to efficiently maintain foreign key constraints
  - **JOIN Operations**: Indexes speed up JOINs between tasks and profiles tables
  - **CASCADE Operations**: When deleting a parent task or user, indexed foreign keys make cascade operations faster
  
  ## Manual Configuration Required
  
  The following security issues require manual configuration in Supabase Dashboard:
  
  1. **Auth DB Connection Strategy** (Currently: Fixed at 10 connections):
     - Navigate to: Dashboard → Database → Configuration
     - Change connection pool from fixed number to percentage-based allocation
     - Recommended: 10-20% of max connections
     - This allows the Auth server to scale with your database instance
     
  2. **Leaked Password Protection** (Currently: Disabled):
     - Navigate to: Dashboard → Authentication → Policies
     - Enable "Breach Password Protection"
     - This checks new passwords against HaveIBeenPwned.org database
     - Prevents users from using compromised passwords
*/

-- Add index on tasks.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_tasks_user_id 
ON tasks(user_id);

-- Add index on tasks.parent_task_id foreign key
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id 
ON tasks(parent_task_id);

-- Verify indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Foreign key indexes created successfully';
  RAISE NOTICE '✓ idx_tasks_user_id - covers tasks_user_id_fkey';
  RAISE NOTICE '✓ idx_tasks_parent_task_id - covers tasks_parent_task_id_fkey';
  RAISE NOTICE '';
  RAISE NOTICE 'Manual configuration still required:';
  RAISE NOTICE '1. Auth DB Connection Strategy: Switch to percentage-based';
  RAISE NOTICE '2. Leaked Password Protection: Enable in Auth settings';
END $$;