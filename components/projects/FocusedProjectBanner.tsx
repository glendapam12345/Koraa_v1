import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight, X } from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';

type FocusedProjectBannerProps = {
  project: FocusedProjectInfo;
  onClearFocus: () => void;
};

/** Aviso suave en Tareas cuando hay un proyecto enfocado para hoy. */
export function FocusedProjectBanner({ project, onClearFocus }: FocusedProjectBannerProps) {
  const { t } = useI18n();

  return (
    <View
      style={[styles.wrap, { borderLeftColor: project.color }]}
      accessibilityRole="summary"
      accessibilityLabel={t('projects.focusedBannerTitle', { name: project.name })}
    >
      <View style={styles.headerRow}>
        <Sparkles size={16} color={project.color} />
        <Text style={styles.title} numberOfLines={1}>
          {t('projects.focusedBannerTitle', { name: project.name })}
        </Text>
        <TouchableOpacity
          onPress={() => void onClearFocus()}
          hitSlop={10}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel={t('projects.focusedBannerClearA11y', { name: project.name })}
        >
          <X size={18} color={THEME.colors.text.tertiary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.body}>{t('projects.focusedBannerBody')}</Text>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push(`/project/${project.id}` as Href)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('projects.focusedBannerView', { name: project.name })}
      >
        <Text style={styles.linkText}>{t('projects.focusedBannerView')}</Text>
        <ChevronRight size={16} color={THEME.colors.gradient.blue} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    borderLeftWidth: 4,
    gap: THEME.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  clearBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: THEME.sizes.touchTarget,
    alignSelf: 'flex-start',
  },
  linkText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
});
