-- Add support for subtasks
-- This migration adds a parent_task_id column to the tasks table
-- to allow tasks to have subtasks (nested tasks)

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;

-- Index for faster queries of subtasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- Constraint to prevent a task from being its own parent (no cycles)
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS check_no_self_reference;

ALTER TABLE tasks 
ADD CONSTRAINT check_no_self_reference 
CHECK (parent_task_id IS NULL OR parent_task_id != id);

-- Update index to include parent_task_id for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_parent_priority 
ON tasks(user_id, parent_task_id, is_priority, is_completed, created_at DESC);
