import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type TaskCaptureLivePreviewProps = {
  lines: string[];
};

/** Confirma que Koraa escuchó varios pasos — sin mostrar metadatos. */
export function TaskCaptureLivePreview({ lines }: TaskCaptureLivePreviewProps) {
  const { t } = useI18n();
  if (lines.length < 2) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.label}>{t('vaciar.captureLivePreview', { count: lines.length })}</Text>
      <Text style={styles.hint}>{t('vaciar.captureLivePreviewListening')}</Text>
      {lines.map((line, index) => (
        <View key={`${index}-${line}`} style={styles.row}>
          <Text style={styles.bullet}>·</Text>
          <Text style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingTop: THEME.spacing.xs,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
  },
  bullet: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 22,
    width: 12,
  },
  line: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
});
