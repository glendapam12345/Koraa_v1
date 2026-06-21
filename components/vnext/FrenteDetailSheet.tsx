import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import type { Task } from '@/components/tasks/TaskCard';
import type { FrenteDashboardItem } from '@/lib/vnext/buildFrentesDashboard';

type FrenteDetailSheetProps = {
  visible: boolean;
  front: FrenteDashboardItem | null;
  tasks: Task[];
  onClose: () => void;
  onViewTasks: (front: FrenteDashboardItem) => void;
};

export function FrenteDetailSheet({
  visible,
  front,
  tasks,
  onClose,
  onViewTasks,
}: FrenteDetailSheetProps) {
  const { t } = useI18n();

  if (!front) return null;

  const previewTasks = tasks.slice(0, 6);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.hero, { backgroundColor: front.backgroundColor }]}>
              <Text style={styles.heroEmoji}>{front.emoji}</Text>
              <View style={styles.heroText}>
                <Text style={[styles.heroName, { color: front.accentColor }]}>{front.name}</Text>
                <Text style={styles.heroCount}>
                  {front.openTaskCount === 1
                    ? t('frentes.chipCountOne')
                    : t('frentes.chipCount', { count: front.openTaskCount })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>{t('vnext.frentesOpenSteps')}</Text>
            {previewTasks.length === 0 ? (
              <Text style={styles.empty}>{t('vnext.frentesNoOpenSteps')}</Text>
            ) : (
              previewTasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={[styles.dot, { backgroundColor: front.accentColor }]} />
                  <Text style={styles.taskText} numberOfLines={2}>
                    {task.content}
                  </Text>
                </View>
              ))
            )}
            {tasks.length > previewTasks.length ? (
              <Text style={styles.more}>
                {t('vnext.frentesMoreSteps', { count: tasks.length - previewTasks.length })}
              </Text>
            ) : null}
          </ScrollView>

          <CalmPrimaryButton
            label={t('vnext.frentesViewInTasks')}
            onPress={() => onViewTasks(front)}
            large
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  hero: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  heroEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
  },
  heroCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  closeBtn: {
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 10,
    paddingBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  empty: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  more: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
  },
});
