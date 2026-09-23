import type { Service } from '@/types';
import type { AddOnOption, ServicePromotion } from '@/lib/promotionsApi';

export interface BookingPricing {
  originalTotal: number;
  finalTotal: number;
  discountAmount: number;
  addOnOriginalPrice: number;
  addOnFinalPrice: number;
  addOnDiscountAmount: number;
  hasDiscount: boolean;
  primaryOriginalPrice: number;
  primaryFinalPrice: number;
  promotion: ServicePromotion | null;
}

/**
 * Money the way it is written here: "50,00 €" (amount first, comma decimals).
 * Callers must NOT add a currency sign themselves.
 */
export function formatBookingPrice(value: number | string | null | undefined, currency = 'EUR'): string {
  const amount = typeof value === 'string' ? Number(value) : Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2).replace('.', ',')} €`;
  }
}

export function getPromotionPopustTip(
  promotion: ServicePromotion
): '%' | 'valuta' {
  return promotion.tipPopusta === 'percentage' ? '%' : 'valuta';
}

export function resolvePrimaryPromotion(
  services: Service[],
  serviceDiscounts: Record<string, ServicePromotion>,
  activePromotion: ServicePromotion | null
): ServicePromotion | null {
  const primaryService = services[0];
  if (!primaryService) return null;

  const primaryId = String(primaryService.id);
  const fixedDiscount = serviceDiscounts[primaryId] ?? null;
  if (fixedDiscount) return fixedDiscount;

  if (activePromotion && String(activePromotion.storitevId) === primaryId) {
    return activePromotion;
  }

  return null;
}

export function getBookingPricing(
  services: Service[],
  promotion: ServicePromotion | null,
  addOn?: AddOnOption | null
): BookingPricing {
  const servicesOriginalTotal = services.reduce(
    (sum, service) => sum + Number(service.cena || 0),
    0
  );
  const addOnOriginalPrice = addOn ? Number(addOn.originalCena || 0) : 0;
  const addOnFinalPrice = addOn
    ? Number(addOn.finalCena ?? addOn.originalCena ?? 0)
    : 0;
  const originalTotal = servicesOriginalTotal + addOnOriginalPrice;
  const primaryService = services[0] ?? null;
  const primaryOriginalPrice = primaryService ? Number(primaryService.cena || 0) : 0;
  const appliesToPrimary =
    !!primaryService &&
    !!promotion &&
    String(promotion.storitevId) === String(primaryService.id);
  const primaryFinalPrice = appliesToPrimary
    ? Number(promotion.finalCena || 0)
    : primaryOriginalPrice;
  const discountAmount = Math.max(0, primaryOriginalPrice - primaryFinalPrice);
  const addOnDiscountAmount = Math.max(0, addOnOriginalPrice - addOnFinalPrice);
  const finalTotal = Math.max(
    0,
    servicesOriginalTotal - discountAmount + addOnFinalPrice
  );

  return {
    originalTotal,
    finalTotal,
    discountAmount,
    addOnOriginalPrice,
    addOnFinalPrice,
    addOnDiscountAmount,
    hasDiscount: discountAmount > 0 || addOnDiscountAmount > 0,
    primaryOriginalPrice,
    primaryFinalPrice,
    promotion: appliesToPrimary ? promotion : null,
  };
}
