import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  InputAccessoryView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { Sparkles, ChevronDown, Mic, X } from 'lucide-react-native';
import { useTaskVoiceDictation } from '@/hooks/useTaskVoiceDictation';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { TaskCaptureOrganize } from '@/components/tasks/TaskCaptureOrganize';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

const CAPTURE_INPUT_ACCESSORY_ID = 'vaciar-capture-save-accessory';

type VaciarCaptureFormProps = {
  userId: string;
  taskInput: string;
  onTaskInputChange: (value: string) => void;
  assignToProject: boolean;
  onAssignToProjectChange: (value: boolean) => void;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  hasSubtasks: boolean;
  onHasSubtasksChange: (value: boolean) => void;
  subtasks: string[];
  onSubtasksChange: (items: string[]) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (index: number) => void;
  isSaving: boolean;
  saveBlocked: boolean;
  onSave: () => void;
  onProjectError: (message: string) => void;
  onProjectCreated: (name: string) => void;
  recentSuggestions?: string[];
  effortFeel?: TaskEffort | null;
  onEffortChange?: (value: TaskEffort | null) => void;
  onInterpretAi?: () => void;
  isInterpreting?: boolean;
  onVoiceNotice?: (message: string) => void;
  dictateHintDismissed?: boolean;
  onDismissDictateHint?: () => void;
};

