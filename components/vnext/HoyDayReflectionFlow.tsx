import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import {
  DayReflectionSheet,
  type DayReflectionOutcome,
} from '@/components/vnext/DayReflectionSheet';
import { DayReplanSuccessSheet } from '@/components/vnext/DayReplanSuccessSheet';
import type { ReorganizeWeekProposal } from '@/lib/lifeAreas/types';

type HoyDayReflectionFlowProps = {
  sheetOpen: boolean;
  successOpen: boolean;
  selectedOutcome: DayReflectionOutcome | null;
  replanning: boolean;
  lastProposal: ReorganizeWeekProposal | null;
  onCloseReflection: () => void;
  onSelectOutcome: (outcome: DayReflectionOutcome) => void;
  onReplan: () => void;
  onDismissSuccess: () => void;
};

export function HoyDayReflectionFlow({
  sheetOpen,
  successOpen,
  selectedOutcome,
  replanning,
  lastProposal,
  onCloseReflection,
  onSelectOutcome,
  onReplan,
  onDismissSuccess,
}: HoyDayReflectionFlowProps) {
  const handleViewCalendar = () => {
    onDismissSuccess();
    router.push('/(tabs)/semana');
  };

  return (
    <View style={styles.wrap}>
      <DayReflectionSheet
        visible={sheetOpen}
        selected={selectedOutcome}
        onSelect={onSelectOutcome}
        onReplan={onReplan}
        onClose={onCloseReflection}
        isReplanning={replanning}
      />

      <DayReplanSuccessSheet
        visible={successOpen}
        proposal={lastProposal}
        onDismiss={onDismissSuccess}
        onViewCalendar={handleViewCalendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
});
