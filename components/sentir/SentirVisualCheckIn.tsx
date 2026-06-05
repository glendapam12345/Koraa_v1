import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { VisualStepSlider } from '@/components/sentir/VisualStepSlider';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { saveDailyCheckInAndPrioritize } from '@/lib/checkInService';
import {
  DEFAULT_CHECK_IN_FOCUS,
  DEFAULT_CHECK_IN_TIME,
} from '@/lib/checkInDefaults';
import { publishCheckInCelebration } from '@/lib/checkInCelebration';
import { markPrioritiesReadyToast } from '@/lib/prioritiesReadyToast';
import { scheduleRecheckReminder } from '@/hooks/useNotifications';
import { track } from '@/lib/analytics';

export type SentirEmotionOption = {
  id: string;
  emoji: string;
  label: string;
};

type SentirVisualCheckInProps = {
  emotions: SentirEmotionOption[];
  onSaved: () => void;
  /** Notifica si hay borrador sin guardar (emoción o energía distinta al default). */
  onDraftChange?: (hasDraft: boolean) => void;
  /** En Hoy (Inicio): sin navegar atrás al guardar. */
  embedded?: boolean;
  /** En Hoy: oculta enlace a tiempo/enfoque (opcional aparte). */
  hideAdvancedLink?: boolean;
  /** Muestra etiqueta «check-in rápido» (emoción + energía). */
  showQuickBadge?: boolean;
  /** Clave i18n para el CTA al guardar (solo en modo embedded). */
  saveLabelKey?: string;
  onEmotionChange?: (emotionId: string) => void;
};

