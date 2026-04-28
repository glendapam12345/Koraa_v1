import { StyleSheet, Text, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { THEME } from '@/constants/theme';

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
};

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip }: PaywallScreenProps) {
  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={() => {
          onPurchaseCompleted?.();
          onClose?.();
        }}
        onRestoreCompleted={() => {
          onPurchaseCompleted?.();
          onClose?.();
        }}
        onDismiss={() => {
          onSkip?.();
          onClose?.();
        }}
      />
      <Text style={styles.footerText}>Si no ves planes, revisa productos y offering en RevenueCat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  footerText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
});
