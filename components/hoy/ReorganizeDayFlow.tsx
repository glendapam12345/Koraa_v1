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

const REORGANIZE_REASONS: WhatChangedReason[] = [
  'tired',
  'less_time',
  'new_event',
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
  onSelectReason: (reason: WhatChangedReason) => void;
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
  onSelectReason,
  onConfirm,
  onBack,
  onClose,
}: ReorganizeDayFlowProps) {
  const { t } = useI18n();
  const firstName = getFirstName(displayName);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
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
              <Text style={styles.question}>{t('reorganizeDay.whatChanged')}</Text>
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
                  />
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

              <Pressable onPress={onBack} style={styles.backLink} accessibilityRole="button">
                <Text style={styles.backLinkText}>{t('reorganizeDay.backToPlan')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
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
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
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
    paddingBottom: THEME.spacing.xl,
    gap: THEME.spacing.md,
  },
  question: {
    ...THEME.typography.h2,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 32,
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
});
