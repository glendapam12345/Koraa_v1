import type { PurchasesPackage } from 'react-native-purchases';
import type { AppLocale } from '@/lib/i18n';
import { formatSubscriptionPrice } from '@/lib/formatSubscriptionPrice';
import { isIntendedAnnualSavingsPercent } from '@/lib/premiumPricing';

export function isPlanPackage(pkg: PurchasesPackage, plan: 'monthly' | 'annual') {
  const packageType = String(pkg.packageType).toLowerCase();
  const identifier = pkg.identifier.toLowerCase();
  const productId = pkg.product.identifier.toLowerCase();
  const haystack = `${packageType} ${identifier} ${productId}`;
  if (plan === 'monthly') {
    return haystack.includes('month') || haystack.includes('monthly') || haystack.includes('mensual');
  }
  return haystack.includes('annual') || haystack.includes('year') || haystack.includes('anual');
}

export function sortPackagesForDisplay(packages: PurchasesPackage[]) {
  const annual = packages.find((pkg) => isPlanPackage(pkg, 'annual'));
  const monthly = packages.find((pkg) => isPlanPackage(pkg, 'monthly'));
  const rest = packages.filter((pkg) => pkg !== annual && pkg !== monthly);
  return [annual, monthly, ...rest].filter((pkg): pkg is PurchasesPackage => Boolean(pkg));
}

export function getAnnualSavingsPercent(
  monthly: PurchasesPackage | undefined,
  annual: PurchasesPackage | undefined,
): number | null {
  if (!monthly || !annual) return null;
  const monthlyPrice = monthly.product.price;
  const annualPrice = annual.product.price;
  if (monthlyPrice <= 0 || annualPrice <= 0) return null;
  const fullYearMonthly = monthlyPrice * 12;
  const savings = ((fullYearMonthly - annualPrice) / fullYearMonthly) * 100;
  return savings >= 1 ? Math.round(savings) : null;
}

/** Don’t claim the Mexico 30% off if StoreKit prices save a different amount. */
export function shouldClaimIntendedAnnualDiscount(savingsPercent: number | null): boolean {
  return isIntendedAnnualSavingsPercent(savingsPercent);
}

export function formatAnnualMonthlyEquivalent(
  annual: PurchasesPackage,
  locale: AppLocale,
): string {
  const monthly = annual.product.price / 12;
  return formatSubscriptionPrice(monthly, annual.product.currencyCode, locale);
}

export function getPlanPeriodKey(pkg: PurchasesPackage): 'year' | 'month' | 'week' | null {
  const id = `${pkg.identifier} ${pkg.packageType}`.toLowerCase();
  if (id.includes('annual') || id.includes('year') || id.includes('anual')) return 'year';
  if (id.includes('month') || id.includes('monthly') || id.includes('mensual')) return 'month';
  if (id.includes('week') || id.includes('weekly')) return 'week';
  return null;
}
