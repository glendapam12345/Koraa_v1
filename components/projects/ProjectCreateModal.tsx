import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { CreatedProject } from '@/lib/createProject';

type ProjectCreateModalProps = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (project: CreatedProject) => void;
  onError?: (message: string) => void;
  existingNames?: string[];
};

export function ProjectCreateModal({
  visible,
  userId,
  onClose,
  onCreated,
  onError,
  existingNames = [],
}: ProjectCreateModalProps) {
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setColor(PROJECT_COLORS[0]);
    setDueDate('');
    setError(null);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    const result = await createProjectForUser({
      userId,
      name,
      color,
      dueDateRaw: dueDate,
      existingNames,
      locale,
    });
    setSaving(false);

    if (!result.ok) {
      const message = createProjectErrorMessage(result.reason, locale);
      setError(message);
      onError?.(message);
      return;
    }

    onCreated(result.project);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            accessibilityLabel={t('common.cancel')}
          >
            <X size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <ProjectCreateForm
            name={name}
            color={color}
            dueDate={dueDate}
            error={error}
            saving={saving}
            onNameChange={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            onColorChange={setColor}
            onDueDateChange={setDueDate}
            onCancel={handleClose}
            onSubmit={() => void handleSubmit()}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: THEME.colors.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
