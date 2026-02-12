import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { X } from 'lucide-react-native';

interface TaskEditModalProps {
  visible: boolean;
  content: string;
  onContentChange: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function TaskEditModal({ 
  visible, 
  content, 
  onContentChange, 
  onSave, 
  onClose 
}: TaskEditModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar tarea</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
            >
              <X size={24} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editInput}
            value={content}
            onChangeText={onContentChange}
            placeholder="Contenido de la tarea"
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel="Contenido de la tarea"
            accessibilityHint="Edita el texto de la tarea"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edición"
            >
              <Text style={styles.modalButtonCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={onSave}
              disabled={!content.trim()}
              accessibilityRole="button"
              accessibilityLabel="Guardar cambios"
              accessibilityState={{ disabled: !content.trim() }}
            >
              <Text style={styles.modalButtonSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
  },
  modalCloseButton: {
    padding: THEME.spacing.xs,
  },
  editInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: 100,
    marginBottom: THEME.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: THEME.colors.fill[200],
  },
  modalButtonSave: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  modalButtonCancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalButtonSaveText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
});
