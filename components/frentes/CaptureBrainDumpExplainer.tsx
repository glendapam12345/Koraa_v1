import { View, Text, StyleSheet } from 'react-native';
import { Mic, PenLine } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export function CaptureBrainDumpExplainer() {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <PenLine size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.text}>{t('frentes.brainDumpWrite')}</Text>
      </View>
      <View style={styles.row}>
        <Mic size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.text}>{t('frentes.brainDumpSpeak')}</Text>
      </View>
      <Text style={styles.note}>{t('frentes.brainDumpHowFrentes')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    padding: THEME.spacing.sm,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
    lineHeight: 18,
  },
  note: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
});
