import { useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { QuickBreathModal } from '@/components/hoy/QuickBreathModal';
import { useI18n } from '@/contexts/I18nContext';

/** Nudge suave de respirar — apoyo, no compite con el foco. */
export function HoyBreathNudge() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.planBreakBreatheA11y')}
      >
        <CalmCard style={styles.card}>
          <Text style={styles.title}>{t('hoy.breathNudgeTitle')}</Text>
          <Text style={styles.body}>{t('hoy.breathNudgeBody')}</Text>
        </CalmCard>
      </Pressable>
      <QuickBreathModal
        visible={open}
        onClose={() => setOpen(false)}
        onComplete={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  card: {
    gap: 4,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
    borderWidth: 1,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
