import type { PurchasesPackage } from 'react-native-purchases';
import {
  getAnnualSavingsPercent,
  getPlanPeriodKey,
  isPlanPackage,
  sortPackagesForDisplay,
} from '@/lib/paywallPlans';
import {
  PREMIUM_ANNUAL_MXN,
  PREMIUM_MONTHLY_MXN,
} from '@/lib/premiumPricing';

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
    expect(isPlanPackage(mockPackage('monthly', 69), 'monthly')).toBe(true);
    expect(isPlanPackage(mockPackage('annual', 579), 'annual')).toBe(true);
    expect(isPlanPackage(mockPackage('monthly', 69), 'annual')).toBe(false);
  });

  it('sorts annual before monthly', () => {
    const sorted = sortPackagesForDisplay([mockPackage('monthly', 69), mockPackage('annual', 579)]);
    expect(isPlanPackage(sorted[0], 'annual')).toBe(true);
    expect(isPlanPackage(sorted[1], 'monthly')).toBe(true);
  });

  it('computes annual savings percent', () => {
    const monthly = mockPackage('monthly', PREMIUM_MONTHLY_MXN);
    const annual = mockPackage('annual', PREMIUM_ANNUAL_MXN);
    expect(getAnnualSavingsPercent(monthly, annual)).toBe(30);
  });

  it('maps plan period keys', () => {
    expect(getPlanPeriodKey(mockPackage('monthly', 69))).toBe('month');
    expect(getPlanPeriodKey(mockPackage('annual', 579))).toBe('year');
  });
});
