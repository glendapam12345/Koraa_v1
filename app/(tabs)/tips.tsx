import { Redirect } from 'expo-router';

/** Tab Consejos oculta: el apoyo vive en Hoy y en /tips/[category]. */
export default function TipsTabRedirect() {
  return <Redirect href="/(tabs)" />;
}
