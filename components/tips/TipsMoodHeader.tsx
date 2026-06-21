import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type TipsMoodHeaderProps = {
  emoji: string;
  emotionName: string;
  energyLevel: number;
  patternLine: string;
  onPressEmotion?: () => void;
};

export function TipsMoodHeader({
  emoji,
  emotionName,
  energyLevel,
  patternLine,
  onPressEmotion,
}: TipsMoodHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={onPressEmotion}
        disabled={!onPressEmotion}
        activeOpacity={onPressEmotion ? 0.8 : 1}
        accessibilityRole={onPressEmotion ? 'button' : undefined}
        accessibilityLabel={t('tips.headerMoodA11y', { emotion: emotionName, energy: energyLevel })}
        accessibilityHint={onPressEmotion ? t('tipsExtra.a11yMoodChangeHint') : undefined}
        style={styles.statusRow}
      >
        <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
          {emoji}
        </Text>
        <Text style={styles.statusLine}>
          {t('hoy.feelingLine', { emotion: emotionName, energy: energyLevel })}
        </Text>
      </TouchableOpacity>

      {patternLine ? <Text style={styles.patternLine}>{patternLine}</Text> : null}

      {onPressEmotion ? (
        <Text style={styles.changeHint}>{t('tips.focusLinkFeel')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: THEME.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    alignSelf: 'flex-start',
  },
  emoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
  },
  statusLine: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  patternLine: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  changeHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
