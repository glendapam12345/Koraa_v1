/** Precios de referencia en MXN. El cobro real lo define App Store Connect / RevenueCat. */
export const PREMIUM_MONTHLY_MXN = 65;
export const PREMIUM_ANNUAL_DISCOUNT_PERCENT = 30;

/** 65 × 12 × 0.70 = 546 MXN (30% vs pagar mes a mes). */
export const PREMIUM_ANNUAL_MXN = Math.round(
  PREMIUM_MONTHLY_MXN * 12 * (1 - PREMIUM_ANNUAL_DISCOUNT_PERCENT / 100),
);

export function formatMexicoPesos(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const digits = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `MX$${digits}`;
}

export function isIntendedAnnualSavingsPercent(percent: number | null): boolean {
  if (percent == null) return false;
  return Math.abs(percent - PREMIUM_ANNUAL_DISCOUNT_PERCENT) <= 2;
}

/** StoreKit is not the Mexico list price (wrong currency or wrong amount). */
export function livePriceDiffersFromMexicoList(
  price: number,
  currencyCode: string | undefined,
  plan: 'monthly' | 'annual',
): boolean {
  const expected = plan === 'monthly' ? PREMIUM_MONTHLY_MXN : PREMIUM_ANNUAL_MXN;
  if ((currencyCode ?? '').toUpperCase() !== 'MXN') return true;
  return Math.abs(price - expected) > 2;
}
