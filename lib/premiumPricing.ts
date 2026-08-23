/** Precios de referencia en MXN. El cobro real lo define App Store Connect / RevenueCat. */
export const PREMIUM_MONTHLY_MXN = 65;
export const PREMIUM_ANNUAL_DISCOUNT_PERCENT = 30;

/** 65 × 12 × 0.70 = 546 MXN (30% vs pagar mes a mes). */
export const PREMIUM_ANNUAL_MXN = Math.round(
  PREMIUM_MONTHLY_MXN * 12 * (1 - PREMIUM_ANNUAL_DISCOUNT_PERCENT / 100),
);

export function isIntendedAnnualSavingsPercent(percent: number | null): boolean {
  if (percent == null) return false;
  return Math.abs(percent - PREMIUM_ANNUAL_DISCOUNT_PERCENT) <= 2;
}
