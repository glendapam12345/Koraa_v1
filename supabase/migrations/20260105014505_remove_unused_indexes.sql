/*
  # Remove Unused Indexes (NOT RECOMMENDED)

  This migration removes indexes that haven't been used yet.
  These indexes are proactive optimizations that will benefit
  query performance as the database scales.

  ## Removed Indexes
  
  - idx_daily_check_ins_user_date
  - idx_tasks_user_completed

  ## Warning
  
  Removing these indexes may cause performance degradation as
  data volume increases. Only proceed if you're certain these
  query patterns won't be needed.
*/

DROP INDEX IF EXISTS idx_daily_check_ins_user_date;
DROP INDEX IF EXISTS idx_tasks_user_completed;
