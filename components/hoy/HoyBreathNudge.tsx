import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wind } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { QuickBreathModal } from '@/components/hoy/QuickBreathModal';
import { useI18n } from '@/contexts/I18nContext';

type HoyBreathNudgeProps = {
  /** `icon`: cabecera Hoy. `chip`: Consejos. */
  variant?: 'icon' | 'chip';
};

/** Acceso suave al respiro — no abre una fila extra en Hoy. */
export function HoyBreathNudge({ variant = 'chip' }: HoyBreathNudgeProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const trigger =
    variant === 'icon' ? (
      <HeaderIconButton
        onPress={() => setOpen(true)}
        accessibilityLabel={t('hoy.planBreakBreatheA11y')}
      >
        <Wind size={20} color={THEME.colors.calm.lavenderDeep} />
      </HeaderIconButton>
    ) : (
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.chip}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.planBreakBreatheA11y')}
      >
        <Wind size={14} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.label}>{t('hoy.rhythmChipBreathe')}</Text>
      </TouchableOpacity>
    );

  return (
    <>
      {trigger}
      <QuickBreathModal
        visible={open}
        onClose={() => setOpen(false)}
        onComplete={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
});
