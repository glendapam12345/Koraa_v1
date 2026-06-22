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
  ScrollView,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { defaultCustomAreaColor } from '@/lib/lifeAreas/userLifeAreas';

type AreaNameEditSheetProps = {
  visible: boolean;
  title: string;
  initialName: string;
  initialEmoji?: string;
  initialColor?: string;
  showEmoji?: boolean;
  showColor?: boolean;
  canDelete?: boolean;
  deleteLabel?: string;
  onClose: () => void;
  onSave: (name: string, emoji?: string, color?: string) => boolean | void | Promise<boolean | void>;
  onDelete?: () => void | Promise<void>;
};

export function AreaNameEditSheet({
  visible,
  title,
  initialName,
  initialEmoji = '🌿',
  initialColor,
  showEmoji = false,
  showColor = false,
  canDelete = false,
  deleteLabel,
  onClose,
  onSave,
  onDelete,
}: AreaNameEditSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [color, setColor] = useState(initialColor ?? PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setEmoji(initialEmoji);
    setColor(initialColor ?? defaultCustomAreaColor(initialName || 'area'));
  }, [visible, initialName, initialEmoji, initialColor]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const saved = await onSave(
        trimmed,
        showEmoji ? emoji.trim() || '🌿' : undefined,
        showColor ? color : undefined,
      );
      if (saved === false) return;
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
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
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
            {showColor ? (
              <View style={styles.colorSection}>
                <Text style={styles.colorLabel}>{t('areasCompact.areaColorLabel')}</Text>
                <View style={styles.colorRow}>
                  {PROJECT_COLORS.map((swatch, index) => {
                    const selected = color === swatch;
                    return (
                      <TouchableOpacity
                        key={`area-color-${index}`}
                        style={[
                          styles.colorOptionWrap,
                          selected && styles.colorOptionWrapSelected,
                        ]}
                        onPress={() => setColor(swatch)}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={t('areasCompact.areaColorA11y')}
                      >
                        <View style={[styles.colorOption, { backgroundColor: swatch }]}>
                          {selected ? (
                            <Check size={16} color={THEME.colors.onGradient} strokeWidth={3} />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {canDelete && onDelete ? (
              <TouchableOpacity
                onPress={() => void onDelete()}
                style={styles.deleteBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={deleteLabel ?? t('areasCompact.deleteArea')}
              >
                <Text style={styles.deleteText}>{deleteLabel ?? t('areasCompact.deleteArea')}</Text>
              </TouchableOpacity>
            ) : null}
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
          </ScrollView>
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
    maxHeight: '85%',
    ...THEME.shadows.soft,
  },
  sheetContent: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
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
  colorSection: {
    gap: THEME.spacing.xs,
  },
  colorLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOptionWrap: {
    padding: 2,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionWrapSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xs,
  },
  deleteText: {
    ...THEME.typography.body,
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.medium,
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
