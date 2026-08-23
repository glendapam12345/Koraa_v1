import {
  PREMIUM_ANNUAL_DISCOUNT_PERCENT,
  PREMIUM_ANNUAL_MXN,
  PREMIUM_MONTHLY_MXN,
  formatMexicoPesos,
  isIntendedAnnualSavingsPercent,
  livePriceDiffersFromMexicoList,
} from '@/lib/premiumPricing';

describe('premiumPricing', () => {
  it('keeps monthly at 65 MXN and annual at 30% off', () => {
    expect(PREMIUM_MONTHLY_MXN).toBe(65);
    expect(PREMIUM_ANNUAL_DISCOUNT_PERCENT).toBe(30);
    expect(PREMIUM_ANNUAL_MXN).toBe(546);
    expect(formatMexicoPesos(PREMIUM_MONTHLY_MXN)).toBe('MX$65');
    expect(formatMexicoPesos(PREMIUM_ANNUAL_MXN)).toBe('MX$546');
  });

  it('only treats ~30% as the intended annual discount', () => {
    expect(isIntendedAnnualSavingsPercent(30)).toBe(true);
    expect(isIntendedAnnualSavingsPercent(16)).toBe(false);
  });

  it('treats USD StoreKit prices as different from the Mexico list', () => {
    expect(livePriceDiffersFromMexicoList(1.99, 'USD', 'monthly')).toBe(true);
    expect(livePriceDiffersFromMexicoList(19.99, 'USD', 'annual')).toBe(true);
    expect(livePriceDiffersFromMexicoList(65, 'MXN', 'monthly')).toBe(false);
    expect(livePriceDiffersFromMexicoList(546, 'MXN', 'annual')).toBe(false);
  });
});
