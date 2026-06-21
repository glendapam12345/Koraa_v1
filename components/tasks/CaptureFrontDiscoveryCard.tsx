import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Calendar, Pencil, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { DateSelector } from '@/components/tasks/DateSelector';
import { formatProjectDueDate } from '@/lib/projectProgress';
import type { AppLocale } from '@/lib/i18n';

type CaptureFrontDiscoveryCardProps = {
  front: CaptureFront;
  items: EnrichedCaptureItem[];
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  deadline: string | null;
  onDeadlineChange: (date: string | null) => void;
  onItemsChange: (items: EnrichedCaptureItem[]) => void;
  onAddMoreItems: () => void;
  locale: AppLocale;
  existingProjectDueDate?: string | null;
};

function frontDisplayName(name: string): string {
  return name.replace(/\s+App$/i, '');
}

export function CaptureFrontDiscoveryCard({
  front,
  items,
  index,
  expanded,
  onToggleExpand,
  deadline,
  onDeadlineChange,
  onItemsChange,
  onAddMoreItems,
  locale,
  existingProjectDueDate,
}: CaptureFrontDiscoveryCardProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const displayName = frontDisplayName(front.name);
  const itemCount = items.length;
  const effectiveDeadline = deadline ?? existingProjectDueDate ?? null;
  const formattedDeadline = effectiveDeadline
    ? formatProjectDueDate(effectiveDeadline, locale)
    : null;

  const updateItemContent = (id: string, content: string) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, content } : item)));
  };

  const itemsLabel =
    itemCount === 1
      ? t('vaciar.previewFrontItemsOne')
      : t('vaciar.previewFrontItems', { count: itemCount });

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      entering={FadeInDown.delay(index * 55).duration(300)}
      style={[styles.card, expanded && styles.cardExpanded]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleExpand}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('vaciar.previewFrontCardA11y', { name: displayName, count: itemCount })}
      >
        <View style={styles.headerMain}>
          <Text style={styles.emoji}>{front.emoji}</Text>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={styles.meta}>{itemsLabel}</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={THEME.colors.calm.lavenderDeep} />
        ) : (
          <ChevronDown size={20} color={THEME.colors.calm.lavenderDeep} />
        )}
      </TouchableOpacity>

      {!expanded ? (
        <View style={styles.collapsedBody}>
          {front.suggestedNewProject && !effectiveDeadline ? (
            <Text style={styles.projectNudge}>{t('vaciar.previewProjectQuestion')}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.deadlineRow}
            onPress={() => setShowDatePicker((open) => !open)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.previewAddDeadlineA11y', { name: displayName })}
          >
            <Calendar size={16} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.deadlineLabel}>
              {formattedDeadline
                ? t('vaciar.previewDeadlineSet', { date: formattedDeadline })
                : t('vaciar.previewPossibleDeadline')}
            </Text>
            {!formattedDeadline ? (
              <Text style={styles.deadlineAction}>{t('vaciar.previewAddDate')}</Text>
            ) : null}
          </TouchableOpacity>
          {showDatePicker ? (
            <View style={styles.datePickerWrap}>
              <DateSelector
                compact
                hideLabel
                selectedDate={deadline}
                onSelect={(date) => {
                  onDeadlineChange(date);
                  if (date) setShowDatePicker(false);
                }}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.expandedBody}>
          <Text style={styles.sectionLabel}>{t('vaciar.previewDetectedItems')}</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.bullet}>•</Text>
              {editing ? (
                <TextInput
                  style={styles.itemInput}
                  value={item.content}
                  onChangeText={(text) => updateItemContent(item.id, text)}
                  multiline
                  maxLength={300}
                  placeholderTextColor={THEME.colors.text.tertiary}
                />
              ) : (
                <Text style={styles.itemText}>{item.content}</Text>
              )}
            </View>
          ))}

          {front.suggestedNewProject && !effectiveDeadline ? (
            <Text style={styles.projectNudge}>{t('vaciar.previewProjectQuestion')}</Text>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditing((value) => !value)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Pencil size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionText}>
                {editing ? t('vaciar.previewDoneEdit') : t('vaciar.previewEditItems')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowDatePicker((open) => !open)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Calendar size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionText}>{t('vaciar.previewAddDeadline')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onAddMoreItems}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionText}>{t('vaciar.previewAddMoreItems')}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker ? (
            <View style={styles.datePickerWrap}>
              <DateSelector
                compact
                hideLabel
                selectedDate={deadline}
                onSelect={(date) => {
                  onDeadlineChange(date);
                  if (date) setShowDatePicker(false);
                }}
              />
            </View>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 32,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 26,
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  collapsedBody: {
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  expandedBody: {
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
    paddingTop: THEME.spacing.sm,
  },
  projectNudge: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
  },
  deadlineLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  deadlineAction: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
  },
  datePickerWrap: {
    paddingTop: 4,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  bullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
    width: 12,
  },
  itemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  itemInput: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.xs,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    minHeight: THEME.sizes.touchTarget,
  },
  actionText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
});
