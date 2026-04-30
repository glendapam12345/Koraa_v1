import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaywallScreen } from '@/components/PaywallScreen';

export default function PaywallRoute() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const goNext = () => {
    if (next && typeof next === 'string' && next.startsWith('/')) {
      router.replace(next as '/');
      return;
    }
    router.replace('/(tabs)');
  };

  return <PaywallScreen onClose={goNext} onPurchaseCompleted={goNext} />;
}
