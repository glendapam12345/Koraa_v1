import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

const UI_ACCENT = THEME.colors.calm.lavenderDeep;

export type ProjectQuickAddTarget =
  | { mode: 'project'; id: string; name: string; color: string }
  | { mode: 'loose'; lifeAreaRef?: LifeAreaRef };

type ProjectQuickAddTaskModalProps = {
  visible: boolean;
  target: ProjectQuickAddTarget | null;
  hasCheckInToday: boolean;
  onClose: () => void;
  onSaved: (args: { title: string; projectName?: string }) => void;
  onOpenFullCapture?: (projectId: string | null) => void;
};

export function ProjectQuickAddTaskModal({
  visible,
  target,
  hasCheckInToday,
  onClose,
  onSaved,
  onOpenFullCapture,
}: ProjectQuickAddTaskModalProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);

  const today = getLocalDateString();
  const weekEnd = getEndOfWeekLocalDateString();
  const isThisWeek = selectedDate === weekEnd && selectedDate !== today;

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

  useEffect(() => {
    if (!visible) {
      setContent('');
      setSelectedDate(null);
      setSaving(false);
      setKeyboardPad(0);
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed || !target) return;

    setSaving(true);
    try {
      const result = await createVaciarTask(
        {
          content: trimmed,
          hasSubtasks: false,
          subtasks: [],
          assignToProject: target.mode === 'project',
          selectedCategory: 'otros',
          selectedProjectId: target.mode === 'project' ? target.id : null,
          selectedDate,
          lifeAreaKey: target.mode === 'loose' ? target.lifeAreaRef ?? null : null,
        },
        { locale, hasCheckInToday },
      );

      if (result.status === 'not_authenticated') return;
      if (result.status === 'error') return;

      onSaved({
        title: result.savedTitle,
        projectName: target.mode === 'project' ? target.name : undefined,
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!target) return null;

  const isProject = target.mode === 'project';
  const projectColor = isProject ? target.color : THEME.colors.text.tertiary;
  const footerBottomPad =
    keyboardPad > 0
      ? THEME.spacing.sm
      : Math.max(insets.bottom, THEME.spacing.md);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardWrap}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={[styles.sheet, keyboardPad > 0 && { marginBottom: keyboardPad - insets.bottom }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {isProject
                    ? t('projects.quickAddTitle', { name: target.name })
                    : t('projects.quickAddLooseTitle')}
                </Text>
                <Text style={styles.subtitle}>
                  {isProject ? t('projects.quickAddPrompt') : t('projects.quickAddLoosePrompt')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityLabel={t('components.closeA11y')}
              >
                <X size={22} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <View style={[styles.projectChip, { borderLeftColor: projectColor }]}>
              <FolderKanban size={18} color={projectColor} />
              <Text style={styles.projectChipText} numberOfLines={2}>
                {isProject ? target.name : t('projectsUi.looseTitle')}
              </Text>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder={t('vaciar.placeholderShort')}
                placeholderTextColor={THEME.colors.text.tertiary}
                multiline
                maxLength={300}
                autoFocus
                accessibilityLabel={t('vaciarExtra.a11yTaskField')}
              />

              <Text style={styles.dateLabel}>{t('vaciar.fieldDate')}</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.datePill, selectedDate === today && styles.datePillOn]}
                  onPress={() => setSelectedDate(today)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.datePillText, selectedDate === today && styles.datePillTextOn]}>
                    {t('vaciar.whenToday')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePill, isThisWeek && styles.datePillOn]}
                  onPress={() => setSelectedDate(weekEnd)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.datePillText, isThisWeek && styles.datePillTextOn]}>
                    {t('vaciar.whenThisWeek')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePill, selectedDate === null && styles.datePillOn]}
                  onPress={() => setSelectedDate(null)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.datePillText, selectedDate === null && styles.datePillTextOn]}>
                    {t('vaciar.whenNoRush')}
                  </Text>
                </TouchableOpacity>
              </View>

              {onOpenFullCapture ? (
                <TouchableOpacity
                  style={styles.moreLink}
                  onPress={() => {
                    handleClose();
                    onOpenFullCapture(isProject ? target.id : null);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.moreLinkText}>{t('projects.quickAddMoreOptions')}</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
              <CalmPrimaryButton
                label={
                  saving
                    ? t('vaciar.saving')
                    : isProject
                      ? t('projects.quickAddSaveShort')
                      : t('projects.quickAddSaveLoose')
                }
                onPress={() => void handleSave()}
                loading={saving}
                disabled={!content.trim() || saving}
                large
              />
            </View>
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
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.border,
    marginBottom: THEME.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  subtitle: {
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
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 4,
    marginBottom: THEME.spacing.sm,
  },
  projectChipText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 280,
  },
  scrollContent: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    minHeight: 88,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  dateLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  datePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  datePillOn: {
    backgroundColor: UI_ACCENT,
    borderColor: UI_ACCENT,
  },
  datePillText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  datePillTextOn: {
    color: THEME.colors.onGradient,
  },
  moreLink: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  moreLinkText: {
    ...THEME.typography.small,
    color: UI_ACCENT,
    fontFamily: THEME.fonts.heading.bold,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
    paddingTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
  },
});
