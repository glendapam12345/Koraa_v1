import { KoraaHowItWorksModal } from '@/components/onboarding/KoraaHowItWorksModal';

type QuickOnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** Primera visita a Hoy — misma guía de 3 pasos que Ayuda y Tu espacio. */
export function QuickOnboardingModal({ visible, onClose }: QuickOnboardingModalProps) {
  return (
    <KoraaHowItWorksModal
      visible={visible}
      onClose={onClose}
      titleKey="quickOnboarding.title"
      subtitleKey="quickOnboarding.subtitle"
      ctaKey="quickOnboarding.cta"
    />
  );
}
