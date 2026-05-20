import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { FolderOpen } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

interface ProjectManagerProps {
  userId: string;
  onProjectSelect: () => void;
}

export function ProjectManager({ userId: _userId, onProjectSelect: _onProjectSelect }: ProjectManagerProps) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <FolderOpen size={48} color={THEME.colors.text.secondary} />
        <Text style={styles.emptyTitle}>{t('projectManager.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('projectManager.emptyText')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  emptyState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
});
