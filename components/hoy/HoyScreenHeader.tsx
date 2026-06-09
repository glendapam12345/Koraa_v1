import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Brain, CircleHelp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useI18n } from '@/contexts/I18nContext';

/** Cabecera de Hoy: título + acceso persistente a Tareas (tab oculta) y Ayuda. */
export function HoyScreenHeader() {
  const { t } = useI18n();

  return (
    <ScreenHeader
      title={t('tabs.today')}
      subtitle={t('hoy.headerSubtitle')}
      trailing={
        <View style={styles.trailing}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/vaciar')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.tasksCaptureA11y')}
            accessibilityHint={t('hoy.tasksCaptureHint')}
            style={[styles.iconButton, styles.iconButtonPlain]}
          >
            <Brain size={22} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/help')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('settings.help')}
            style={[styles.iconButton, styles.iconButtonPlain]}
          >
            <CircleHelp size={22} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  trailing: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlain: {
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
});
