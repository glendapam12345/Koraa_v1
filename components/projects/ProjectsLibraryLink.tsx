import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, FolderKanban } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

const UI_ACCENT = THEME.colors.calm.lavenderDeep;

type ProjectsLibraryLinkProps = {
  /** Margen inferior extra (p. ej. en Tareas antes del campo de captura). */
  marginBottom?: boolean;
  /** Versión destacada arriba en Tareas. */
  prominent?: boolean;
};

export function ProjectsLibraryLink({
  marginBottom = true,
  prominent = false,
}: ProjectsLibraryLinkProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        prominent && styles.cardProminent,
        marginBottom && styles.cardWithMargin,
      ]}
      onPress={() => router.push('/proyectos')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('projects.libraryA11y')}
      accessibilityHint={t('projects.libraryA11yHint')}
    >
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <FolderKanban size={22} color={UI_ACCENT} strokeWidth={1.8} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{t('projects.libraryTitle')}</Text>
          <Text style={styles.hint}>{t('projects.librarySub')}</Text>
        </View>
        <ChevronRight size={22} color={UI_ACCENT} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.elevated,
    overflow: 'hidden',
  },
  cardProminent: {
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
  },
  cardWithMargin: {},
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm + 2,
    paddingHorizontal: THEME.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard + 2,
    backgroundColor: THEME.colors.calm.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
});
