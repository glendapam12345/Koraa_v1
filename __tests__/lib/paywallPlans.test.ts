import type { PurchasesPackage } from 'react-native-purchases';
import {
  getAnnualSavingsPercent,
  getPlanPeriodKey,
  isPlanPackage,
  shouldClaimIntendedAnnualDiscount,
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
    expect(isPlanPackage(mockPackage('monthly', PREMIUM_MONTHLY_MXN), 'monthly')).toBe(true);
    expect(isPlanPackage(mockPackage('annual', PREMIUM_ANNUAL_MXN), 'annual')).toBe(true);
    expect(isPlanPackage(mockPackage('monthly', PREMIUM_MONTHLY_MXN), 'annual')).toBe(false);
  });

  it('sorts annual before monthly', () => {
    const sorted = sortPackagesForDisplay([
      mockPackage('monthly', PREMIUM_MONTHLY_MXN),
      mockPackage('annual', PREMIUM_ANNUAL_MXN),
    ]);
    expect(isPlanPackage(sorted[0], 'annual')).toBe(true);
    expect(isPlanPackage(sorted[1], 'monthly')).toBe(true);
  });

  it('computes annual savings percent', () => {
    const monthly = mockPackage('monthly', PREMIUM_MONTHLY_MXN);
    const annual = mockPackage('annual', PREMIUM_ANNUAL_MXN);
    expect(getAnnualSavingsPercent(monthly, annual)).toBe(30);
  });

  it('does not claim 30% off when StoreKit prices only save ~16%', () => {
    const monthly = mockPackage('monthly', 1.99);
    const annual = mockPackage('annual', 19.99);
    expect(getAnnualSavingsPercent(monthly, annual)).toBe(16);
    expect(shouldClaimIntendedAnnualDiscount(16)).toBe(false);
    expect(shouldClaimIntendedAnnualDiscount(30)).toBe(true);
  });

  it('maps plan period keys', () => {
    expect(getPlanPeriodKey(mockPackage('monthly', PREMIUM_MONTHLY_MXN))).toBe('month');
    expect(getPlanPeriodKey(mockPackage('annual', PREMIUM_ANNUAL_MXN))).toBe('year');
  });
});
