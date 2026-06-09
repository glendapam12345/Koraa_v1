import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { EmotionCard } from '@/components/EmotionCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { saveDailyCheckInAndPrioritize } from '@/lib/checkInService';
import { publishCheckInCelebration } from '@/lib/checkInCelebration';
import { scheduleRecheckReminder } from '@/hooks/useNotifications';

const EMOTION_IDS = ['agotada', 'tranquila', 'ansiosa', 'motivada', 'abrumada', 'enfocada'] as const;
const EMOTION_EMOJIS: Record<(typeof EMOTION_IDS)[number], string> = {
  agotada: '😔',
  tranquila: '😌',
  ansiosa: '😰',
  motivada: '✨',
  abrumada: '🥺',
  enfocada: '🌿',
};

const TIME_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: 'Poco (1-2hrs)', labelKey: 'onboarding.time.little' },
  { id: 'Medio (2-4hrs)', labelKey: 'onboarding.time.medium' },
  { id: 'Bastante (4-6hrs)', labelKey: 'onboarding.time.plenty' },
  { id: 'Todo el día', labelKey: 'onboarding.time.allDay' },
];

const FOCUS_OPTIONS: { id: string; labelKey: TranslationKey }[] = [
  { id: 'Muy distraída', labelKey: 'onboarding.focus.scattered' },
  { id: 'Algo distraída', labelKey: 'onboarding.focus.somewhat' },
  { id: 'Normal', labelKey: 'onboarding.focus.normal' },
  { id: 'Enfocada', labelKey: 'onboarding.focus.focused' },
  { id: 'Súper enfocada', labelKey: 'onboarding.focus.veryFocused' },
];

type QuickRecheckInModalProps = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialEmotion?: string;
  initialEnergy?: number;
  initialTime?: string;
  initialFocus?: string;
};

export function QuickRecheckInModal({
  visible,
  onClose,
  onComplete,
  initialEmotion = '',
  initialEnergy = 0,
  initialTime = '',
  initialFocus = '',
}: QuickRecheckInModalProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [emotion, setEmotion] = useState(initialEmotion);
  const [energy, setEnergy] = useState(initialEnergy);
  const [time, setTime] = useState('');
  const [focus, setFocus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setEmotion(initialEmotion);
    setEnergy(initialEnergy);
    setTime(initialTime);
    setFocus(initialFocus);
    setError(null);
  }, [visible, initialEmotion, initialEnergy, initialTime, initialFocus]);

  const canSubmit = Boolean(emotion && energy >= 1 && energy <= 5 && time && focus && user);

  const stepHint = useMemo(() => t('quickRecheck.stepHint'), [t]);

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveDailyCheckInAndPrioritize({
        userId: user.id,
        emotion,
        energyLevel: energy,
        availableTime: time,
        focusLevel: focus,
        locale,
      });

      if (!result.success) {
        setError(t('quickRecheck.error'));
        return;
      }

      try {
        await scheduleRecheckReminder(locale);
      } catch {
        /* non-critical */
      }

      onComplete();
      onClose();

      setTimeout(() => {
        publishCheckInCelebration(result.celebration ?? { streak: 0, milestone: false });
      }, 400);
    } catch {
      setError(t('quickRecheck.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay} accessibilityRole="none">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.fullBadge}>{t('quickRecheck.fullCheckInBadge')}</Text>
              <Text style={styles.title}>{t('quickRecheck.title')}</Text>
              <Text style={styles.subtitle}>{t('quickRecheck.subtitle')}</Text>
              <Text style={styles.hint}>{stepHint}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('commonExtra.close')}
            >
              <X size={22} color={THEME.colors.text.main} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>{t('quickRecheck.emotionLabel')}</Text>
            <View style={styles.emotionsGrid}>
              {EMOTION_IDS.map((id) => (
                <View key={id} style={styles.emotionWrap}>
                  <EmotionCard
                    emoji={EMOTION_EMOJIS[id]}
                    label={t(`sentir.emotions.${id}`)}
                    selected={emotion === id}
                    onPress={() => setEmotion(id)}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t('quickRecheck.energyLabel')}</Text>
            <View style={styles.energyRow} accessibilityRole="radiogroup">
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.energyChip, energy === level && styles.energyChipSelected]}
                  onPress={() => setEnergy(level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: energy === level }}
                  accessibilityLabel={t('onboardingA11y.selectEnergy', {
                    label: String(level),
                  })}
                >
                  <Text
                    style={[styles.energyChipText, energy === level && styles.energyChipTextSelected]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t('quickRecheck.timeLabel')}</Text>
            <View style={styles.optionStack}>
              {TIME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, time === opt.id && styles.optionRowSelected]}
                  onPress={() => setTime(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: time === opt.id }}
                >
                  <Text style={[styles.optionText, time === opt.id && styles.optionTextSelected]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>{t('quickRecheck.focusLabel')}</Text>
            <View style={styles.optionStack}>
              {FOCUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, focus === opt.id && styles.optionRowSelected]}
                  onPress={() => setFocus(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: focus === opt.id }}
                >
                  <Text style={[styles.optionText, focus === opt.id && styles.optionTextSelected]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <CalmPrimaryButton
              label={t('quickRecheck.submit')}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit || saving}
              loading={saving}
              large
              accessibilityHint={stepHint}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '92%',
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.stroke[100],
  },
  headerText: { flex: 1, gap: 4 },
  fullBadge: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    paddingVertical: 4,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    marginBottom: 4,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  hint: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  closeBtn: {
    padding: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
  scroll: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: THEME.spacing.xs,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  emotionWrap: {
    width: '50%',
    paddingBottom: THEME.spacing.xs,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  energyChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
  energyChipSelected: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  energyChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
  },
  energyChipTextSelected: {
    color: THEME.colors.gradient.blue,
  },
  optionStack: { gap: THEME.spacing.xs },
  optionRow: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    paddingHorizontal: THEME.spacing.md,
    justifyContent: 'center',
  },
  optionRowSelected: {
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  errorText: {
    ...THEME.typography.meta,
    color: THEME.colors.semantic.danger,
    marginTop: THEME.spacing.xs,
  },
  footer: {
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.stroke[100],
  },
});
