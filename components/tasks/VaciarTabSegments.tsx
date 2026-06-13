import { useI18n } from '@/contexts/I18nContext';
import { CalmSegmentedControl } from '@/components/ui/calm/CalmSegmentedControl';

export type VaciarTabSegment = 'capture' | 'projects';

type VaciarTabSegmentsProps = {
  value: VaciarTabSegment;
  onChange: (segment: VaciarTabSegment) => void;
};

export function VaciarTabSegments({ value, onChange }: VaciarTabSegmentsProps) {
  const { t } = useI18n();

  const segments = [
    { id: 'capture' as const, label: t('vaciar.segmentCapture'), accessibilityLabel: t('vaciar.segmentCaptureA11y') },
    { id: 'projects' as const, label: t('vaciar.segmentProjects'), accessibilityLabel: t('vaciar.segmentProjectsA11y') },
  ];

  return (
    <CalmSegmentedControl
      segments={segments}
      value={value}
      onChange={onChange}
      variant="track"
    />
  );
}
