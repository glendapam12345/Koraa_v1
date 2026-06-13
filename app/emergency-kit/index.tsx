import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmScreen } from '@/components/ui/calm/CalmScreen';
import { EmergencyKitBackHeader } from '@/components/emergencyKit/EmergencyKitBackHeader';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { EmergencyKitEventCard } from '@/components/emergencyKit/EmergencyKitEventCard';
import { EMERGENCY_KIT_EVENTS } from '@/lib/emergencyKit/events';
import { loadLastSession } from '@/lib/emergencyKit/storage';
import type { EmergencyKitEventId, EmergencyKitSessionState } from '@/lib/emergencyKit/types';

export default function EmergencyKitCheckInScreen() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<EmergencyKitEventId | null>(null);
  const [customText, setCustomText] = useState('');
  const [lastSession, setLastSession] = useState<EmergencyKitSessionState | null>(null);

  useEffect(() => {
    void loadLastSession().then(setLastSession);
  }, []);

  const canContinue = selected !== null && (selected !== 'other' || customText.trim().length > 0);

  const handleContinue = () => {
    if (!selected) return;
    router.push({
      pathname: '/emergency-kit/session',
      params: {
        eventId: selected,
        customText: selected === 'other' ? customText.trim() : customText.trim() || '',
      },
    });
  };

  const handleResume = () => {
    if (!lastSession) return;
    router.push({
      pathname: '/emergency-kit/session',
      params: {
        eventId: lastSession.eventId,
        customText: lastSession.customText ?? '',
      },
    });
  };

  return (
    <CalmScreen topInset="lg" gap={THEME.layout.sectionGapCompact}>
      <EmergencyKitBackHeader
        title={t('emergencyKit.checkInTitle')}
        subtitle={t('emergencyKit.checkInSubtitle')}
      />

      {lastSession ? (
        <TouchableOpacity
          style={styles.resumeCard}
          onPress={handleResume}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('emergencyKit.resumeSessionA11y', {
            event: t(`emergencyKit.events.${lastSession.eventId}`),
          })}
        >
          <Text style={styles.resumeLabel}>{t('emergencyKit.resumeSession', {
            event: t(`emergencyKit.events.${lastSession.eventId}`),
          })}</Text>
          <Text style={styles.resumeHint}>{t('emergencyKit.resumeSessionHint')}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.grid}>
        {EMERGENCY_KIT_EVENTS.map((event) => (
          <EmergencyKitEventCard
            key={event.id}
            emoji={event.emoji}
            label={t(`emergencyKit.events.${event.id}`)}
            selected={selected === event.id}
            onPress={() => setSelected(event.id)}
          />
        ))}
      </View>

      {selected === 'other' ? (
        <View style={styles.otherBox}>
          <Text style={styles.otherLabel}>{t('emergencyKit.otherLabel')}</Text>
          <TextInput
            style={styles.otherInput}
            placeholder={t('emergencyKit.otherPlaceholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            value={customText}
            onChangeText={setCustomText}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.otherHint}>{t('emergencyKit.otherExamples')}</Text>
        </View>
      ) : selected ? (
        <View style={styles.optionalBox}>
          <Text style={styles.otherLabel}>{t('emergencyKit.optionalDetail')}</Text>
          <TextInput
            style={styles.otherInputShort}
            placeholder={t('emergencyKit.optionalPlaceholder')}
            placeholderTextColor={THEME.colors.text.tertiary}
            value={customText}
            onChangeText={setCustomText}
          />
        </View>
      ) : null}

      <CalmPrimaryButton
        label={t('emergencyKit.continueCta')}
        onPress={handleContinue}
        disabled={!canContinue}
        large
        accessibilityHint={t('emergencyKit.continueHint')}
      />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  resumeCard: {
    ...THEME.surfaces.muted,
    padding: THEME.spacing.sm,
    gap: 4,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  resumeLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  resumeHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    justifyContent: 'space-between',
  },
  otherBox: {
    gap: THEME.spacing.xs,
  },
  optionalBox: {
    gap: THEME.spacing.xs,
  },
  otherLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  otherInput: {
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: THEME.surfaces.muted.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: 100,
    color: THEME.colors.text.main,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  otherInputShort: {
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: THEME.surfaces.muted.backgroundColor,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    color: THEME.colors.text.main,
    ...(Platform.OS === 'android' ? { fontFamily: THEME.fonts.heading.medium } : {}),
  },
  otherHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
});
