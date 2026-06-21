import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import { buildCaptureFronts, type ProjectMeta } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { applyFrontDeadlinesToItems } from '@/lib/captureFrontDiscovery';
import {
  buildReliefReviewModel,
  reliefRowLabel,
  type ReliefSummaryRow,
} from '@/lib/captureReliefReview';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { KoraaMascotAvatar } from '@/components/branding/KoraaMascotAvatar';
import { DateSelector } from '@/components/tasks/DateSelector';
import { formatProjectDueDate } from '@/lib/projectProgress';

type CaptureOrganizationPreviewProps = {
  locale: AppLocale;
  items: EnrichedCaptureItem[];
  projects: ProjectMeta[];
  onItemsChange: (items: EnrichedCaptureItem[]) => void;
  onBack: () => void;
  onConfirm: (payload: {
    items: EnrichedCaptureItem[];
    frontDeadlines: Record<string, string | null>;
  }) => void;
  isSaving: boolean;
  isRefining?: boolean;
};

function ReliefSummaryCounts({
  projects,
  lifeAreas,
  standalone,
}: {
  projects: number;
  lifeAreas: number;
  standalone: number;
}) {
  const { t } = useI18n();
  const parts: string[] = [];

  if (projects > 0) {
    parts.push(
      projects === 1
        ? t('vaciar.reliefCountProjectOne')
        : t('vaciar.reliefCountProjects', { count: projects }),
    );
  }
  if (lifeAreas > 0) {
    parts.push(
      lifeAreas === 1
        ? t('vaciar.reliefCountLifeAreaOne')
        : t('vaciar.reliefCountLifeAreas', { count: lifeAreas }),
    );
  }
  if (standalone > 0) {
    parts.push(
      standalone === 1
        ? t('vaciar.reliefCountStandaloneOne')
        : t('vaciar.reliefCountStandalone', { count: standalone }),
    );
  }

  if (parts.length === 0) return null;

  return (
    <View style={styles.countsWrap}>
      {parts.map((part) => (
        <Text key={part} style={styles.countLine}>
          {part}
        </Text>
      ))}
    </View>
  );
}

function ReliefFoundRow({ row, index }: { row: ReliefSummaryRow; index: number }) {
  const { t } = useI18n();
  const { emoji, title, meta } = reliefRowLabel(row, t);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(260)}
      style={styles.foundRow}
    >
      <Text style={styles.foundEmoji}>{emoji}</Text>
      <View style={styles.foundBody}>
        <Text style={styles.foundTitle} numberOfLines={row.kind === 'standalone' ? 2 : 1}>
          {title}
        </Text>
        {meta ? <Text style={styles.foundMeta}>{meta}</Text> : null}
      </View>
    </Animated.View>
  );
}

