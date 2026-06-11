import { useEffect } from 'react';
import { router } from 'expo-router';

/** Redirige intro3 (legacy) al flujo corto. */
export default function Intro3RedirectScreen() {
  useEffect(() => {
    router.replace('/onboarding/how-it-works');
  }, []);

  return null;
}
