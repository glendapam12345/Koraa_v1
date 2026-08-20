import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaywallScreen } from '@/components/PaywallScreen';
import { resolvePaywallDismissRoute } from '@/lib/paywallNavigation';
import { HOY_TAB_PATH, replaceToHoyTab } from '@/lib/tabNavigation';

export default function PaywallRoute() {
  const router = useRouter();
  const { next, source } = useLocalSearchParams<{ next?: string; source?: string }>();

  const goNext = () => {
    const destination = resolvePaywallDismissRoute({
      next: typeof next === 'string' ? next : undefined,
      source: typeof source === 'string' ? source : undefined,
      canGoBack: router.canGoBack(),
    });
    if (destination === 'back') {
      router.back();
      return;
    }
    if (destination === HOY_TAB_PATH || destination === '/' || destination === '/(tabs)') {
      replaceToHoyTab();
      return;
    }
    router.replace(destination as '/');
  };

  const context =
    source === 'onboarding' || source === 'post_hoy' ? 'onboarding' : 'default';

  return (
    <PaywallScreen
      context={context}
      onClose={goNext}
      onPurchaseCompleted={goNext}
      onSkip={goNext}
    />
  );
}
