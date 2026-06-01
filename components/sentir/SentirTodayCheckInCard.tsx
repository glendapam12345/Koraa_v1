import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { getEmotionEmoji } from '@/lib/emotionalInsights';

type SentirTodayCheckInCardProps = {
  emotion: string;
  emotionLabel: string;
  energyLevel: number;
  onQuickRecheck: () => void;
  onFullCheckIn: () => void;
};

export function SentirTodayCheckInCard({
  emotion,
  emotionLabel,
  energyLevel,
  onQuickRecheck,
  onFullCheckIn,
}: SentirTodayCheckInCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.fill[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{getEmotionEmoji(emotion)}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('sentirToday.checkedInTitle')}</Text>
            <Text style={styles.summary}>
              {t('sentirToday.checkedInSummary', {
                emotion: emotionLabel,
                energy: String(energyLevel),
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.body}>{t('sentirToday.checkedInBody')}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onQuickRecheck}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('sentirToday.quickRecheckA11y')}
        >
          <RefreshCw size={18} color={THEME.colors.gradient.blue} />
          <Text style={styles.primaryBtnText}>{t('sentirToday.quickRecheck')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onFullCheckIn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('sentirToday.fullCheckInA11y')}
        >
          <Text style={styles.secondaryBtnText}>{t('sentirToday.fullCheckIn')}</Text>
          <ChevronRight size={18} color={THEME.colors.text.secondary} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  gradient: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  summary: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  body: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  primaryBtnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 40,
  },
  secondaryBtnText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
});
