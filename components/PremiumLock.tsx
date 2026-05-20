import { ReactNode, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { PaywallScreen } from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';

type PremiumLockProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  benefits?: string[];
  showBanner?: boolean;
};

export function PremiumLock({
  children,
  title,
  description,
  benefits,
  showBanner = true,
}: PremiumLockProps) {
  const { t } = useI18n();
  const { isLoading, isSubscribed, checkSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const resolvedTitle = title ?? t('premiumLock.title');
  const resolvedDescription = description ?? t('premiumLock.description');
  const resolvedBenefits =
    benefits ??
    [t('premiumLock.benefit1'), t('premiumLock.benefit2'), t('premiumLock.benefit3')];

  if (isLoading) return <>{children}</>;
  if (isSubscribed) return <>{children}</>;

  return (
    <>
      {showBanner && !dismissed ? (
        <View style={styles.banner}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerGlow}
          />
          <View style={styles.bannerTopRow}>
            <View style={styles.iconWrap}>
              <Crown size={18} color={THEME.colors.gradient.blue} />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>{resolvedTitle}</Text>
              <Text style={styles.bannerDescription}>{resolvedDescription}</Text>
            </View>
            <TouchableOpacity onPress={() => setDismissed(true)} activeOpacity={0.7} style={styles.dismissBtn}>
              <X size={18} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.benefitsWrap}>
            {resolvedBenefits.slice(0, 3).map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => setDismissed(true)} activeOpacity={0.7}>
              <Text style={styles.laterText}>{t('premiumLock.continueFree')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywall(true)} activeOpacity={0.85} style={styles.paywallBtnWrap}>
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paywallBtn}
              >
                <Text style={styles.paywallBtnText}>{t('premiumLock.viewPremium')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {children}

      <Modal visible={showPaywall} animationType="slide" presentationStyle="fullScreen">
        <PaywallScreen
          onClose={() => setShowPaywall(false)}
          onSkip={() => setShowPaywall(false)}
          onPurchaseCompleted={() => {
            setShowPaywall(false);
            void checkSubscription();
          }}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  bannerGlow: {
    height: 4,
    borderRadius: THEME.borderRadius.pill,
    marginBottom: THEME.spacing.sm,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.colors.fill[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.xs,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  bannerDescription: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: 2,
    lineHeight: 20,
  },
  benefitsWrap: {
    marginTop: THEME.spacing.sm,
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.gradient.blue,
  },
  benefitText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    flex: 1,
  },
  dismissBtn: {
    padding: 4,
  },
  actionsRow: {
    marginTop: THEME.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  laterText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  paywallBtnWrap: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  paywallBtn: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  paywallBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
