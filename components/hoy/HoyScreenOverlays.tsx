import { StyleSheet, TouchableOpacity, ActivityIndicator, View as ViewRN } from 'react-native';
import { lazy, Suspense } from 'react';
import { THEME } from '@/constants/theme';
import { Toast } from '@/components/Toast';
import { QuickOnboardingModal } from '@/components/onboarding/QuickOnboardingModal';
import { RedistributeWorkloadModal } from '@/components/tasks/RedistributeWorkloadModal';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';

const TaskEditModal = lazy(() =>
  import('@/components/tasks/TaskEditModal')
    .then((module) => ({ default: module.TaskEditModal }))
    .catch(() => ({ default: () => null as any })),
);

const ConfettiCelebration = lazy(() =>
  import('@/components/ConfettiCelebration')
    .then((module) => ({ default: module.ConfettiCelebration }))
    .catch(() => ({ default: () => null as any })),
);

export type HoyScreenOverlaysProps = {
  menuOpen: string | null;
  onCloseMenu: () => void;
  editingTask: Task | null;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void | Promise<void>;
  onCloseEdit: () => void;
  showConfetti: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  onHideToast: () => void;
  userId: string | undefined;
  showRedistribute: boolean;
  onCloseRedistribute: () => void;
  tasks: Task[];
  energyLevel: number;
  availableTime: string;
  emotion: string;
  onRedistributeApplied: () => void;
  showQuickOnboarding: boolean;
  onCloseQuickOnboarding: () => void;
};

export function HoyScreenOverlays({
  menuOpen,
  onCloseMenu,
  editingTask,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCloseEdit,
  showConfetti,
  toastMessage,
  toastType,
  onHideToast,
  userId,
  showRedistribute,
  onCloseRedistribute,
  tasks,
  energyLevel,
  availableTime,
  emotion,
  onRedistributeApplied,
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
        <Suspense
          fallback={
            <ViewRN style={styles.editModalFallback}>
              <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            </ViewRN>
          }
        >
          <TaskEditModal
            visible={editingTask !== null}
            content={editContent}
            onContentChange={onEditContentChange}
            onSave={onSaveEdit}
            onClose={onCloseEdit}
          />
        </Suspense>
      ) : null}

      {showConfetti ? (
        <Suspense fallback={null}>
          <ConfettiCelebration />
        </Suspense>
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onHide={onHideToast} />
      ) : null}

      {userId ? (
        <RedistributeWorkloadModal
          visible={showRedistribute}
          onClose={onCloseRedistribute}
          userId={userId}
          tasks={tasks}
          energyLevel={energyLevel}
          availableTime={availableTime}
          emotion={emotion}
          onApplied={onRedistributeApplied}
        />
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
  editModalFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
