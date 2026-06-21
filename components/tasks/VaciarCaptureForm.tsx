import { useRef, useState, useEffect, type RefObject } from 'react';
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
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ChevronDown, ChevronUp, Mic, Paperclip, Sparkles, X } from 'lucide-react-native';
import { useTaskVoiceDictation } from '@/hooks/useTaskVoiceDictation';
import { useLiveCaptureOrganization } from '@/hooks/useLiveCaptureOrganization';
import { FrentesLivePreview } from '@/components/frentes/FrentesLivePreview';
import { CreateFrenteModal } from '@/components/frentes/CreateFrenteModal';
import { TaskCaptureOrganize } from '@/components/tasks/TaskCaptureOrganize';
import type { CaptureHeroLiveState } from '@/components/tasks/CaptureScreenHero';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';

const CAPTURE_INPUT_ACCESSORY_ID = 'vaciar-capture-save-accessory';

type VaciarCaptureFormProps = {
  userId: string;
  parentScrollRef?: RefObject<ScrollView | null>;
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
  onVoiceNotice?: (message: string) => void;
  dictateHintDismissed?: boolean;
  onDismissDictateHint?: () => void;
  effortFeel?: TaskEffort | null;
  onEffortChange?: (value: TaskEffort | null) => void;
  onLiveStateChange?: (state: CaptureHeroLiveState | null) => void;
  onInputFocusChange?: (focused: boolean) => void;
  inputFocused?: boolean;
};

