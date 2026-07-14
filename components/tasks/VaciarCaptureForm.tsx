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
import { ChevronDown, ChevronUp, Mic, X } from 'lucide-react-native';
import { useTaskVoiceDictation } from '@/hooks/useTaskVoiceDictation';
import { useLiveCaptureOrganization } from '@/hooks/useLiveCaptureOrganization';
import { isExpoGoClient } from '@/lib/subscriptionEnvironment';
import { BrainDumpLivePreview } from '@/components/frentes/BrainDumpLivePreview';
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
  /** Solo brain dump: sin opciones avanzadas de captura individual. */
  brainDumpOnly?: boolean;
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
  brainDumpOnly = false,
}: VaciarCaptureFormProps) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const dictateHintMessage = isExpoGoClient()
    ? t('vaciarExtra.dictateHintExpoGo')
    : t('vaciarExtra.dictateHintKeyboardOnly');

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
            areaCount: liveOrg.areaCount,
            itemCount: liveOrg.itemCount,
          }
        : null,
    );
  }, [
    hasText,
    liveOrg.areaCount,
    liveOrg.isThinking,
    liveOrg.itemCount,
    onLiveStateChange,
  ]);

  const releaseLabel = isSaving ? t('vaciar.releaseOrganizing') : t('vaciar.releaseTaskShort');

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
      {!inputFocused && !brainDumpOnly && !hasText ? (
        <View style={styles.captureIntro}>
          <Text style={styles.captureTitle}>{t('frentes.brainDumpTitle')}</Text>
          <Text style={styles.captureSubtitle}>{t('vaciar.captureSubtitle')}</Text>
        </View>
      ) : brainDumpOnly && !inputFocused && !hasText ? (
        <View style={styles.captureIntro}>
          <Text style={styles.captureTitle}>{t('vaciar.brainDumpSimpleTitle')}</Text>
          <Text style={styles.captureSubtitle}>{t('vaciar.brainDumpSimpleSub')}</Text>
        </View>
      ) : null}

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
          placeholder={
            brainDumpOnly ? t('vaciar.brainDumpPlaceholder') : t('vaciar.placeholderCapture')
          }
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
              <Text style={styles.releaseBtnText}>{releaseLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>


      {!inputFocused ? (
        <BrainDumpLivePreview
          preview={liveOrg.preview}
          isThinking={liveOrg.isThinking}
          isUpdating={liveOrg.isUpdating}
        />
      ) : null}

      {isListening ? (
        <Text style={styles.voiceListening}>{t('vaciarExtra.voiceListening')}</Text>
      ) : null}

      {showDictateHint ? (
        <View style={styles.dictateHintRow}>
          <Text style={styles.dictateHintText}>{dictateHintMessage}</Text>
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

      {!inputFocused && !brainDumpOnly && showAdvanced ? (
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
      ) : !inputFocused && !brainDumpOnly && hideAdvancedEntry ? null : !inputFocused && !brainDumpOnly ? (
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

      {!inputFocused && !brainDumpOnly && showAdvanced ? (
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
    gap: THEME.layout.sectionGap,
    alignSelf: 'stretch',
  },
  captureIntro: {
    gap: 8,
    paddingBottom: THEME.spacing.xs,
  },
  captureTitle: {
    ...THEME.typography.h2,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    fontSize: 28,
    lineHeight: 34,
  },
  captureSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  captureWrapFocused: {
    flex: 1,
  },
  captureCard: {
    minHeight: 220,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  captureCardListening: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  captureCardLive: {
    borderColor: THEME.colors.calm.lavender,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    backgroundColor: 'transparent',
    minHeight: 140,
    width: '100%',
    padding: 0,
    margin: 0,
    fontSize: 17,
    lineHeight: 26,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    minWidth: 112,
    justifyContent: 'center',
  },
  releaseBtnDisabled: {
    opacity: 0.45,
  },
  releaseBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 22,
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
