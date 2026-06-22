import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type HoyMoveTasksLinkProps = {
  /** Dentro de la tarjeta del plan (sin CalmCard extra). */
  embedded?: boolean;
};

export function HoyMoveTasksLink({ embedded = false }: HoyMoveTasksLinkProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(tabs)/semana',
          params: { planAhead: '1' },
        })
      }
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.moveTasksA11y')}
      style={embedded ? styles.embeddedTouch : undefined}
    >
      {embedded ? (
        <View style={styles.embeddedRow}>
          <CalendarDays size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.embeddedLabel}>{t('hoy.moveTasksLink')}</Text>
        </View>
      ) : (
        <CalmCard style={styles.card}>
          <CalendarDays size={18} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.label}>{t('hoy.moveTasksLink')}</Text>
        </CalmCard>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.calm.mist,
    borderColor: THEME.colors.calm.border,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  embeddedTouch: {
    width: '100%',
  },
  embeddedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 44,
  },
  embeddedLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
});