export function VaciarCaptureForm({
  userId,
  parentScrollRef,
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
  onVoiceNotice,
  dictateHintDismissed = true,
  onDismissDictateHint,
  effortFeel = null,
  onEffortChange,
  onLiveStateChange,
  onInputFocusChange,
  inputFocused = false,
}: VaciarCaptureFormProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateFrente, setShowCreateFrente] = useState(false);
  const usesParentScroll = Boolean(parentScrollRef);

  const { isListening, isAvailable: voiceAvailable, toggle: toggleVoice } = useTaskVoiceDictation({
    locale,
    currentText: taskInput,
    onTextChange: onTaskInputChange,
    maxLength: 2000,
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
  const showDictateHint = !voiceAvailable && !dictateHintDismissed && !inputFocused;

  const liveOrg = useLiveCaptureOrganization({
    text: taskInput,
    locale,
    userId,
    enabled: hasText && !inputFocused,
  });

  const liveActive = liveOrg.isThinking || liveOrg.isUpdating || Boolean(liveOrg.preview);
  const hideAdvancedEntry = liveOrg.itemCount > 1 && !showAdvanced;

  useEffect(() => {
    onLiveStateChange?.(
      hasText
        ? {
            isThinking: liveOrg.isThinking,
            frontCount: liveOrg.frontCount,
            itemCount: liveOrg.itemCount,
          }
        : null,
    );
  }, [
    hasText,
    liveOrg.frontCount,
    liveOrg.isThinking,
    liveOrg.itemCount,
    onLiveStateChange,
  ]);

  const releaseLabel = isSaving
    ? t('vaciar.releaseOrganizing')
    : liveOrg.preview && liveOrg.itemCount > 0
      ? t('frentes.createPlanCta')
      : t('vaciar.releaseTaskShort');

  const handleSave = () => {
    if (saveBlocked || isSaving) return;
    if (Platform.OS !== 'web' && liveOrg.preview) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Keyboard.dismiss();
    onSave();
  };

  const focusedInputMinHeight = Math.max(220, Math.round(windowHeight * 0.34));

  const formBody = (
    <View style={[styles.captureWrap, inputFocused && styles.captureWrapFocused]}>
      <View
        style={[
          styles.captureCard,
          inputFocused && { minHeight: focusedInputMinHeight + 72 },
          isListening && styles.captureCardListening,
          !inputFocused && liveActive && styles.captureCardLive,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            inputFocused && { minHeight: focusedInputMinHeight, flex: 1 },
          ]}
          value={taskInput}
          onChangeText={onTaskInputChange}
          onFocus={() => {
            onInputFocusChange?.(true);
            if (parentScrollRef?.current) {
              requestAnimationFrame(() => {
                parentScrollRef.current?.scrollTo({ y: 0, animated: true });
              });
            }
          }}
          onBlur={() => onInputFocusChange?.(false)}
          placeholder={t('frentes.brainDumpPlaceholder')}
          placeholderTextColor={THEME.colors.text.tertiary}
          multiline
          scrollEnabled
          textAlignVertical="top"
          maxLength={2000}
          returnKeyType="default"
          blurOnSubmit={false}
          keyboardAppearance="light"
          selectionColor={THEME.colors.calm.lavenderDeep}
          cursorColor={THEME.colors.calm.lavenderDeep}
          inputAccessoryViewID={Platform.OS === 'ios' ? CAPTURE_INPUT_ACCESSORY_ID : undefined}
          accessibilityLabel={t('vaciarExtra.a11yTaskField')}
          accessibilityHint={t('vaciar.captureInputA11y')}
        />

        <View style={styles.cardFooter}>
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={[styles.toolBtn, isListening && styles.toolBtnActive]}
              onPress={voiceAvailable ? handleVoicePress : undefined}
              disabled={!voiceAvailable}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={
                isListening ? t('vaciarExtra.a11yVoiceStop') : t('vaciarExtra.a11yVoiceMic')
              }
              accessibilityHint={t('vaciarExtra.a11yVoiceMicHint')}
              accessibilityState={{ selected: isListening, disabled: !voiceAvailable }}
            >
              <Mic
                size={20}
                color={
                  isListening
                    ? THEME.colors.onGradient
                    : voiceAvailable
                      ? THEME.colors.calm.lavenderDeep
                      : THEME.colors.text.tertiary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowAdvanced((open) => !open)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.advancedOptionsA11y')}
              accessibilityState={{ expanded: showAdvanced }}
            >
              <Paperclip size={20} color={THEME.colors.calm.lavenderDeep} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.releaseBtn, (saveBlocked || isSaving) && styles.releaseBtnDisabled]}
            onPress={handleSave}
            disabled={saveBlocked || isSaving}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.releaseTaskA11y')}
          >
            {isSaving ? (
              <ActivityIndicator color={THEME.colors.onGradient} size="small" />
            ) : (
              <>
                <Text style={styles.releaseBtnText}>{releaseLabel}</Text>
                <Sparkles size={14} color={THEME.colors.onGradient} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!inputFocused ? (
        <FrentesLivePreview
          preview={liveOrg.preview}
          isThinking={liveOrg.isThinking}
          isUpdating={liveOrg.isUpdating}
          projects={liveOrg.projects}
          onAddProject={() => setShowCreateFrente(true)}
        />
      ) : null}

      <CreateFrenteModal
        visible={showCreateFrente}
        userId={userId}
        locale={locale}
        existingNames={liveOrg.projects.map((p) => p.name)}
        onClose={() => setShowCreateFrente(false)}
        onCreated={() => {
          setShowCreateFrente(false);
          void liveOrg.reloadProjects();
        }}
        onError={onProjectError}
      />

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

      {!inputFocused && showAdvanced ? (
        <View style={styles.advancedPanel}>
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
      ) : !inputFocused && hideAdvancedEntry ? null : !inputFocused ? (
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.advancedOptionsA11y')}
        >
          <Text style={styles.advancedToggleText}>{t('vaciar.advancedOptions')}</Text>
          <ChevronDown size={16} color={THEME.colors.text.tertiary} />
        </TouchableOpacity>
      ) : null}

      {!inputFocused && showAdvanced ? (
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(false)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.advancedOptionsHideA11y')}
        >
          <Text style={styles.advancedToggleText}>{t('vaciar.advancedOptionsHide')}</Text>
          <ChevronUp size={16} color={THEME.colors.text.tertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <>
      {usesParentScroll ? (
        formBody
      ) : (
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
            automaticallyAdjustKeyboardInsets
          >
            {formBody}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={CAPTURE_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            {hasText ? (
              <TouchableOpacity
                style={styles.accessoryRelease}
                onPress={handleSave}
                disabled={saveBlocked || isSaving}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('vaciar.releaseTaskA11y')}
              >
                <Text style={styles.accessoryReleaseText}>
                  {liveOrg.preview && liveOrg.itemCount > 0
                    ? t('vaciar.releaseReview', { count: liveOrg.itemCount })
                    : t('vaciar.releaseTask')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.accessorySpacer} />
            )}
            <TouchableOpacity
              style={styles.accessoryDoneBtn}
              onPress={() => Keyboard.dismiss()}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.captureAccessoryDoneA11y')}
            >
              <Text style={styles.accessoryDoneText}>{t('vaciar.captureAccessoryDone')}</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      ) : null}
    </>
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
    paddingBottom: THEME.spacing.xl,
  },
  captureWrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  captureWrapFocused: {
    flex: 1,
  },
  captureCard: {
    minHeight: 200,
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  captureCardListening: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  captureCardLive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 1.5,
    ...THEME.shadows.lavenderGlow,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: 'transparent',
    minHeight: 120,
    width: '100%',
    padding: 0,
    margin: 0,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.standard,
  },
  toolBtnActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
    minWidth: 120,
    justifyContent: 'center',
  },
  releaseBtnDisabled: {
    opacity: 0.45,
  },
  releaseBtnText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
  },
  voiceListening: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  dictateHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  dictateHintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
  },
  advancedToggleText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  advancedPanel: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
  },
  accessoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.calm.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingVertical: 8,
    minHeight: 44,
  },
  accessorySpacer: {
    flex: 1,
  },
  accessoryRelease: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 36,
  },
  accessoryReleaseText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  accessoryDoneBtn: {
    paddingVertical: 4,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  accessoryDoneText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
