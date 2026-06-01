import type { PurchasesPackage } from 'react-native-purchases';
import type { AppLocale } from '@/lib/i18n';

function localeTag(locale: AppLocale): string {
  return locale === 'es' ? 'es-MX' : 'en-US';
}

/** Precio localizado a partir de StoreKit / RevenueCat (moneda real del producto). */
export function formatSubscriptionPrice(
  price: number,
  currencyCode: string,
  locale: AppLocale,
): string {
  try {
    return new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'MXN' || currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currencyCode} ${price}`;
  }
}

export function formatPackagePrice(
  pkg: PurchasesPackage,
  locale: AppLocale,
  periodSuffix = '',
): string {
  const { price, currencyCode } = pkg.product;
  const formatted = formatSubscriptionPrice(price, currencyCode, locale);
  return periodSuffix ? `${formatted}${periodSuffix}` : formatted;
}

export function packageUsesNonMxnCurrency(pkg: PurchasesPackage): boolean {
  const code = pkg.product.currencyCode?.toUpperCase();
  return Boolean(code && code !== 'MXN');
}
