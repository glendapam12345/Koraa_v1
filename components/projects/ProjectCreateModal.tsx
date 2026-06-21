import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';
import { ProjectCreateStepsOverview } from '@/components/projects/ProjectCreateStepsOverview';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { createProjectForUser, createProjectErrorMessage } from '@/lib/createProject';
import type { CreatedProject } from '@/lib/createProject';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import { inferLifeAreaKeyForProject } from '@/lib/lifeAreas/lifeAreaCatalog';

type ProjectCreateModalProps = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (project: CreatedProject) => void;
  onError?: (message: string) => void;
  existingNames?: string[];
  initialLifeAreaKey?: LifeAreaKey;
};

export function ProjectCreateModal({
  visible,
  userId,
  onClose,
  onCreated,
  onError,
  existingNames = [],
  initialLifeAreaKey,
}: ProjectCreateModalProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [dueDate, setDueDate] = useState('');
  const [lifeAreaKey, setLifeAreaKey] = useState<LifeAreaKey>('other');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardPad(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardPad(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const reset = () => {
    setName('');
    setColor(PROJECT_COLORS[0]);
    setDueDate('');
    setLifeAreaKey(initialLifeAreaKey ?? 'other');
    setError(null);
    setSaving(false);
  };

  useEffect(() => {
    if (!visible) return;
    setLifeAreaKey(initialLifeAreaKey ?? 'other');
  }, [initialLifeAreaKey, visible]);

  const handleClose = () => {
    Keyboard.dismiss();
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
      lifeAreaKey,
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

  const scrollBottomPad =
    Math.max(insets.bottom, THEME.spacing.md) +
    (keyboardPad > 0 ? keyboardPad - insets.bottom + THEME.spacing.sm : THEME.spacing.lg);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardWrap}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.titleWrap}>
                <Text style={styles.sheetTitle}>{t('projects.createProjectCta')}</Text>
                <Text style={styles.sheetSubtitle}>{t('projects.createProjectFormHint')}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityLabel={t('common.cancel')}
              >
                <X size={22} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ProjectCreateStepsOverview />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator
            >
              <ProjectCreateForm
                embedded
                hideFooter
                name={name}
                color={color}
                dueDate={dueDate}
                lifeAreaKey={lifeAreaKey}
                error={error}
                saving={saving}
                onNameChange={(v) => {
                  setName(v);
                  if (v.trim()) setLifeAreaKey(inferLifeAreaKeyForProject(v));
                  if (error) setError(null);
                }}
                onColorChange={setColor}
                onDueDateChange={setDueDate}
                onLifeAreaChange={setLifeAreaKey}
                onCancel={handleClose}
                onSubmit={() => void handleSubmit()}
              />

              {error ? <Text style={styles.scrollError}>{error}</Text> : null}

              <CalmPrimaryButton
                label={saving ? t('components.creatingProject') : t('components.createProject')}
                onPress={() => void handleSubmit()}
                loading={saving}
                disabled={!name.trim() || saving}
                large
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    ...StyleSheet.absoluteFillObject,
  },
  keyboardWrap: {
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded * 2,
    borderTopRightRadius: THEME.borderRadius.rounded * 2,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  sheetTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  sheetSubtitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  scrollError: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: THEME.spacing.xs,
  },
});
