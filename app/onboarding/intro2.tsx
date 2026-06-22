import { useEffect } from 'react';
import { router } from 'expo-router';

/** Redirige intro2 (legacy) al flujo corto. */
export default function Intro2RedirectScreen() {
  useEffect(() => {
    router.replace('/onboarding/how-it-works');
  }, []);

  return null;
}
