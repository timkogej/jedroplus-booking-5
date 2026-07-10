import { create } from 'zustand'
import type { ServicePromotion, AddOnOption } from '@/lib/promotionsApi'

interface PromotionsState {
  serviceDiscounts: Record<string, ServicePromotion>
  activeHappyHour: ServicePromotion | null
  activePromotion: ServicePromotion | null
  availableAddOns: AddOnOption[]
  selectedAddOn: AddOnOption | null
  isLoadingDiscounts: boolean
  isLoadingAddOns: boolean

  setServiceDiscounts: (discounts: Record<string, ServicePromotion>) => void
  setActiveHappyHour: (hh: ServicePromotion | null) => void
  /**
   * Resolve the active promotion for a single service.
   * Fixed-period discount wins over happy-hour.
   */
  computeActivePromotion: (storitevId: string) => void
  /**
   * Resolve the active promotion for multiple services.
   * Promotions apply to the primary service (serviceIds[0]) only.
   */
  computeActivePromotionForServices: (serviceIds: string[]) => void
  setAvailableAddOns: (addOns: AddOnOption[]) => void
  selectAddOn: (addOn: AddOnOption | null) => void
  setLoadingDiscounts: (v: boolean) => void
  setLoadingAddOns: (v: boolean) => void
  resetSelections: () => void
}

export const usePromotionsStore = create<PromotionsState>((set, get) => ({
  serviceDiscounts: {},
  activeHappyHour: null,
  activePromotion: null,
  availableAddOns: [],
  selectedAddOn: null,
  isLoadingDiscounts: false,
  isLoadingAddOns: false,

  setServiceDiscounts: (discounts) => set({ serviceDiscounts: discounts }),

  setActiveHappyHour: (hh) => set({ activeHappyHour: hh }),

  computeActivePromotion: (storitevId) => {
    const { serviceDiscounts, activeHappyHour } = get()
    const discount = serviceDiscounts[storitevId] || null
    set({ activePromotion: discount ?? activeHappyHour })
  },

  computeActivePromotionForServices: (serviceIds) => {
    // Promotions apply to the primary service only; keep it simple for Phase 2.
    const primaryId = serviceIds[0]
    if (!primaryId) {
      set({ activePromotion: null })
      return
    }
    get().computeActivePromotion(primaryId)
  },

  setAvailableAddOns: (addOns) => set({ availableAddOns: addOns }),

  selectAddOn: (addOn) => set({ selectedAddOn: addOn }),

  setLoadingDiscounts: (v) => set({ isLoadingDiscounts: v }),

  setLoadingAddOns: (v) => set({ isLoadingAddOns: v }),

  resetSelections: () => set({
    activeHappyHour: null,
    activePromotion: null,
    availableAddOns: [],
    selectedAddOn: null,
  }),
}))
