import { StyleSheet, TouchableOpacity } from 'react-native';
import { lazy, Suspense } from 'react';
import { Toast } from '@/components/Toast';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';
import { TaskPlanEditSheet } from '@/components/vnext/TaskPlanEditSheet';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { TaskPlanEditPayload } from '@/lib/vnext/saveTaskPlanEdit';

const ConfettiCelebration = lazy(() =>
  import('@/components/ConfettiCelebration')
    .then((module) => ({ default: module.ConfettiCelebration }))
    .catch(() => ({ default: () => null as any })),
);

export type HoyScreenOverlaysProps = {
  menuOpen: string | null;
  onCloseMenu: () => void;
  editingTask: Task | null;
  editProjects?: { id: string; name: string }[];
  userId?: string;
  onProjectCreated?: (project: { id: string; name: string }) => void;
  onSavePlanEdit: (payload: TaskPlanEditPayload) => void | Promise<void>;
  onDeleteEditingTask?: () => void | Promise<void>;
  planEditSaving?: boolean;
  onCloseEdit: () => void;
  showConfetti: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  onHideToast: () => void;
  showQuickOnboarding: boolean;
  onCloseQuickOnboarding: () => void;
};

export function HoyScreenOverlays({
  menuOpen,
  onCloseMenu,
  editingTask,
  editProjects = [],
  userId,
  onProjectCreated,
  onSavePlanEdit,
  onDeleteEditingTask,
  planEditSaving = false,
  onCloseEdit,
  showConfetti,
  toastMessage,
  toastType,
  onHideToast,
  showQuickOnboarding,
  onCloseQuickOnboarding,
}: HoyScreenOverlaysProps) {
  const { t } = useI18n();

  return (
    <>
      {menuOpen ? (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={onCloseMenu}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.closeMenuA11y')}
          accessibilityHint={t('hoyExtra.closeMenuHint')}
        />
      ) : null}

      {editingTask !== null ? (
        <TaskPlanEditSheet
          visible={editingTask !== null}
          task={editingTask}
          projects={editProjects}
          userId={userId}
          onProjectCreated={onProjectCreated}
          onSave={onSavePlanEdit}
          onDelete={onDeleteEditingTask}
          onClose={onCloseEdit}
          saving={planEditSaving}
        />
      ) : null}

      {showConfetti ? (
        <Suspense fallback={null}>
          <ConfettiCelebration />
        </Suspense>
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onHide={onHideToast} />
      ) : null}

      <QuickOnboardingModal visible={showQuickOnboarding} onClose={onCloseQuickOnboarding} />
    </>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
