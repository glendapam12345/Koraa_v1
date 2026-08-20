import { Redirect } from 'expo-router';
import { HOY_TAB_HREF } from '@/lib/tabNavigation';

/** Tab Consejos oculta: el apoyo vive en Hoy y en /tips/[category]. */
export default function TipsTabRedirect() {
  return <Redirect href={HOY_TAB_HREF} />;
}