export function SentirVisualCheckIn({
  emotions,
  onSaved,
  onDraftChange,
  embedded = false,
  hideAdvancedLink = false,
  showQuickBadge = false,
  saveLabelKey,
  onEmotionChange,
}: SentirVisualCheckInProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [emotion, setEmotion] = useState('');
  const [energy, setEnergy] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const emotionGridCols = 3;
  const gridGap = THEME.spacing.sm;
  const gridContentWidth = windowWidth - THEME.layout.screenPaddingX * 2;
  const emotionCellWidth =
    (gridContentWidth - gridGap * (emotionGridCols - 1)) / emotionGridCols;

  const canSubmit = Boolean(emotion && energy >= 1 && energy <= 5 && user);
  const embeddedSaveLabel = saveLabelKey
    ? t(saveLabelKey as never)
    : t('hoy.inicio.saveCheckIn');

  useEffect(() => {
    onDraftChange?.(Boolean(emotion) || energy !== 3);
  }, [emotion, energy, onDraftChange]);

  const handleAdvanced = () => {
    if (!emotion || energy < 1) return;
    router.push({
      pathname: '/onboarding/time',
      params: { emotion, energy: String(energy), from: 'sentir' },
    });
  };

  const handleSave = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveDailyCheckInAndPrioritize({
        userId: user.id,
        emotion,
        energyLevel: energy,
        availableTime: DEFAULT_CHECK_IN_TIME,
        focusLevel: DEFAULT_CHECK_IN_FOCUS,
        locale,
      });

      if (!result.success) {
        setError(t('sentir.visualCheckIn.error'));
        return;
      }

      try {
        await scheduleRecheckReminder(locale);
      } catch {
        /* non-critical */
      }

      await markPrioritiesReadyToast();
      void track('check_in_completed', { source: 'sentir_visual', offline: Boolean(result.offline) });

      onSaved();
      if (!embedded) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }

      setTimeout(() => {
        if (result.celebration) {
          publishCheckInCelebration(result.celebration);
        }
      }, 450);
    } catch {
      setError(t('sentir.visualCheckIn.error'));
    } finally {
      setSaving(false);
    }
  };

  const selectEmotion = (id: string) => {
    setEmotion(id);
    onEmotionChange?.(id);
  };

  return (
    <View style={[styles.root, embedded && styles.rootEmbedded]}>
      {showQuickBadge ? (
        <View style={styles.badgeRow}>
          <Text style={styles.quickBadge}>{t('sentir.visualCheckIn.quickBadge')}</Text>
          <Text style={styles.quickBadgeSub}>{t('sentir.visualCheckIn.quickSubtitle')}</Text>
        </View>
      ) : null}

      {!embedded ? (
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{t('sentir.visualCheckIn.bubble')}</Text>
          </View>
          <Text style={styles.heroNote}>{t('sentir.inclusiveNote')}</Text>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroEmbedded}
        >
          <Text style={styles.heroEmbeddedBubble}>{t('sentir.visualCheckIn.bubble')}</Text>
          <Text style={styles.heroEmbeddedNote}>{t('sentir.visualCheckIn.gridSubtitle')}</Text>
        </LinearGradient>
      )}

      {embedded ? (
        <View
          style={[styles.emotionsGrid, { gap: gridGap }]}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('sentirExtra.emotionGroupA11y')}
        >
          {emotions.map((item) => {
            const selected = emotion === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.emotionGridCell,
                  { width: emotionCellWidth, minHeight: emotionCellWidth * 0.92 },
                  selected && styles.emotionGridCellSelected,
                ]}
                onPress={() => selectEmotion(item.id)}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <Text style={styles.emotionGridEmoji}>{item.emoji}</Text>
                <Text
                  style={[styles.emotionGridLabel, selected && styles.emotionGridLabelSelected]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emotionsRow}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('sentirExtra.emotionGroupA11y')}
        >
          {emotions.map((item) => {
            const selected = emotion === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.emotionChip, selected && styles.emotionChipSelected]}
                onPress={() => selectEmotion(item.id)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <Text style={styles.emotionEmoji}>{item.emoji}</Text>
                <Text style={[styles.emotionLabel, selected && styles.emotionLabelSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <VisualStepSlider
        value={energy}
        onChange={setEnergy}
        label={t('sentir.visualCheckIn.energyLabel')}
        size={embedded ? 'large' : 'default'}
      />

      {!hideAdvancedLink ? (
        <TouchableOpacity
          onPress={handleAdvanced}
          disabled={!emotion}
          style={styles.advancedLink}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('sentir.visualCheckIn.adjustTimeFocus')}
          accessibilityHint={t('sentir.visualCheckIn.adjustHint')}
          accessibilityState={{ disabled: !emotion }}
        >
          <Text style={[styles.advancedText, !emotion && styles.advancedTextDisabled]}>
            {t('sentir.visualCheckIn.adjustTimeFocus')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.ctaWrap}>
        {saving ? (
          <ActivityIndicator color={THEME.colors.gradient.blue} style={styles.spinner} />
        ) : (
          <CalmPrimaryButton
            label={
              embedded ? embeddedSaveLabel : t('sentir.visualCheckIn.continue')
            }
            large={embedded}
            onPress={() => void handleSave()}
            disabled={!canSubmit}
            accessibilityLabel={
              embedded ? embeddedSaveLabel : t('sentir.visualCheckIn.continue')
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: THEME.spacing.lg,
  },
  rootEmbedded: {
    marginBottom: 0,
  },
  badgeRow: {
    gap: 4,
    marginBottom: THEME.spacing.sm,
    alignItems: 'center',
  },
  quickBadge: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    alignSelf: 'center',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    paddingVertical: 4,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  quickBadgeSub: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    lineHeight: 18,
    textAlign: 'center',
  },
  heroEmbedded: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    minHeight: 112,
    justifyContent: 'center',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  heroEmbeddedBubble: {
    ...THEME.typography.h2,
    fontSize: 26,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  heroEmbeddedNote: {
    ...THEME.typography.body,
    fontSize: 15,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: THEME.spacing.xs,
  },
  emotionGridCell: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  emotionGridCellSelected: {
    borderColor: THEME.colors.gradient.blue,
    borderWidth: 2,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  emotionGridEmoji: {
    fontSize: 44,
    marginBottom: THEME.spacing.xs,
  },
  emotionGridLabel: {
    ...THEME.typography.caption,
    fontSize: 13,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  emotionGridLabelSelected: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  hero: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    minHeight: 120,
    justifyContent: 'center',
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    maxWidth: '100%',
  },
  bubbleText: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  heroNote: {
    ...THEME.typography.small,
    color: THEME.colors.onGradientMuted,
    lineHeight: 20,
  },
  emotionsRow: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
  },
  emotionChip: {
    width: 108,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  emotionChipSelected: {
    borderColor: THEME.colors.gradient.blue,
    borderWidth: 2,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  emotionEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  emotionLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  emotionLabelSelected: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  advancedLink: {
    alignSelf: 'center',
    marginTop: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  advancedText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    textDecorationLine: 'underline',
  },
  advancedTextDisabled: {
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'none',
  },
  errorText: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.danger,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  ctaWrap: {
    marginTop: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.xs,
  },
  spinner: {
    marginVertical: THEME.spacing.md,
  },
});
