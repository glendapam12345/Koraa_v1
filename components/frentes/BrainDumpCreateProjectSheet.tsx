import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { DateSelector } from '@/components/tasks/DateSelector';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export type BrainDumpCreateProjectPayload = {
  name: string;
  dueDate: string | null;
};

type BrainDumpCreateProjectSheetProps = {
  visible: boolean;
  areaName: string;
  areaRef: LifeAreaRef;
  onClose: () => void;
  onCreate: (payload: BrainDumpCreateProjectPayload) => void;
};

export function BrainDumpCreateProjectSheet({
  visible,
  areaName,
  onClose,
  onCreate,
}: BrainDumpCreateProjectSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setDueDate(null);
  }, [visible]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, dueDate });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('vaciar.areaReviewCreateProjectTitle')}</Text>
                <Text style={styles.subtitle}>{areaName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={22} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={styles.label}>{t('frentes.createName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('frentes.createGroupPlaceholder')}
                placeholderTextColor={THEME.colors.text.tertiary}
                maxLength={48}
                autoFocus
              />

              <Text style={styles.label}>{t('vaciar.previewProjectDeadlineLabel')}</Text>
              <DateSelector compact hideLabel selectedDate={dueDate} onSelect={setDueDate} />

              <CalmPrimaryButton
                label={t('vaciar.areaReviewCreateProjectConfirm')}
                onPress={handleCreate}
                disabled={!name.trim()}
                large
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  keyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  input: {
    ...THEME.typography.body,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.fill[100],
  },
});
