import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Info } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { ReorganizeDayProposalSections } from '@/components/hoy/ReorganizeDayProposalSections';
import { HoyDayCapacityBar } from '@/components/hoy/HoyDayCapacityBar';
import type { WhatChangedReason, ReorganizeWeekProposal } from '@/lib/lifeAreas/types';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { getFirstName } from '@/lib/displayName';
import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { formatProposalScheduleLabel } from '@/lib/lifeAreas/experienceDataMappers';
import {
  resolvedDateForReorganizeItem,
  tasksOnProposedDate,
  type ReorganizeAssignment,
} from '@/lib/reorganizeDateEdit';

const REORGANIZE_REASONS: WhatChangedReason[] = [
  'tired',
  'less_time',
  'new_event',
  'more_energy',
  'priorities_changed',
];

const REASON_EMOJI: Record<WhatChangedReason, string> = {
  tired: '😔',
  less_time: '⏳',
  new_event: '⭐',
  priorities_changed: '🙂',
  more_energy: '⚡',
  week_balance: '📅',
};

function nextDayOptions(count: number): string[] {
  const days: string[] = [];
  const cursor = parseLocalDateString(getLocalDateString());
  for (let index = 0; index < count; index += 1) {
    days.push(getLocalDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

type ReorganizeDayFlowProps = {
  visible: boolean;
  step: 'reason' | 'preview';
  displayName?: string;
  selectedReason: WhatChangedReason | null;
  proposal: ReorganizeWeekProposal | null;
  buildingPreview: boolean;
  applying: boolean;
  capacity?: DayCapacitySnapshot | null;
  planningMeta?: Record<string, TaskPlanningMeta>;
  assignments?: ReorganizeAssignment[];
  onSelectReason: (reason: WhatChangedReason) => void;
  onChangeTaskDate?: (taskId: string, nextDate: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
};

export function ReorganizeDayFlow({
  visible,
  step,
  displayName = '',
  selectedReason,
  proposal,
  buildingPreview,
  applying,
  capacity = null,
  planningMeta = {},
  assignments = [],
  onSelectReason,
  onChangeTaskDate,
  onConfirm,
  onBack,
  onClose,
}: ReorganizeDayFlowProps) {
  const { t, locale } = useI18n();
  const firstName = getFirstName(displayName);
  const today = getLocalDateString();
  const [editingDates, setEditingDates] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const dayOptions = useMemo(() => nextDayOptions(7), []);
  const dayPreviewItems =
    proposal && previewDate
      ? tasksOnProposedDate(proposal, assignments, previewDate, today)
      : [];

  useEffect(() => {
    if (step !== 'preview') {
      setEditingDates(false);
      setSelectedTaskId(null);
      setPreviewDate(null);
    }
  }, [step]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={step === 'preview' ? onBack : onClose}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <ChevronLeft size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('reorganizeDay.title')}</Text>
          <TouchableOpacity style={styles.infoBtn} accessibilityRole="button">
            <Info size={20} color={THEME.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'reason' ? (
            <>
              {capacity && capacity.stepCount > 0 ? (
                <HoyDayCapacityBar capacity={capacity} />
              ) : null}
              <Text style={styles.ellieLine}>{t('reorganizeDay.ellieAdjust')}</Text>
              <Text style={styles.question}>{t('reorganizeDay.whatChanged')}</Text>
              <Text style={styles.titleHint}>{t('reorganizeDay.titleHint')}</Text>
              <View style={styles.reasonGrid}>
                {REORGANIZE_REASONS.map((reason) => {
                  const selected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reasonCard, selected && styles.reasonCardSelected]}
                      onPress={() => onSelectReason(reason)}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.reasonEmoji}>{REASON_EMOJI[reason]}</Text>
                      <Text style={styles.reasonLabel}>{t(`reorganizeDay.reason.${reason}`)}</Text>
                      {t(`reorganizeDay.reasonSub.${reason}`) ? (
                        <Text style={styles.reasonSub}>
                          {t(`reorganizeDay.reasonSub.${reason}`)}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {buildingPreview ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
                  <Text style={styles.loadingText}>{t('reorganizeDay.building')}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.mascotBubble}>
                <Text style={styles.mascotText}>
                  {t('reorganizeDay.mascotThanks', { name: firstName || '…' })}
                </Text>
                <Text style={styles.mascotSub}>{t('reorganizeDay.mascotIntro')}</Text>
              </View>

              {proposal ? (
                <>
                  <Text style={styles.proposalHeadline}>{proposal.headline}</Text>
                  {proposal.subline ? (
                    <Text style={styles.proposalSubline}>{proposal.subline}</Text>
                  ) : null}
                  {capacity && capacity.stepCount > 0 ? (
                    <HoyDayCapacityBar capacity={capacity} />
                  ) : null}
                  <ReorganizeDayProposalSections
                    kept={proposal.kept}
                    moved={proposal.moved}
                    planningMeta={planningMeta}
                    editable={editingDates}
                    selectedTaskId={selectedTaskId}
                    onPressItem={(taskId) => {
                      setSelectedTaskId(taskId);
                      const item = [...proposal.kept, ...proposal.moved].find(
                        (entry) => entry.taskId === taskId,
                      );
                      if (!item) return;
                      const date = resolvedDateForReorganizeItem(item, assignments, today);
                      if (date) setPreviewDate(date);
                    }}
                  />
                  {editingDates ? (
                    <>
                      <Text style={styles.editHint}>{t('reorganizeDay.editDatesHint')}</Text>
                      {selectedTaskId ? (
                        <View style={styles.dayPicker}>
                          <Text style={styles.dayPickerLabel}>{t('reorganizeDay.moveToDay')}</Text>
                          <View style={styles.dayChips}>
                            {dayOptions.map((date) => {
                              const selected = previewDate === date;
                              return (
                                <TouchableOpacity
                                  key={date}
                                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                                  onPress={() => {
                                    onChangeTaskDate?.(selectedTaskId, date);
                                    setPreviewDate(date);
                                  }}
                                  activeOpacity={0.85}
                                  accessibilityRole="button"
                                >
                                  <Text
                                    style={[
                                      styles.dayChipLabel,
                                      selected && styles.dayChipLabelSelected,
                                    ]}
                                  >
                                    {date === today
                                      ? t('components.today')
                                      : formatProposalScheduleLabel(date, locale)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ) : null}
                      {previewDate ? (
                        <View style={styles.dayPreview}>
                          <Text style={styles.dayPreviewTitle}>
                            {t('reorganizeDay.dayPreviewTitle', {
                              day: formatProposalScheduleLabel(previewDate, locale),
                            })}
                          </Text>
                          {dayPreviewItems.length === 0 ? (
                            <Text style={styles.dayPreviewEmpty}>
                              {t('reorganizeDay.dayPreviewEmpty')}
                            </Text>
                          ) : (
                            dayPreviewItems.map((item) => (
                              <Text key={item.taskId} style={styles.dayPreviewItem}>
                                {item.areaEmoji} {item.title}
                              </Text>
                            ))
                          )}
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}

              <View style={styles.antiPressure}>
                <Heart size={16} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.antiPressureText}>{t('reorganizeDay.antiPressure')}</Text>
              </View>

              <CalmPrimaryButton
                label={t('reorganizeDay.confirmCta')}
                onPress={onConfirm}
                large
                loading={applying}
              />

              {!editingDates ? (
                <CalmPrimaryButton
                  label={t('reorganizeDay.editDatesCta')}
                  variant="soft"
                  onPress={() => setEditingDates(true)}
                />
              ) : null}

              <Pressable onPress={onBack} style={styles.backLink} accessibilityRole="button">
                <Text style={styles.backLinkText}>{t('reorganizeDay.backToPlan')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.calm.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  backBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    textAlign: 'center',
  },
  infoBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
    gap: THEME.spacing.md,
  },
  question: {
    ...THEME.typography.h2,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 32,
  },
  ellieLine: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  titleHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginTop: -THEME.spacing.xs,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  reasonCard: {
    width: '47%',
    minHeight: 100,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    gap: 4,
  },
  reasonCardSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  reasonEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  reasonLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  reasonSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: THEME.spacing.sm,
  },
  loadingText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  mascotBubble: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 4,
  },
  mascotText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  mascotSub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  proposalHeadline: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  proposalSubline: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginTop: -8,
  },
  antiPressure: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  antiPressureText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  backLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  editHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  dayPicker: {
    gap: THEME.spacing.xs,
  },
  dayPickerLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
  },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget - 8,
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  dayChipLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  dayChipLabelSelected: {
    color: THEME.colors.calm.lavenderDeep,
  },
  dayPreview: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: 6,
  },
  dayPreviewTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  dayPreviewEmpty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  dayPreviewItem: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
});
