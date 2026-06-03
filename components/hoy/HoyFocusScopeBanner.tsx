import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Target } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyFocusScopeBannerProps = {
  totalPending: number;
  focusCount: number;
};

export function HoyFocusScopeBanner({ totalPending, focusCount }: HoyFocusScopeBannerProps) {
  const { t } = useI18n();
  const showStats = totalPending > 0 && focusCount > 0 && totalPending > focusCount;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={
        showStats
          ? t('hoyExtra.focusScopeA11yWithStats', { total: totalPending, focus: focusCount })
          : t('hoyExtra.focusScopeA11y')
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Target size={18} color={THEME.colors.gradient.blue} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{t('hoy.focusScopeTitle')}</Text>
          <Text style={styles.body}>{t('hoy.focusScopeBody')}</Text>
          {showStats ? (
            <Text style={styles.stats}>{t('hoy.focusScopeStats', { total: totalPending, focus: focusCount })}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.linksRow}>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push('/(tabs)/vaciar')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.focusScopeTasksA11y')}
          accessibilityHint={t('hoyExtra.focusScopeTasksHint')}
        >
          <Text style={styles.linkText}>{t('hoy.focusScopeGoTasks')}</Text>
        </TouchableOpacity>
        <Text style={styles.linkSep}>·</Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push('/proyectos')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.focusScopeProjectsA11y')}
          accessibilityHint={t('hoyExtra.focusScopeProjectsHint')}
        >
          <Text style={styles.linkText}>{t('hoy.focusScopeGoProjects')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 4,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  stats: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.xs,
  },
  linkBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xs,
  },
  linkText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  linkSep: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
  },
});