export function CaptureOrganizationPreview({
  locale,
  items,
  projects,
  onItemsChange,
  onBack,
  onConfirm,
  isSaving,
  isRefining = false,
}: CaptureOrganizationPreviewProps) {
  const { t } = useI18n();
  const frontsResult = useMemo(() => buildCaptureFronts(items, projects), [items, projects]);
  const relief = useMemo(
    () => buildReliefReviewModel(frontsResult.fronts),
    [frontsResult.fronts],
  );
  const [frontDeadlines, setFrontDeadlines] = useState<Record<string, string | null>>({});
  const [openDeadlineKey, setOpenDeadlineKey] = useState<string | null>(null);

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects],
  );

  const handleConfirmPress = () => {
    const prepared = applyFrontDeadlinesToItems(items, frontsResult.fronts, frontDeadlines);
    onItemsChange(prepared);
    onConfirm({ items: prepared, frontDeadlines });
  };

  const showDeadlineSection = relief.deadlineFronts.length > 0;

  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.duration(280)} style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.gotItEmoji}>💜</Text>
          <KoraaMascotAvatar size={40} />
        </View>
        <Text style={styles.title}>{t('vaciar.reliefGotIt')}</Text>
        <Text style={styles.subtitle}>{t('vaciar.reliefUnderstood')}</Text>
        <ReliefSummaryCounts {...relief.counts} />
      </Animated.View>

      {isRefining ? (
        <View style={styles.refiningRow}>
          <ActivityIndicator size="small" color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.refiningText}>{t('vaciar.previewRefining')}</Text>
        </View>
      ) : null}

      <View style={styles.foundCard}>
        <Text style={styles.foundHeading}>{t('vaciar.reliefFoundHeading')}</Text>
        {relief.rows.map((row, index) => (
          <ReliefFoundRow key={row.front.key} row={row} index={index} />
        ))}
      </View>

      {showDeadlineSection ? (
        <View style={styles.deadlineCard}>
          <Text style={styles.deadlineQuestion}>{t('vaciar.reliefDeadlineQuestion')}</Text>
          {relief.deadlineFronts.map((front) => {
            const name = front.name.replace(/\s+App$/i, '');
            const userDate = frontDeadlines[front.key] ?? null;
            const existingDue = front.projectId
              ? projectsById[front.projectId]?.due_date ?? null
              : null;
            const effectiveDate = userDate ?? existingDue;
            const formatted = effectiveDate
              ? formatProjectDueDate(effectiveDate, locale)
              : null;
            const isOpen = openDeadlineKey === front.key;

            return (
              <View key={front.key} style={styles.deadlineRow}>
                <View style={styles.deadlineRowHeader}>
                  <Text style={styles.deadlineEmoji}>{front.emoji}</Text>
                  <Text style={styles.deadlineName}>{name}</Text>
                  <TouchableOpacity
                    onPress={() => setOpenDeadlineKey(isOpen ? null : front.key)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('vaciar.reliefAddDateA11y', { name })}
                  >
                    <Text style={styles.deadlineAction}>
                      {formatted ?? t('vaciar.previewAddDate')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {isOpen ? (
                  <View style={styles.datePickerWrap}>
                    <DateSelector
                      compact
                      hideLabel
                      selectedDate={userDate}
                      onSelect={(date) => {
                        setFrontDeadlines((current) => ({ ...current, [front.key]: date }));
                        if (date) setOpenDeadlineKey(null);
                      }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.forwardNote}>{t('vaciar.reliefForwardNote')}</Text>

      <View style={styles.actions}>
        {isSaving ? (
          <ActivityIndicator color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <CalmPrimaryButton
            label={t('vaciar.reliefContinue')}
            onPress={handleConfirmPress}
            large
            style={styles.confirmBtn}
          />
        )}

        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.previewBackA11y')}
        >
          <Text style={styles.backText}>{t('vaciar.previewBack')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
    paddingBottom: THEME.spacing.lg,
  },
  headerCard: {
    ...THEME.surfaces.elevated,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.lavender,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gotItEmoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 32,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 32,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  countsWrap: {
    gap: 4,
    paddingTop: THEME.spacing.xs,
  },
  countLine: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  refiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    alignSelf: 'flex-start',
  },
  refiningText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  foundCard: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    gap: THEME.spacing.sm,
  },
  foundHeading: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  foundRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingVertical: 4,
  },
  foundEmoji: {
    fontSize: THEME.typography.displayEmojiMd.fontSize,
    lineHeight: 26,
    width: 28,
  },
  foundBody: {
    flex: 1,
    gap: 2,
  },
  foundTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  foundMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  deadlineCard: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    gap: THEME.spacing.sm,
  },
  deadlineQuestion: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  deadlineRow: {
    gap: THEME.spacing.xs,
  },
  deadlineRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineEmoji: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
  },
  deadlineName: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
    lineHeight: 22,
  },
  deadlineAction: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
  },
  datePickerWrap: {
    paddingLeft: 36,
  },
  forwardNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: THEME.spacing.sm,
  },
  actions: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
  },
  confirmBtn: {
    alignSelf: 'stretch',
  },
  backBtn: {
    alignItems: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  backText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
