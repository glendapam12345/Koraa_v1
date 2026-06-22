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
} from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type AreaNameEditSheetProps = {
  visible: boolean;
  title: string;
  initialName: string;
  initialEmoji?: string;
  showEmoji?: boolean;
  onClose: () => void;
  onSave: (name: string, emoji?: string) => void | Promise<void>;
};

export function AreaNameEditSheet({
  visible,
  title,
  initialName,
  initialEmoji = '🌿',
  showEmoji = false,
  onClose,
  onSave,
}: AreaNameEditSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setEmoji(initialEmoji);
  }, [visible, initialName, initialEmoji]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await onSave(trimmed, showEmoji ? emoji.trim() || '🌿' : undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {showEmoji ? (
            <TextInput
              style={styles.emojiInput}
              value={emoji}
              onChangeText={setEmoji}
              maxLength={4}
              accessibilityLabel={t('areasCompact.areaEmojiA11y')}
            />
          ) : null}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('areasCompact.areaNamePlaceholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            maxLength={40}
            autoFocus
            accessibilityLabel={t('areasCompact.areaNameA11y')}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.85}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <CalmPrimaryButton
              label={t('areasCompact.saveArea')}
              onPress={() => void handleSave()}
              disabled={!name.trim() || saving}
              variant="default"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.layout.screenPaddingX,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  emojiInput: {
    ...THEME.typography.h2,
    textAlign: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.standard,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  cancelBtn: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  cancelText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
