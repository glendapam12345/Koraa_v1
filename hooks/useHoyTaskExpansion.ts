import { useState, useCallback } from 'react';
import type { Task } from '@/components/tasks/TaskCard';

export function useHoyTaskExpansion() {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedDetailsTasks, setExpandedDetailsTasks] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string> | null>(null);
  const [expandedProjectStepsTasks, setExpandedProjectStepsTasks] = useState<Set<string>>(new Set());
  const [looseTasksExpanded, setLooseTasksExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState('');

  const toggleDetailsExpansion = useCallback((taskId: string) => {
    setExpandedDetailsTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setEditContent(task.content);
    setMenuOpen(null);
  }, []);

  const closeEditTask = useCallback(() => {
    setEditingTask(null);
    setEditContent('');
  }, []);

  const toggleMenu = useCallback((taskId: string) => {
    setMenuOpen((current) => (current === taskId ? null : taskId));
  }, []);

  return {
    expandedTasks,
    expandedDetailsTasks,
    expandedSections,
    setExpandedSections,
    expandedProjectStepsTasks,
    setExpandedProjectStepsTasks,
    looseTasksExpanded,
    onToggleLooseTasksExpanded: () => setLooseTasksExpanded((e) => !e),
    menuOpen,
    setMenuOpen,
    closeMenu: () => setMenuOpen(null),
    toggleMenu,
    editingTask,
    setEditingTask,
    editContent,
    setEditContent,
    toggleDetailsExpansion,
    toggleTaskExpansion,
    handleEditTask,
    closeEditTask,
  };
}
