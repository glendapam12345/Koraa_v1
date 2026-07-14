import { View, StyleSheet } from 'react-native';
import { FeelingEnergyScale } from '@/components/checkin/FeelingEnergyScale';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type VisualStepSliderProps = {
  value: number;
  onChange: (level: number) => void;
  label: string;
  size?: 'default' | 'large';
};

/** Escala de energía visual — misma cara 1–5 que el check-in mock. */
export function VisualStepSlider({ value, onChange, label }: VisualStepSliderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <FeelingEnergyScale
        value={value}
        onChange={onChange}
        label={label || t('quickRecheck.energyLabel')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.md,
  },
});
