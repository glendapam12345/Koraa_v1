/*
  # Remove Unused Indexes - Security Fix
  
  This migration removes indexes that are currently not being used by PostgreSQL query planner.
  
  ## Indexes Removed
  
  1. `idx_tasks_user_id` - Simple index on tasks.user_id
     - Reason: Not used by query planner in current query patterns
     
  2. `idx_daily_check_ins_user_id` - Simple index on daily_check_ins.user_id
     - Reason: Not used by query planner in current query patterns
     
  3. `idx_tasks_parent` - Simple index on tasks.parent_task_id
     - Reason: Not used by query planner in current query patterns
     
  4. `idx_tasks_user_parent_priority` - Composite index on tasks
     - Reason: Not used by query planner, may be too specific
  
  ## Note
  
  These indexes may not be used because:
  - The database has minimal data (small tables)
  - PostgreSQL finds full table scans faster
  - RLS policies already filter efficiently
  
  As the database grows, we may need to re-evaluate indexing strategy.
  
  ## Additional Security Notes
  
  The following security issues require manual configuration in Supabase Dashboard:
  
  1. **Auth DB Connection Strategy**: 
     - Go to: Dashboard → Database → Performance Advisor
     - Change from fixed number (10) to percentage-based allocation
     
  2. **Leaked Password Protection**:
     - Go to: Dashboard → Authentication → Settings → Security
     - Enable "Leaked Password Protection" (checks against HaveIBeenPwned.org)
*/

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_tasks_user_id;
DROP INDEX IF EXISTS public.idx_daily_check_ins_user_id;
DROP INDEX IF EXISTS public.idx_tasks_parent;
DROP INDEX IF EXISTS public.idx_tasks_user_parent_priority;
