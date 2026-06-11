import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { ProjectsLibraryPanel } from '@/components/projects/ProjectsLibraryPanel';

export default function ProyectosScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>{t('projects.signIn')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={THEME.colors.gradientTint.header} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel={t('projects.back')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={THEME.colors.text.main} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{t('projects.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('projects.subtitle')}</Text>
          </View>
        </View>
      </LinearGradient>
      <ProjectsLibraryPanel userId={user.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  headerGradient: {
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  backButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...THEME.typography.h3,
    fontSize: 22,
    color: THEME.colors.text.main,
  },
  headerSubtitle: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
});
