import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale } from '@/lib/i18n';
import type { CaptureFront, ProjectMeta } from '@/lib/captureProjectFronts';
import { DateSelector } from '@/components/tasks/DateSelector';
import { formatProjectDueDate } from '@/lib/projectProgress';

type CaptureReviewDeadlinesSectionProps = {
  locale: AppLocale;
  fronts: CaptureFront[];
  projects: ProjectMeta[];
  frontDeadlines: Record<string, string | null>;
  onDeadlineChange: (frontKey: string, date: string | null) => void;
};

export function CaptureReviewDeadlinesSection({
  locale,
  fronts,
  projects,
  frontDeadlines,
  onDeadlineChange,
}: CaptureReviewDeadlinesSectionProps) {
  const { t } = useI18n();
  const [openDeadlineKey, setOpenDeadlineKey] = useState<string | null>(null);

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects],
  );

  const deadlineFronts = fronts.filter((front) => front.tasks.length > 0);
  if (deadlineFronts.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Calendar size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('frentes.reviewDeadlineTitle')}</Text>
      </View>
      <Text style={styles.sub}>{t('frentes.reviewDeadlineSub')}</Text>

      {deadlineFronts.map((front) => {
        const name = front.name.replace(/\s+App$/i, '');
        const userDate = frontDeadlines[front.key] ?? null;
        const existingDue = front.projectId
          ? (projectsById[front.projectId]?.due_date ?? null)
          : null;
        const effectiveDate = userDate ?? existingDue;
        const formatted = effectiveDate ? formatProjectDueDate(effectiveDate, locale) : null;
        const isOpen = openDeadlineKey === front.key;

        return (
          <View key={front.key} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.emoji}>{front.emoji}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <TouchableOpacity
                onPress={() => setOpenDeadlineKey(isOpen ? null : front.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('vaciar.reliefAddDateA11y', { name })}
              >
                <Text style={styles.action}>{formatted ?? t('vaciar.previewAddDate')}</Text>
              </TouchableOpacity>
            </View>
            {isOpen ? (
              <View style={styles.pickerWrap}>
                <DateSelector
                  compact
                  hideLabel
                  selectedDate={userDate}
                  onSelect={(date) => {
                    onDeadlineChange(front.key, date);
                    if (date) setOpenDeadlineKey(null);
                  }}
                />
                {userDate || existingDue ? (
                  <TouchableOpacity
                    onPress={() => {
                      onDeadlineChange(front.key, null);
                      setOpenDeadlineKey(null);
                    }}
                    style={styles.clearBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.clearText}>{t('frentes.reviewDeadlineClear')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  row: {
    gap: THEME.spacing.xs,
    paddingTop: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
  },
  name: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  action: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 18,
  },
  pickerWrap: {
    paddingLeft: 28,
    gap: 6,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