export function VaciarCaptureForm({
  userId,
  taskInput,
  onTaskInputChange,
  assignToProject,
  onAssignToProjectChange,
  selectedCategory,
  onCategoryChange,
  selectedProjectId,
  onProjectChange,
  selectedDate,
  onDateChange,
  hasSubtasks,
  onHasSubtasksChange,
  subtasks,
  onSubtasksChange,
  onAddSubtask,
  onRemoveSubtask,
  isSaving,
  saveBlocked,
  onSave,
  onProjectError,
  onProjectCreated,
  recentSuggestions = [],
  effortFeel = null,
  onEffortChange,
  onInterpretAi,
  isInterpreting = false,
  onVoiceNotice,
  dictateHintDismissed = true,
  onDismissDictateHint,
}: VaciarCaptureFormProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const organizeOffsetRef = useRef(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { isListening, isAvailable: voiceAvailable, toggle: toggleVoice } = useTaskVoiceDictation({
    locale,
    currentText: taskInput,
    onTextChange: onTaskInputChange,
    maxLength: 300,
  });

  const handleVoicePress = () => {
    void (async () => {
      const result = await toggleVoice();
      if (!result.ok) {
        if (result.reason === 'unavailable') {
          onVoiceNotice?.(t('vaciarExtra.voiceUnavailable'));
        } else if (result.reason === 'permission') {
          onVoiceNotice?.(t('vaciarExtra.voicePermissionDenied'));
        }
      }
    })();
  };

  const hasText = Boolean(taskInput.trim());
  const showSuggestions = recentSuggestions.length > 0 && !hasText;
  const showDictateHint = !voiceAvailable && !dictateHintDismissed;
  const saveLabel = isSaving
    ? t('vaciar.saving')
    : selectedProjectId
      ? t('vaciar.saveTaskProject')
      : t('vaciar.releaseTask');

  const handleSave = () => {
    if (saveBlocked) return;
    Keyboard.dismiss();
    onSave();
  };

  const scrollToOrganize = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, organizeOffsetRef.current - THEME.spacing.sm),
      animated: true,
    });
  };

  const handleKeyboardDone = () => {
    Keyboard.dismiss();
    setTimeout(scrollToOrganize, Platform.OS === 'ios' ? 280 : 80);
  };

  const saveButton = (
    <CalmPrimaryButton
      label={saveLabel}
      onPress={handleSave}
      disabled={saveBlocked}
      loading={isSaving}
      large
      style={styles.saveBtn}
      accessibilityHint={t('vaciarExtra.a11ySaveTaskHint')}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        <View style={styles.mainCard}>
          <Text style={styles.stepLabel}>{t('vaciar.captureStepWrite')}</Text>
          <Text style={styles.prompt}>{t('vaciar.capturePrompt')}</Text>

          <View style={[styles.inputWrap, isListening && styles.inputWrapListening]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={taskInput}
              onChangeText={onTaskInputChange}
              placeholder={t('vaciar.placeholderShort')}
              placeholderTextColor={THEME.colors.text.tertiary}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              maxLength={300}
              returnKeyType="default"
              blurOnSubmit={false}
              keyboardAppearance="light"
              selectionColor={THEME.colors.calm.lavenderDeep}
              cursorColor={THEME.colors.calm.lavenderDeep}
              inputAccessoryViewID={Platform.OS === 'ios' ? CAPTURE_INPUT_ACCESSORY_ID : undefined}
              accessibilityLabel={t('vaciarExtra.a11yTaskField')}
              accessibilityHint={t('vaciar.captureInputA11y')}
            />
            {voiceAvailable ? (
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={handleVoicePress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  isListening ? t('vaciarExtra.a11yVoiceStop') : t('vaciarExtra.a11yVoiceMic')
                }
                accessibilityHint={t('vaciarExtra.a11yVoiceMicHint')}
                accessibilityState={{ selected: isListening }}
              >
                <Mic
                  size={22}
                  color={isListening ? THEME.colors.fill[100] : THEME.colors.calm.lavenderDeep}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {isListening ? (
            <Text style={styles.voiceListening}>{t('vaciarExtra.voiceListening')}</Text>
          ) : null}

          {showDictateHint ? (
            <View style={styles.dictateHintRow}>
              <Text style={styles.dictateHintText}>{t('vaciarExtra.dictateHintKeyboardOnly')}</Text>
              {onDismissDictateHint ? (
                <TouchableOpacity
                  onPress={onDismissDictateHint}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t('vaciarExtra.a11yDismissDictateHint')}
                >
                  <X size={18} color={THEME.colors.text.tertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {showSuggestions ? (
            <View style={styles.suggestions}>
              {recentSuggestions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionChip}
                  onPress={() => onTaskInputChange(item)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {keyboardVisible && hasText ? (
            <Text style={styles.keyboardHint}>{t('vaciar.captureKeyboardStepHint')}</Text>
          ) : null}
        </View>

        <View
          onLayout={(e) => {
            organizeOffsetRef.current = e.nativeEvent.layout.y;
          }}
          style={styles.organizeSection}
        >
          <Text style={styles.stepLabel}>{t('vaciar.captureStepOrganize')}</Text>
          <Text style={styles.organizeIntro}>{t('vaciar.captureOrganizeIntro')}</Text>

          {hasText && onInterpretAi ? (
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={onInterpretAi}
              disabled={isInterpreting || isSaving}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.aiInterpretA11y')}
            >
              <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.aiBtnText}>
                {isInterpreting ? t('vaciar.aiInterpretLoading') : t('vaciar.aiInterpretBtn')}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TaskCaptureOrganize
            embedded
            userId={userId}
            taskTitle={taskInput.trim()}
            assignToProject={assignToProject}
            onAssignToProjectChange={onAssignToProjectChange}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            selectedProjectId={selectedProjectId}
            onProjectChange={onProjectChange}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            hasSubtasks={hasSubtasks}
            onHasSubtasksChange={onHasSubtasksChange}
            subtasks={subtasks}
            onSubtasksChange={onSubtasksChange}
            onAddSubtask={onAddSubtask}
            onRemoveSubtask={onRemoveSubtask}
            onBlurInput={() => inputRef.current?.blur()}
            onProjectError={onProjectError}
            onProjectCreated={onProjectCreated}
            effortFeel={effortFeel}
            onEffortChange={onEffortChange}
          />
        </View>

        <View style={styles.saveSection}>
          <Text style={styles.stepLabel}>{t('vaciar.captureStepSave')}</Text>
          {!hasText ? (
            <Text style={styles.saveBlockedHint}>{t('vaciar.captureSaveBlockedHint')}</Text>
          ) : null}
          {saveButton}
        </View>
      </ScrollView>

      {Platform.OS === 'android' && keyboardVisible && hasText ? (
        <View style={[styles.androidDoneBar, { paddingBottom: Math.max(insets.bottom, THEME.spacing.sm) }]}>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleKeyboardDone}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.captureAccessoryDoneA11y')}
          >
            <Text style={styles.doneBtnText}>{t('vaciar.captureAccessoryDone')}</Text>
            <ChevronDown size={16} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={CAPTURE_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            {hasText ? (
              <TouchableOpacity
                style={styles.accessoryDoneRow}
                onPress={handleKeyboardDone}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('vaciar.captureAccessoryDoneA11y')}
              >
                <Text style={styles.accessoryDoneText}>{t('vaciar.captureAccessoryDone')}</Text>
                <ChevronDown size={16} color={THEME.colors.calm.lavenderDeep} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.accessoryHint}>{t('vaciar.captureAccessoryHint')}</Text>
            )}
            {hasText ? (
              <Text style={styles.accessorySubhint}>{t('vaciar.captureAccessoryDoneHint')}</Text>
            ) : null}
          </View>
        </InputAccessoryView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
  },
  accessoryBar: {
    backgroundColor: THEME.colors.fill[100],
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    gap: 4,
  },
  accessoryDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  accessoryDoneText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  accessorySubhint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  accessoryHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  androidDoneBar: {
    backgroundColor: THEME.colors.fill[100],
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  doneBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  mainCard: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  stepLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  prompt: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  inputWrap: {
    position: 'relative',
    minHeight: 112,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingRight: 52,
  },
  inputWrapListening: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  input: {
    fontSize: 18,
    lineHeight: 24,
    color: THEME.colors.text.main,
    backgroundColor: 'transparent',
    minHeight: 88,
    width: '100%',
    padding: 0,
    margin: 0,
    // DM Sans en TextInput multiline suele dejar el texto invisible en iOS.
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  micBtn: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  micBtnActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  voiceListening: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  dictateHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  dictateHintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  keyboardHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: THEME.spacing.xs,
  },
  organizeSection: {
    gap: THEME.spacing.xs,
  },
  organizeIntro: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.xs,
  },
  saveSection: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  saveBlockedHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  suggestionChip: {
    maxWidth: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  suggestionText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.fill[100],
    minHeight: 36,
    marginBottom: THEME.spacing.xs,
  },
  aiBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  saveBtn: {
    marginTop: THEME.spacing.xs,
  },
});
