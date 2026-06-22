import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaywallScreen } from '@/components/PaywallScreen';
import { resolvePaywallDismissRoute } from '@/lib/paywallNavigation';

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
    router.replace(destination as '/');
  };

  const context = source === 'onboarding' ? 'onboarding' : 'default';

  return (
    <PaywallScreen
      context={context}
      onClose={goNext}
      onPurchaseCompleted={goNext}
      onSkip={goNext}
    />
  );
}
