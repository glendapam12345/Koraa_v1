import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { HoyStreakPill } from '@/components/hoy/HoyStreakPill';
import { HoyCareModeToggle } from '@/components/hoy/HoyCareModeToggle';
import { TimeOfDayChip } from '@/components/hoy/TimeOfDayChip';
import { useI18n } from '@/contexts/I18nContext';
import { getFirstName } from '@/lib/displayName';
import { formatGreetingWithName, formatNightReturnGreeting, useKoraaGreeting } from '@/hooks/useKoraaGreeting';

type HoyScreenHeaderProps = {
  /** Nombre para el saludo personalizado (misma línea que Semana: un solo bloque de cabecera). */
  displayName?: string;
  hasCheckInToday?: boolean;
  /** Ocultar subtítulo del saludo. */
  showSubtitle?: boolean;
  /** Título compacto como Calendario (20px). */
  compact?: boolean;
  /** Check-in embebido: solo racha + ayuda, sin título de tab. */
  minimal?: boolean;
  streak?: number;
  checkedInToday?: boolean;
  crisisModeActive?: boolean;
  onCareModePress?: () => void;
};

/** Cabecera de Hoy: saludo + racha + ayuda (un bloque, sin duplicar título). */
export function HoyScreenHeader({
  displayName = '',
  hasCheckInToday = true,
  showSubtitle = true,
  compact = true,
  minimal = false,
  streak = 0,
  checkedInToday = false,
  crisisModeActive = false,
  onCareModePress,
}: HoyScreenHeaderProps) {
  const { t } = useI18n();
  const { period, lateNight, greeting, timeChipLabel, greetingSubline } = useKoraaGreeting();
  const firstName = getFirstName(displayName);

  const title = lateNight
    ? formatNightReturnGreeting(t, firstName, period)
    : formatGreetingWithName(t, greeting, firstName);

  const subtitle = !hasCheckInToday
    ? t('hoy.startHereCompanionSub')
    : lateNight
      ? t('hoy.nightReturnSubline', { name: firstName })
      : greetingSubline;

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
    <View style={styles.wrap}>
      <TimeOfDayChip period={period} label={timeChipLabel} />
      <ScreenHeader
        compact={compact}
        title={title}
        subtitle={showSubtitle ? subtitle : undefined}
        trailing={trailing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
});
