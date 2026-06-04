import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Calendar } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { StepBadge } from '@/components/ui/StepBadge';
import {
  SentirVisualCheckIn,
  type SentirEmotionOption,
} from '@/components/sentir/SentirVisualCheckIn';
import { getEmotionTips } from '@/lib/emotionTips';

type HoyInicioViewProps = {
  emotions: SentirEmotionOption[];
  onCheckInSaved: () => void;
  taskCount: number;
  onOpenCalendar: () => void;
  onMentalUnload: () => void;
  onScrollToCheckIn?: () => void;
  selectedEmotionPreview: string;
  onEmotionPreviewChange: (emotionId: string) => void;
};

export function HoyInicioView({
  emotions,
  onCheckInSaved,
  taskCount,
  onOpenCalendar,
  onMentalUnload,
  onScrollToCheckIn,
  selectedEmotionPreview,
  onEmotionPreviewChange,
}: HoyInicioViewProps) {
  const { t, locale } = useI18n();

  const emotionLabel = selectedEmotionPreview
    ? emotions.find((e) => e.id === selectedEmotionPreview)?.label ?? ''
    : '';

  const contextTip = selectedEmotionPreview
    ? getEmotionTips(selectedEmotionPreview, locale)[0]?.tip
    : t('hoy.inicio.contextDefault');

  const contextLine = selectedEmotionPreview
    ? t('hoy.inicio.contextForEmotion', { emotion: emotionLabel })
    : null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEyebrow}>{t('hoy.inicio.eyebrow')}</Text>
        <Text style={styles.heroStatus}>{t('hoy.inicio.statusNoCheckIn')}</Text>
        <TouchableOpacity
          style={styles.heroPill}
          onPress={onScrollToCheckIn}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.inicio.primaryCta')}
        >
          <Text style={styles.heroPillText}>{t('hoy.inicio.primaryCta')}</Text>
        </TouchableOpacity>
        <Text style={styles.heroMeta}>
          {taskCount > 0
            ? t('hoy.inicio.metaWithTasks', { count: taskCount })
            : t('hoy.inicio.metaNoTasks')}
        </Text>
      </LinearGradient>

      <View style={styles.checkInBlock}>
        <StepBadge step={1} label={t('hoy.inicio.stepFeel')} />
        <Text style={styles.sectionSub}>{t('hoy.inicio.feelSectionSub')}</Text>
        {contextLine ? (
          <Text style={styles.contextLine}>{contextLine}</Text>
        ) : null}
        <Text style={styles.contextBody}>{contextTip}</Text>
        <SentirVisualCheckIn
          emotions={emotions}
          embedded
          hideAdvancedLink
          onEmotionChange={onEmotionPreviewChange}
          onSaved={onCheckInSaved}
        />
        <Text style={styles.timeFocusHint}>{t('hoy.inicio.timeFocusHint')}</Text>
      </View>

      <LinearGradient
        colors={[THEME.colors.chartPalette[10], THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.unloadCard}
      >
        <StepBadge step={2} label={t('hoy.inicio.stepUnload')} />
        <Brain size={24} color={THEME.colors.onGradient} style={styles.unloadIcon} />
        <Text style={styles.unloadTitle}>{t('hoy.inicio.mentalUnloadTitle')}</Text>
        <Text style={styles.unloadBody}>{t('hoy.inicio.mentalUnloadBody')}</Text>
        <TouchableOpacity
          style={styles.unloadBtn}
          onPress={onMentalUnload}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.inicio.mentalUnloadCta')}
        >
          <Text style={styles.unloadBtnText}>{t('hoy.inicio.mentalUnloadCta')}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.calendarBlock}>
        <StepBadge step={3} label={t('hoy.inicio.stepCalendar')} active={false} />
        <Text style={styles.calendarHint}>{t('hoy.inicio.calendarHint')}</Text>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={onOpenCalendar}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.inicio.calendarCta')}
        >
          <Calendar size={18} color={THEME.colors.gradient.blue} />
          <Text style={styles.calendarBtnText}>{t('hoy.inicio.calendarCta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: THEME.spacing.md,
  },
  hero: {
    marginHorizontal: -THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: THEME.borderRadius.rounded,
    borderBottomRightRadius: THEME.borderRadius.rounded,
  },
  heroEyebrow: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    marginBottom: THEME.spacing.xs,
  },
  heroStatus: {
    ...THEME.typography.h2,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  heroPill: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    minHeight: THEME.sizes.touchTarget,
    marginBottom: THEME.spacing.sm,
  },
  heroPillText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  heroMeta: {
    ...THEME.typography.small,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
  },
  checkInBlock: {
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    ...THEME.shadows.soft,
  },
  sectionSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  contextLine: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 4,
  },
  contextBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginBottom: THEME.spacing.sm,
  },
  timeFocusHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  unloadCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  unloadIcon: {
    alignSelf: 'center',
    marginBottom: THEME.spacing.xs,
  },
  unloadTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  unloadBody: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    lineHeight: 22,
  },
  unloadBtn: {
    alignSelf: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  unloadBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  calendarBlock: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  calendarHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  calendarBtnText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
