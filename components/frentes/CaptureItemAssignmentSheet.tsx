import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FolderOpen, Leaf, Sparkles, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CaptureAssignmentKind } from '@/lib/frentes/captureItemFront';
import type { ProjectMeta } from '@/lib/captureProjectFronts';

type CaptureItemAssignmentSheetProps = {
  visible: boolean;
  taskTitle: string;
  currentKind: CaptureAssignmentKind;
  selectedProjectId?: string | null;
  suggestedFrontName?: string;
  suggestedFrontKey?: string;
  projects: ProjectMeta[];
  onSelect: (
    kind: CaptureAssignmentKind,
    options?: { projectId?: string; frontKey?: string },
  ) => void;
  onClose: () => void;
};

export function CaptureItemAssignmentSheet({
  visible,
  taskTitle,
  currentKind,
  selectedProjectId = null,
  suggestedFrontName,
  suggestedFrontKey,
  projects,
  onSelect,
  onClose,
}: CaptureItemAssignmentSheetProps) {
  const { t } = useI18n();

  const handleKind = (kind: CaptureAssignmentKind, options?: { projectId?: string; frontKey?: string }) => {
    onSelect(kind, options);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('frentes.assignmentTitle')}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {taskTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            <TouchableOpacity
              style={[styles.kindRow, currentKind === 'loose' && styles.kindRowActive]}
              onPress={() => handleKind('loose')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Leaf size={20} color={THEME.colors.calm.lavenderDeep} />
              <View style={styles.kindText}>
                <Text style={styles.kindLabel}>{t('frentes.assignmentLoose')}</Text>
                <Text style={styles.kindMeta}>{t('frentes.assignmentLooseHint')}</Text>
              </View>
            </TouchableOpacity>

            {suggestedFrontName ? (
              <TouchableOpacity
                style={[styles.kindRow, currentKind === 'new_project' && styles.kindRowActive]}
                onPress={() =>
                  handleKind('new_project', { frontKey: suggestedFrontKey ?? undefined })
                }
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Sparkles size={20} color={THEME.colors.calm.lavenderDeep} />
                <View style={styles.kindText}>
                  <Text style={styles.kindLabel}>
                    {t('frentes.assignmentNewProject', { name: suggestedFrontName })}
                  </Text>
                  <Text style={styles.kindMeta}>{t('frentes.assignmentNewProjectHint')}</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.sectionLabel}>{t('frentes.assignmentExistingHeading')}</Text>

            {projects.length === 0 ? (
              <Text style={styles.emptyProjects}>{t('frentes.assignmentNoProjects')}</Text>
            ) : (
              projects.map((project) => {
                const isCurrent =
                  currentKind === 'existing_project' && selectedProjectId === project.id;
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.projectRow, isCurrent && styles.kindRowActive]}
                    onPress={() => handleKind('existing_project', { projectId: project.id })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    <FolderOpen size={18} color={THEME.colors.text.secondary} />
                    <Text style={styles.projectLabel}>{project.name}</Text>
                  </TouchableOpacity>
                );
              })
            )}
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
    maxHeight: '75%',
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
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
    padding: THEME.spacing.md,
    gap: 10,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  kindRowActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  kindText: {
    flex: 1,
    gap: 4,
  },
  kindLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  kindMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  emptyProjects: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  projectLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
  },
});
