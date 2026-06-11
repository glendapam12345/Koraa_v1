import type { PurchasesPackage } from 'react-native-purchases';
import {
  getAnnualSavingsPercent,
  getPlanPeriodKey,
  isPlanPackage,
  sortPackagesForDisplay,
} from '@/lib/paywallPlans';

function mockPackage(plan: 'monthly' | 'annual', price: number): PurchasesPackage {
  return {
    identifier: plan,
    packageType: plan,
    product: {
      identifier: `koraa_${plan}`,
      price,
      currencyCode: 'MXN',
    },
  } as unknown as PurchasesPackage;
}

describe('paywallPlans', () => {
  it('detects monthly and annual packages', () => {
    expect(isPlanPackage(mockPackage('monthly', 49), 'monthly')).toBe(true);
    expect(isPlanPackage(mockPackage('annual', 411), 'annual')).toBe(true);
    expect(isPlanPackage(mockPackage('monthly', 49), 'annual')).toBe(false);
  });

  it('sorts annual before monthly', () => {
    const sorted = sortPackagesForDisplay([mockPackage('monthly', 49), mockPackage('annual', 411)]);
    expect(isPlanPackage(sorted[0], 'annual')).toBe(true);
    expect(isPlanPackage(sorted[1], 'monthly')).toBe(true);
  });

  it('computes annual savings percent', () => {
    const monthly = mockPackage('monthly', 49);
    const annual = mockPackage('annual', 411);
    expect(getAnnualSavingsPercent(monthly, annual)).toBe(30);
  });

  it('maps plan period keys', () => {
    expect(getPlanPeriodKey(mockPackage('monthly', 49))).toBe('month');
    expect(getPlanPeriodKey(mockPackage('annual', 411))).toBe('year');
  });
});
