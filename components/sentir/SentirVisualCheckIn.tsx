import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
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
};

export function SentirVisualCheckIn({ emotions, onSaved }: SentirVisualCheckInProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [emotion, setEmotion] = useState('');
  const [energy, setEnergy] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(emotion && energy >= 1 && energy <= 5 && user);

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
      router.replace('/(tabs)');

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

  return (
    <View style={styles.root}>
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
              onPress={() => setEmotion(item.id)}
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

      <VisualStepSlider
        value={energy}
        onChange={setEnergy}
        label={t('sentir.visualCheckIn.energyLabel')}
      />

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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.ctaWrap}>
        {saving ? (
          <ActivityIndicator color={THEME.colors.gradient.blue} style={styles.spinner} />
        ) : (
          <GradientButton
            title={t('sentir.visualCheckIn.continue')}
            onPress={() => void handleSave()}
            disabled={!canSubmit}
            accessibilityLabel={t('sentir.visualCheckIn.continue')}
            accessibilityHint={t('sentirExtra.continueA11yHint')}
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
  },
  spinner: {
    marginVertical: THEME.spacing.md,
  },
});
