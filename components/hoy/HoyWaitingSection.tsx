import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';

type HoyWaitingSectionProps = {
  count: number;
  crisisMode?: boolean;
  /** Lista de tareas que pueden esperar (hasta 3 en vista previa). */
  previewLabels?: string[];
  /** Slot opcional con filas interactivas de tareas. */
  tasksSlot?: ReactNode;
};

/** Cosas que no son para hoy — pueden esperar. */
export function HoyWaitingSection({
  count,
  crisisMode = false,
  previewLabels = [],
  tasksSlot,
}: HoyWaitingSectionProps) {
  const { t } = useI18n();

  if (count <= 0) return null;

  const title =
    count === 1 ? t('hoy.waitingTitleOne', { count }) : t('hoy.waitingTitleMany', { count });
  const previews = previewLabels.filter(Boolean).slice(0, 3);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t('hoy.waitingA11y', { count })}
    >
      <CalmCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Clock size={20} color={THEME.colors.text.secondary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.sectionTitle}>{t('hoy.waitingSectionTitle')}</Text>
          <Text style={styles.body}>{title}</Text>
          <Text style={styles.hint}>
            {crisisMode ? t('hoy.waitingHintCare') : t('hoy.waitingHint')}
          </Text>
        </View>
      </View>

      {tasksSlot ? <View style={styles.tasksSlot}>{tasksSlot}</View> : null}

      {!tasksSlot && previews.length > 0 ? (
        <View style={styles.previewList}>
          {previews.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.previewItem}>
              <Text style={styles.previewBullet}>·</Text>
              <Text style={styles.previewText} numberOfLines={2}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      </CalmCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  body: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 17,
  },
  tasksSlot: {
    gap: THEME.spacing.sm,
  },
  previewList: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  previewBullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
  },
  previewText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
});
