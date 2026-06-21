import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { useI18n } from '@/contexts/I18nContext';

type MoodCardProps = {
  todayMood: string;
  energyLevel: number;
  availableTime?: string | null;
  focusLevel?: string | null;
  onRefresh: () => void;
};

function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    agotada: '😴',
    tranquila: '😌',
    ansiosa: '😰',
    motivada: '💪',
    abrumada: '😵',
    enfocada: '🌿',
  };
  return map[mood.toLowerCase()] ?? '💭';
}

export function MoodCard({ todayMood, energyLevel, availableTime, focusLevel, onRefresh }: MoodCardProps) {
  const { t } = useI18n();
  const moodLabel = useMemo(
    () => todayMood.charAt(0).toUpperCase() + todayMood.slice(1),
    [todayMood],
  );
  const moodEmoji = useMemo(() => getMoodEmoji(todayMood), [todayMood]);

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={t('moodCard.a11ySummary', { mood: moodLabel, energy: energyLevel })}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel={t('moodCard.a11yRefresh')}
          accessibilityHint={t('moodCard.a11yRefreshHint')}
        >
          <RefreshCw size={18} color={THEME.colors.gradient.blue} />
        </TouchableOpacity>
        <View style={styles.moodMain}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <Text style={styles.moodLabel}>{t('moodCard.label')}</Text>
          <Text style={styles.moodValue}>{moodLabel}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.moodStatLabel}>{t('moodCard.energy')}</Text>
          <Text style={styles.moodStatValue}>{energyLevel}/5</Text>
        </View>
        {availableTime ? (
          <View style={styles.stat}>
            <Text style={styles.moodStatLabel}>{t('moodCard.time')}</Text>
            <Text style={styles.moodStatValue}>{availableTime}</Text>
          </View>
        ) : null}
        {focusLevel ? (
          <View style={styles.stat}>
            <Text style={styles.moodStatLabel}>{t('moodCard.focus')}</Text>
            <Text style={styles.moodStatValue}>{focusLevel}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.updateButton}
        onPress={() => router.push(CHECK_IN_ROUTE)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('moodCard.a11yUpdate')}
        accessibilityHint={t('moodCard.a11yUpdateHint')}
      >
        <Text style={styles.updateButtonText}>{t('moodCard.updateCta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  refreshButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  moodMain: {
    flex: 1,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: THEME.spacing.xs,
  },
  moodLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  moodValue: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  stat: {
    alignItems: 'center',
  },
  moodStatLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  moodStatValue: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  updateButton: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  updateButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
