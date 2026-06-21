import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { ReorganizeProposalList } from '@/components/tasks/experience/ReorganizeProposalList';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';
import { VISION_PASTELS } from '@/lib/lifeAreas/visionPalette';

type ReorganizeSuccessPanelProps = {
  result: ReorganizeWeekProposal;
  onViewWeek: () => void;
  actionLabel?: string;
};

export function ReorganizeSuccessPanel({ result, onViewWeek, actionLabel }: ReorganizeSuccessPanelProps) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={[VISION_PASTELS.mint, THEME.colors.calm.background]}
      style={styles.shell}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Sparkles size={24} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <Text style={styles.title}>{result.headline}</Text>
        <Text style={styles.sub}>{result.subline}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <ReorganizeProposalList moved={result.moved} kept={result.kept} />

        {result.freedHoursLabel ? (
          <View style={styles.freedBanner}>
            <Heart size={16} color={THEME.colors.gradient.pink} fill={THEME.colors.gradient.pink} />
            <Text style={styles.freedText}>
              {t('tasksExperience.vision.freedHours', { hours: result.freedHoursLabel })}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity
        onPress={onViewWeek}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={actionLabel ?? t('tasksExperience.vision.viewWeek')}
        style={styles.weekBtn}
      >
        <Text style={styles.weekBtnText}>
          {actionLabel ?? t('tasksExperience.vision.viewWeek')}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassHeavy,
    maxHeight: '100%',
    ...THEME.shadows.soft,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
    lineHeight: 28,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 340,
  },
  scrollContent: {
    gap: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  freedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: VISION_PASTELS.pink,
  },
  freedText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 20,
  },
  weekBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    flexShrink: 0,
  },
  weekBtnText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
});
