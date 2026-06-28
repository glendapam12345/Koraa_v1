import { View, Text, StyleSheet } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';

import type { ProactiveReflectionVariant } from '@/lib/hoy/proactivePlanSignals';

type HoyDayReflectionCardProps = {
  onPress: () => void;
  variant?: ProactiveReflectionVariant;
};

function reflectionCopy(
  variant: ProactiveReflectionVariant,
  t: (key: import('@/lib/i18n').TranslationKey) => string,
) {
  if (variant === 'afternoon') {
    return {
      title: t('hoy.dayReflectionAfternoonTitle'),
      body: t('hoy.dayReflectionAfternoonBody'),
    };
  }
  if (variant === 'lowEnergy') {
    return {
      title: t('hoy.dayReflectionLowEnergyTitle'),
      body: t('hoy.dayReflectionLowEnergyBody'),
    };
  }
  return {
    title: t('hoy.dayReflectionTitle'),
    body: t('hoy.dayReflectionBody'),
  };
}

/** Entrada visible en Hoy para replanear cuando el día no salió como esperabas. */
export function HoyDayReflectionCard({
  onPress,
  variant = 'default',
}: HoyDayReflectionCardProps) {
  const { t } = useI18n();
  const copy = reflectionCopy(variant, t);

  return (
    <CalmCard style={styles.card}>
      <View style={styles.headerRow}>
        <RefreshCw size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{copy.title}</Text>
      </View>
      <Text style={styles.body}>{copy.body}</Text>
      <CalmPrimaryButton
        label={t('hoy.dayReflectionCta')}
        variant="soft"
        onPress={onPress}
        accessibilityLabel={t('hoy.dayReflectionA11y')}
      />
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.lavender,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
