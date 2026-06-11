import { Stack } from 'expo-router';

export default function EmergencyKitLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="session"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
