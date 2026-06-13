import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { HoyStreakPill } from '@/components/hoy/HoyStreakPill';
import { HoyCareModeToggle } from '@/components/hoy/HoyCareModeToggle';
import { useI18n } from '@/contexts/I18nContext';

type HoyScreenHeaderProps = {
  /** Ocultar subtítulo cuando la pantalla de inicio ya explica el flujo. */
  showSubtitle?: boolean;
  /** Check-in embebido: solo racha + ayuda, sin título de tab. */
  minimal?: boolean;
  streak?: number;
  checkedInToday?: boolean;
  crisisModeActive?: boolean;
  onCareModePress?: () => void;
};

/** Cabecera de Hoy: racha + ayuda. Tareas vive en la pestaña inferior. */
export function HoyScreenHeader({
  showSubtitle = true,
  minimal = false,
  streak = 0,
  checkedInToday = false,
  crisisModeActive = false,
  onCareModePress,
}: HoyScreenHeaderProps) {
  const { t } = useI18n();

  const trailing = (
    <>
      {onCareModePress ? (
        <HoyCareModeToggle active={crisisModeActive} onPress={onCareModePress} />
      ) : null}
      <HoyStreakPill streak={streak} checkedInToday={checkedInToday} />
      <HeaderIconButton
        onPress={() => router.push('/help')}
        accessibilityLabel={t('settings.help')}
      >
        <CircleHelp size={22} color={THEME.colors.calm.lavenderDeep} />
      </HeaderIconButton>
    </>
  );

  if (minimal) {
    return (
      <View style={styles.minimalRow} accessibilityRole="toolbar">
        {trailing}
      </View>
    );
  }

  return (
    <ScreenHeader
      title={t('tabs.today')}
      subtitle={showSubtitle ? t('hoy.headerSubtitle') : undefined}
      trailing={trailing}
    />
  );
}

const styles = StyleSheet.create({
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
});
