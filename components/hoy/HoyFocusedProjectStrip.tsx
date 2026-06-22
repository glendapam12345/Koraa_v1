import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, X, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { FocusedProjectInfo } from '@/hooks/useFocusedProject';

type HoyFocusedProjectStripProps = {
  project: FocusedProjectInfo;
  onClearFocus: () => void;
};

/** Proyecto enfocado visible dentro del plan de Hoy. */
export function HoyFocusedProjectStrip({ project, onClearFocus }: HoyFocusedProjectStripProps) {
  const { t } = useI18n();

  const openOrganized = () => {
    router.push(`/(tabs)/vaciar?segment=projects&projectId=${project.id}`);
  };

  return (
    <View style={[styles.wrap, { borderColor: `${project.color}55` }]}>
      <TouchableOpacity
        style={styles.mainTouch}
        onPress={openOrganized}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.focusedProjectOrganizedA11y', { name: project.name })}
      >
        <View style={[styles.dot, { backgroundColor: project.color }]} />
        <Sparkles size={14} color={project.color} />
        <Text style={styles.label} numberOfLines={1}>
          {t('hoy.focusedProjectLabel', { name: project.name })}
        </Text>
        <ChevronRight size={14} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => void onClearFocus()}
        hitSlop={10}
        style={styles.clearBtn}
        accessibilityRole="button"
        accessibilityLabel={t('projects.focusedBannerClearA11y', { name: project.name })}
      >
        <X size={16} color={THEME.colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
  },
  mainTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minHeight: THEME.sizes.touchTarget - 8,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flexShrink: 1,
    lineHeight: 16,
  },
  clearBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
