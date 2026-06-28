import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="areas" />
      <Stack.Screen name="activities" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="emotion" />
      <Stack.Screen name="energy" />
      <Stack.Screen name="time" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="intro2" />
      <Stack.Screen name="intro3" />
      <Stack.Screen name="projects" />
    </Stack>
  );
}
