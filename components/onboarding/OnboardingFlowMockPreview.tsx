import { View, Text, StyleSheet } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export type OnboardingFlowMockVariant = 'capture' | 'feel' | 'hoy';

type OnboardingFlowMockPreviewProps = {
  variant: OnboardingFlowMockVariant;
};

/**
 * Mini preview del flujo Koraa — solo visual, para el tour con Ellie.
 */
export function OnboardingFlowMockPreview({ variant }: OnboardingFlowMockPreviewProps) {
  const { t } = useI18n();

  if (variant === 'capture') {
    return (
      <View style={[styles.card, THEME.shadows.soft]}>
        <Text style={styles.mockLabel}>{t('onboarding.tour.mockCaptureLabel')}</Text>
        <View style={styles.mockInput}>
          {(['line1', 'line2', 'line3'] as const).map((key) => (
            <View key={key} style={styles.mockBulletRow}>
              <Text style={styles.mockBullet}>·</Text>
              <Text style={styles.mockLine}>{t(`onboarding.tour.mockCapture.${key}`)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'feel') {
    const emotions = [
      { key: 'calm', emoji: '😌', active: true },
      { key: 'tired', emoji: '😔', active: false },
      { key: 'focus', emoji: '🌿', active: false },
    ] as const;

    return (
      <View style={[styles.card, THEME.shadows.soft]}>
        <Text style={styles.mockLabel}>{t('onboarding.tour.mockFeelLabel')}</Text>
        <View style={styles.emotionRow}>
          {emotions.map((item) => (
            <View
              key={item.key}
              style={[styles.emotionChip, item.active && styles.emotionChipActive]}
            >
              <Text style={styles.emotionEmoji}>{item.emoji}</Text>
              <Text
                style={[styles.emotionText, item.active && styles.emotionTextActive]}
                numberOfLines={1}
              >
                {t(`onboarding.tour.mockFeel.${item.key}`)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.energyRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <View
              key={level}
              style={[styles.energyDot, level <= 3 && styles.energyDotFilled]}
            />
          ))}
          <Text style={styles.energyHint}>{t('onboarding.tour.mockFeelEnergy')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, THEME.shadows.soft]}>
      <Text style={styles.mockLabel}>{t('onboarding.tour.mockHoyLabel')}</Text>
      <View style={styles.taskList}>
        <View style={styles.taskRow}>
          <View style={styles.checkRing} />
          <View style={styles.taskBody}>
            <View style={styles.priorityPill}>
              <Star size={10} color={THEME.colors.calm.lavenderDeep} fill={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.priorityText}>{t('onboarding.tour.mockHoyBadge')}</Text>
            </View>
            <Text style={styles.taskTitle}>{t('onboarding.tour.mockHoy.task1')}</Text>
          </View>
        </View>
        <View style={styles.taskRow}>
          <View style={styles.checkDone}>
            <Check size={12} color={THEME.colors.onGradient} strokeWidth={3} />
          </View>
          <Text style={[styles.taskTitle, styles.taskTitleDone]}>
            {t('onboarding.tour.mockHoy.task2')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  mockLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  mockInput: {
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    gap: 6,
  },
  mockBulletRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  mockBullet: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    lineHeight: 22,
  },
  mockLine: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  emotionChipActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  emotionText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  emotionTextActive: {
    color: THEME.colors.calm.lavenderDeep,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  energyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.calm.border,
  },
  energyDotFilled: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  energyHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginLeft: 4,
    flex: 1,
  },
  taskList: {
    gap: THEME.spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    marginTop: 2,
  },
  checkDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskBody: {
    flex: 1,
    gap: 4,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  priorityText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
  taskTitleDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
});
