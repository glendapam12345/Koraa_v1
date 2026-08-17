import { Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { FirstDayCloseCue } from '@/lib/firstDayClose';

type HoyFirstDayCloseProps = {
  cue: FirstDayCloseCue;
  allDone?: boolean;
  onEnableReminder?: () => void;
};

/** Cierre suave del día 0: el valor ya está; mañana hay cita. */
export function HoyFirstDayClose({
  cue,
  allDone = false,
  onEnableReminder,
}: HoyFirstDayCloseProps) {
  const { t } = useI18n();
  const message = allDone
    ? cue.withTime
      ? t('hoy.firstDayDoneWithTime', { time: cue.timeLabel })
      : t('hoy.firstDayDoneNoTime')
    : cue.withTime
      ? t('hoy.firstDayCloseWithTime', { time: cue.timeLabel })
      : t('hoy.firstDayCloseNoTime');

  const showEnable =
    !allDone && !cue.withTime && Boolean(cue.timeLabel) && Boolean(onEnableReminder);

  return (
    <>
      <Text style={styles.line} accessibilityRole="text">
        {message}
      </Text>
      {showEnable ? (
        <Pressable
          onPress={onEnableReminder}
          style={({ pressed }) => [styles.enableBtn, pressed && styles.enablePressed]}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.firstDayCloseEnableA11y', { time: cue.timeLabel })}
        >
          <Text style={styles.enableLabel}>
            {t('hoy.firstDayCloseEnableCta', { time: cue.timeLabel })}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  line: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: THEME.spacing.sm,
  },
  enableBtn: {
    alignSelf: 'center',
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  enablePressed: {
    opacity: 0.85,
  },
  enableLabel: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
});
