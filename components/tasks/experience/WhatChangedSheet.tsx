import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Moon,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';
import { WHAT_CHANGED_OPTIONS } from '@/lib/lifeAreas/visionMockData';
import { VISION_GRADIENT_CTA } from '@/lib/lifeAreas/visionPalette';

const OPTION_META: Record<
  WhatChangedReason,
  { icon: typeof Calendar; bg: string; iconColor: string; iconBg: string }
> = {
  new_event: {
    icon: Calendar,
    bg: THEME.colors.tint.pink.soft,
    iconColor: THEME.colors.gradient.pink,
    iconBg: THEME.colors.semantic.dangerSoft,
  },
  less_time: {
    icon: Clock,
    bg: THEME.colors.tint.blue.soft,
    iconColor: THEME.colors.gradient.blue,
    iconBg: THEME.colors.tint.blue.light,
  },
  tired: {
    icon: Moon,
    bg: THEME.colors.semantic.warnSoft,
    iconColor: THEME.colors.semantic.warn,
    iconBg: THEME.colors.emotionTint.ansiosa,
  },
  priorities_changed: {
    icon: Target,
    bg: THEME.colors.calm.mist,
    iconColor: THEME.colors.calm.lavenderDeep,
    iconBg: THEME.colors.calm.lavender,
  },
  more_energy: {
    icon: Zap,
    bg: THEME.colors.semantic.successSoft,
    iconColor: THEME.colors.category.hogar,
    iconBg: THEME.colors.emotionTint.tranquila,
  },
  week_balance: {
    icon: Sparkles,
    bg: THEME.colors.calm.mist,
    iconColor: THEME.colors.calm.lavenderDeep,
    iconBg: THEME.colors.calm.lavender,
  },
};

type WhatChangedSheetProps = {
  visible: boolean;
  selected?: WhatChangedReason | null;
  onSelect: (reason: WhatChangedReason) => void;
  onReorganize: () => void;
  onClose: () => void;
};

export function WhatChangedSheet({
  visible,
  selected,
  onSelect,
  onReorganize,
  onClose,
}: WhatChangedSheetProps) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('tasksExperience.vision.whatChangedTitle')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('errors.cancel')}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.options} keyboardShouldPersistTaps="handled">
            {WHAT_CHANGED_OPTIONS.map((reason) => {
              const meta = OPTION_META[reason];
              const Icon = meta.icon;
              const isSelected = selected === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.option,
                    { backgroundColor: meta.bg },
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => onSelect(reason)}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: meta.iconBg }]}>
                    <Icon size={20} color={meta.iconColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.optionLabel}>
                    {t(`tasksExperience.vision.whatChanged.${reason}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onReorganize}
            activeOpacity={0.92}
            accessibilityRole="button"
            accessibilityLabel={t('tasksExperience.reorganizeCtaA11y')}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={[...VISION_GRADIENT_CTA]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <Sparkles size={20} color={THEME.colors.onGradient} />
              <Text style={styles.ctaLabel}>{t('tasksExperience.reorganizeCta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlayLight,
    justifyContent: 'center',
    padding: THEME.spacing.md,
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingBottom: THEME.spacing.md,
    maxHeight: '88%',
    ...THEME.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  closeBtn: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    paddingHorizontal: THEME.spacing.md,
    gap: 10,
    paddingBottom: THEME.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  ctaWrap: {
    marginHorizontal: THEME.spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    minHeight: THEME.sizes.touchTarget,
  },
  ctaLabel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
});
