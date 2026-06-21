import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getProjectEmoji } from '@/lib/projectEmoji';

export type MoveProjectOption = {
  id: string | null;
  name: string;
  color?: string;
};

type TaskMoveProjectModalProps = {
  visible: boolean;
  taskTitle: string;
  currentProjectId: string | null;
  projects: MoveProjectOption[];
  onSelect: (projectId: string | null) => void;
  onClose: () => void;
};

export function TaskMoveProjectModal({
  visible,
  taskTitle,
  currentProjectId,
  projects,
  onSelect,
  onClose,
}: TaskMoveProjectModalProps) {
  const { t } = useI18n();

  const options = useMemo(() => {
    const loose: MoveProjectOption = {
      id: null,
      name: t('projectsUi.looseTitle'),
    };
    const list = [loose, ...projects.filter((project) => project.id !== currentProjectId)];
    return list;
  }, [currentProjectId, projects, t]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('tasks.replanMoveProjectTitle')}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {taskTitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('errors.cancel')}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const isCurrent =
                option.id === currentProjectId ||
                (option.id === null && currentProjectId === null);
              return (
                <TouchableOpacity
                  key={option.id ?? 'loose'}
                  style={[styles.option, isCurrent && styles.optionCurrent]}
                  onPress={() => {
                    if (isCurrent) {
                      onClose();
                      return;
                    }
                    onSelect(option.id);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrent }}
                >
                  {option.id ? (
                    <Text style={styles.optionEmoji}>{getProjectEmoji(option.name)}</Text>
                  ) : (
                    <View style={styles.looseDot} />
                  )}
                  <Text style={styles.optionName} numberOfLines={1}>
                    {option.name}
                  </Text>
                  {isCurrent ? (
                    <Text style={styles.currentBadge}>{t('tasks.replanCurrentProject')}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxHeight: '72%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  optionCurrent: {
    opacity: 0.65,
  },
  optionEmoji: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  looseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.text.tertiary,
    marginHorizontal: 9,
  },
  optionName: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
  currentBadge: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
  },
});
