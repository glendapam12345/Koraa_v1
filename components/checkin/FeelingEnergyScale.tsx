import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const LEVELS: {
  id: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  wordKey: TranslationKey;
  tint: string;
}[] = [
  { id: 1, emoji: '😔', wordKey: 'hoy.energyWord1', tint: THEME.colors.tint.blue.veryFaint },
  { id: 2, emoji: '😐', wordKey: 'hoy.energyWord2', tint: THEME.colors.calm.mist },
  { id: 3, emoji: '🙂', wordKey: 'hoy.energyWord3', tint: THEME.colors.tint.blue.veryFaint },
  { id: 4, emoji: '😊', wordKey: 'hoy.energyWord4', tint: THEME.colors.calm.lavender },
  { id: 5, emoji: '🤩', wordKey: 'hoy.energyWord5', tint: THEME.colors.calm.blush },
];

type FeelingEnergyScaleProps = {
  value: number;
  onChange: (level: number) => void;
  /** Etiqueta opcional encima de la escala. */
  label?: string;
};

/** Escala 1–5 con caras — estilo mock check-in. */
export function FeelingEnergyScale({ value, onChange, label }: FeelingEnergyScaleProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row} accessibilityRole="radiogroup">
        {LEVELS.map((level) => {
          const selected = value === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.cell,
                { backgroundColor: level.tint },
                selected && styles.cellSelected,
              ]}
              onPress={() => onChange(level.id)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t('onboardingA11y.selectEnergy', {
                label: `${level.id} ${t(level.wordKey)}`,
              })}
            >
              <Text style={styles.emoji}>{level.emoji}</Text>
              <Text style={[styles.number, selected && styles.numberSelected]}>{level.id}</Text>
              <Text style={[styles.word, selected && styles.wordSelected]} numberOfLines={1}>
                {t(level.wordKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  label: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: 2,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 88,
  },
  cellSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 2,
    backgroundColor: THEME.colors.calm.lavender,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  number: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  numberSelected: {
    color: THEME.colors.calm.lavenderDeep,
  },
  word: {
    ...THEME.typography.small,
    fontSize: 10,
    lineHeight: 12,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
  },
  wordSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
