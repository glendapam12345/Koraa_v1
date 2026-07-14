import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Heart, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { openEmergencyKit } from '@/lib/emergencyKitNavigation';
import type { EmergencyKitSessionState } from '@/lib/emergencyKit/types';

const GUIDE_STEP_KEYS = [
  'hoy.careModeGuideStep1',
  'hoy.careModeGuideStep2',
  'hoy.careModeGuideStep3',
] as const;

type CareModeGuideSheetProps = {
  visible: boolean;
  onClose: () => void;
  lastSession: EmergencyKitSessionState | null;
};

export function CareModeGuideSheet({ visible, onClose, lastSession }: CareModeGuideSheetProps) {
  const { t } = useI18n();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();

  const handleOpenKit = () => {
    if (subscriptionLoading) return;
    openEmergencyKit(isSubscribed, lastSession, router);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Heart size={20} color={THEME.colors.calm.lavenderDeep} fill={THEME.colors.calm.lavender} />
              <Text style={styles.title}>{t('hoy.careModeGuideTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('commonExtra.close')}
              style={styles.closeButton}
            >
              <X size={22} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lead}>{t('hoy.careModeGuideLead')}</Text>

            <View style={styles.steps}>
              {GUIDE_STEP_KEYS.map((key) => (
                <Text key={key} style={styles.step}>
                  {t(key)}
                </Text>
              ))}
            </View>

            <CalmPrimaryButton
              label={lastSession ? t('hoy.crisisBannerCta') : t('hoy.crisisOpenKitCta')}
              onPress={handleOpenKit}
              disabled={subscriptionLoading}
              variant="soft"
              accessibilityHint={t('hoy.crisisBannerCtaHint')}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlayStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.calm.card,
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '78%',
    paddingBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flex: 1,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  closeButton: {
    padding: THEME.spacing.xs,
    marginLeft: THEME.spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  lead: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  steps: {
    gap: 8,
  },
  step: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
});
