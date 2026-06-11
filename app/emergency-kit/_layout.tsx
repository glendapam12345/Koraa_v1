import { Stack } from 'expo-router';
import { EmergencyKitPremiumGate } from '@/components/emergencyKit/EmergencyKitPremiumGate';

export default function EmergencyKitLayout() {
  return (
    <EmergencyKitPremiumGate>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="session"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
    </EmergencyKitPremiumGate>
  );
}
