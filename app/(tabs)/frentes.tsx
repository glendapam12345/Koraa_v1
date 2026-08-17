import { FrentesDashboardScreen } from '@/components/vnext/FrentesDashboardScreen';
import { TabScreenErrorBoundary } from '@/components/TabScreenErrorBoundary';

export default function FrentesTabScreen() {
  return (
    <TabScreenErrorBoundary screenName="frentes">
      <FrentesDashboardScreen />
    </TabScreenErrorBoundary>
  );
}
