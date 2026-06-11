import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaywallScreen } from '@/components/PaywallScreen';

export default function PaywallRoute() {
  const router = useRouter();
  const { next, source } = useLocalSearchParams<{ next?: string; source?: string }>();

  const goNext = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (next && typeof next === 'string' && next.startsWith('/')) {
      router.replace(next as '/');
      return;
    }
    router.replace('/(tabs)');
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
