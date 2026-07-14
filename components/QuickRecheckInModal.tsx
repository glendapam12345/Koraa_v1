import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { FeelingEnergyScale } from '@/components/checkin/FeelingEnergyScale';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import { saveDailyCheckInAndPrioritize } from '@/lib/checkInService';
import { getDisplayName } from '@/lib/displayName';
import { publishCheckInCelebration } from '@/lib/checkInCelebration';
import { DEFAULT_CHECK_IN_FOCUS, DEFAULT_CHECK_IN_TIME } from '@/lib/checkInDefaults';
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

/** Mapa suave energía → emoción por defecto si aún no eligió. */
const ENERGY_DEFAULT_EMOTION: Record<number, (typeof EMOTION_IDS)[number]> = {
  1: 'agotada',
  2: 'agotada',
  3: 'tranquila',
  4: 'motivada',
  5: 'enfocada',
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
  onComplete: (snapshot: { energyLevel: number; firstCheckIn: boolean }) => void;
  firstCheckIn?: boolean;
  initialEmotion?: string;
  initialEnergy?: number;
  initialTime?: string;
  initialFocus?: string;
};

/**
 * Check-in calm (mock): pregunta → escala 1–5 → emoción suave → Continuar.
 * Tiempo/enfoque viven en progressive disclosure.
 */
export function QuickRecheckInModal({
  visible,
  onClose,
  onComplete,
  firstCheckIn = false,
  initialEmotion = '',
  initialEnergy = 3,
  initialTime = '',
  initialFocus = '',
}: QuickRecheckInModalProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [emotion, setEmotion] = useState(initialEmotion);
  const [energy, setEnergy] = useState(initialEnergy);
  const [time, setTime] = useState(initialTime || DEFAULT_CHECK_IN_TIME);
  const [focus, setFocus] = useState(initialFocus || DEFAULT_CHECK_IN_FOCUS);
  const [note, setNote] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setEmotion(initialEmotion);
    setEnergy(initialEnergy || 3);
    setTime(initialTime || DEFAULT_CHECK_IN_TIME);
    setFocus(initialFocus || DEFAULT_CHECK_IN_FOCUS);
    setNote('');
    setAdvancedOpen(false);
    setError(null);
  }, [visible, initialEmotion, initialEnergy, initialTime, initialFocus]);

  const resolvedEmotion = emotion || ENERGY_DEFAULT_EMOTION[energy] || 'tranquila';
  const canSubmit = Boolean(energy >= 1 && energy <= 5 && time && focus && user);

  const handleEnergyChange = (level: number) => {
    setEnergy(level);
    if (!emotion) {
      setEmotion(ENERGY_DEFAULT_EMOTION[level] ?? 'tranquila');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);
    setError(null);
    try {
      const emotionLabel = t(`sentir.emotions.${resolvedEmotion}` as TranslationKey);
      const result = await saveDailyCheckInAndPrioritize({
        userId: user.id,
        emotion: resolvedEmotion,
        energyLevel: energy,
        availableTime: time || DEFAULT_CHECK_IN_TIME,
        focusLevel: focus || DEFAULT_CHECK_IN_FOCUS,
        locale,
        displayName: getDisplayName(user, ''),
        emotionLabel,
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

      onComplete({ energyLevel: energy, firstCheckIn });
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {firstCheckIn ? t('quickRecheck.mockTitle') : t('quickRecheck.mockTitleUpdate')}
              </Text>
              <Text style={styles.subtitle}>
                {firstCheckIn ? t('quickRecheck.mockSubtitle') : t('quickRecheck.mockSubtitleUpdate')}
              </Text>
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

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FeelingEnergyScale value={energy} onChange={handleEnergyChange} />

            <Text style={styles.sectionLabel}>{t('quickRecheck.emotionLabel')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emotionRow}
            >
              {EMOTION_IDS.map((id) => {
                const selected = resolvedEmotion === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.emotionChip, selected && styles.emotionChipSelected]}
                    onPress={() => setEmotion(id)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`sentir.emotions.${id}`)}
                  >
                    <Text style={styles.emotionEmoji}>{EMOTION_EMOJIS[id]}</Text>
                    <Text
                      style={[styles.emotionChipText, selected && styles.emotionChipTextSelected]}
                      numberOfLines={1}
                    >
                      {t(`sentir.emotions.${id}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>{t('quickRecheck.noteLabel')}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={t('quickRecheck.notePlaceholder')}
              placeholderTextColor={THEME.colors.text.tertiary}
              multiline
              maxLength={280}
              accessibilityLabel={t('quickRecheck.noteLabel')}
            />
            <Text style={styles.noteHint}>{t('quickRecheck.noteHint')}</Text>

            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setAdvancedOpen((open) => !open)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ expanded: advancedOpen }}
              accessibilityLabel={t('quickRecheck.advancedToggle')}
            >
              <Text style={styles.advancedToggleText}>{t('quickRecheck.advancedToggle')}</Text>
              {advancedOpen ? (
                <ChevronUp size={18} color={THEME.colors.text.tertiary} />
              ) : (
                <ChevronDown size={18} color={THEME.colors.text.tertiary} />
              )}
            </TouchableOpacity>

            {advancedOpen ? (
              <View style={styles.advancedPanel}>
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
                      <Text
                        style={[styles.optionText, time === opt.id && styles.optionTextSelected]}
                      >
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
                      <Text
                        style={[styles.optionText, focus === opt.id && styles.optionTextSelected]}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <CalmPrimaryButton
              label={
                saving
                  ? t('quickRecheck.saving')
                  : firstCheckIn
                    ? t('quickRecheck.continue')
                    : t('quickRecheck.continueUpdate')
              }
              onPress={() => void handleSubmit()}
              disabled={!canSubmit || saving}
              loading={saving}
              large
              accessibilityHint={t('quickRecheck.submitHint')}
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
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderTopWidth: 1,
    borderColor: THEME.colors.calm.border,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  closeBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  emotionRow: {
    gap: THEME.spacing.xs,
    paddingVertical: 2,
  },
  emotionChip: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
    minWidth: 76,
  },
  emotionChipSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.mist,
  },
  emotionEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  emotionChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
  emotionChipTextSelected: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  noteInput: {
    ...THEME.typography.body,
    minHeight: 72,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    color: THEME.colors.text.main,
    textAlignVertical: 'top',
  },
  noteHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    marginTop: -8,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: THEME.sizes.touchTarget,
  },
  advancedToggleText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  advancedPanel: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  optionStack: { gap: THEME.spacing.xs },
  optionRow: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingHorizontal: THEME.spacing.md,
    justifyContent: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
  optionRowSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
  },
  errorText: {
    ...THEME.typography.caption,
    color: THEME.colors.semantic.danger,
  },
  footer: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.calm.border,
  },
});
