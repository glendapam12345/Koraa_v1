import { View, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { ReorganizeDayFlow } from '@/components/hoy/ReorganizeDayFlow';
import type { WhatChangedReason, ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

type HoyDayReflectionFlowProps = {
  flowOpen: boolean;
  step: 'reason' | 'preview';
  displayName?: string;
  selectedReason: WhatChangedReason | null;
  previewProposal: ReorganizeWeekProposal | null;
  buildingPreview: boolean;
  applying: boolean;
  onClose: () => void;
  onSelectReason: (reason: WhatChangedReason) => void;
  onBackToReason: () => void;
  onConfirm: () => void;
};

export function HoyDayReflectionFlow({
  flowOpen,
  step,
  displayName,
  selectedReason,
  previewProposal,
  buildingPreview,
  applying,
  onClose,
  onSelectReason,
  onBackToReason,
  onConfirm,
}: HoyDayReflectionFlowProps) {
  return (
    <View style={styles.wrap}>
      <ReorganizeDayFlow
        visible={flowOpen}
        step={step}
        displayName={displayName}
        selectedReason={selectedReason}
        proposal={previewProposal}
        buildingPreview={buildingPreview}
        applying={applying}
        onSelectReason={onSelectReason}
        onConfirm={onConfirm}
        onBack={onBackToReason}
        onClose={onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
});
