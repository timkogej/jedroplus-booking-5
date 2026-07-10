import { create } from 'zustand';
import {
  BookingStep,
  EmployeeUI,
  Category,
  Service,
  CustomerDetails,
  Theme,
  Company,
  Resurs,
  DaySlots,
  SupportedLanguage,
  StripePaymentInfo,
  InitResponse,
} from '@/types';
import { DEFAULT_THEME } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helper — read persisted language preference (SSR-safe)
// ─────────────────────────────────────────────────────────────────────────────
function getPersistedLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'sl';
  return (localStorage.getItem('booking_lang') as SupportedLanguage) || 'sl';
}

// ─────────────────────────────────────────────────────────────────────────────
// State + Actions interface
// ─────────────────────────────────────────────────────────────────────────────
interface BookingState {
  // ── Step ────────────────────────────────────────────────────────────────────
  /** Current booking step. 1–6 = standard flow, 7 = Stripe payment gate */
  currentStep: BookingStep;

  // ── Theme ────────────────────────────────────────────────────────────────────
  theme: Theme;

  // ── Company ──────────────────────────────────────────────────────────────────
  company: Company | null;

  // ── Static data from init ────────────────────────────────────────────────────
  employeesUI: EmployeeUI[];
  categories: Category[];
  services: Service[];
  servicesByCategory: Record<string, Service[]>;
  /** service text ID → array of employee text IDs that can perform it */
  employeesByServiceId: Record<string, (string | number)[]>;

  // ── Resources ────────────────────────────────────────────────────────────────
  /** Physical resources (rooms, equipment) from "Resursi" table */
  resursi: Resurs[];
  /** service text ID → resurs row IDs required for that service */
  storitveResursiMap: Record<string, number[]>;

  // ── Selections — legacy single-service (kept for variant component compat) ───
  /** Always equals selectedServices[0] or null — kept for backward compat */
  selectedService: Service | null;
  selectedEmployeeId: string | null;
  anyPerson: boolean;
  /** Intersection of employees eligible for ALL currently selected services */
  eligibleEmployeeIds: string[];
  selectedCategory: Category | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  customerDetails: CustomerDetails | null;

  // ── Multi-service (up to 3) ──────────────────────────────────────────────────
  /** 1–3 selected services; index 0 is the primary service */
  selectedServices: Service[];
  /** True when company.multiple_services_online=true */
  multipleServicesAllowed: boolean;
  /** True when 2+ services are selected but no employee can perform all of them */
  noEmployeeForCombination: boolean;
  /** Deduplicated union of resursiIds required by all selected services */
  requiredResursiIds: number[];
  /** Sum of trajanjeMin for all selected services */
  totalDurationMin: number;

  // ── Range-based slots cache ──────────────────────────────────────────────────
  /** Map of 'yyyy-MM-dd' → DaySlots for all fetched dates */
  slotsMap: Record<string, DaySlots>;
  isLoadingSlots: boolean;

  // ── Language ─────────────────────────────────────────────────────────────────
  /** ISO language code for notification emails; persisted to localStorage */
  language: SupportedLanguage;

  // ── Stripe ───────────────────────────────────────────────────────────────────
  stripeEnabled: boolean;
  stripePaymentMode: 'full' | 'deposit';
  stripeDepositPercent: number;
  stripePaymentInfo: StripePaymentInfo | null;

  // ── Company config flags ─────────────────────────────────────────────────────
  /** When false, employee selection step is hidden; all bookings use any_person=true */
  prikazZaposlenih: boolean;
  /** Maximum days ahead a booking can be made */
  maxDniRezervacija: number;

  // ── Loading / result ─────────────────────────────────────────────────────────
  isLoading: boolean;
  isSubmitting: boolean;
  bookingConfirmation: {
    success: boolean;
    message: string;
    storitev: string;
    datum: string;
    cas: string;
  } | null;

  // ── Actions — init ───────────────────────────────────────────────────────────

  /**
   * Hydrate all store state from a single init response.
   * Variant page components that still use individual setters continue to work.
   */
  setInitData: (data: InitResponse) => void;

  // ── Actions — individual setters (kept for variant page backward compat) ─────
  setTheme: (theme: Theme) => void;
  setCompany: (company: Company) => void;
  setEmployeesUI: (employees: EmployeeUI[]) => void;
  setCategories: (categories: Category[]) => void;
  setServices: (services: Service[]) => void;
  setServicesByCategory: (data: Record<string, Service[]>) => void;
  setEmployeesByServiceId: (data: Record<string, (string | number)[]>) => void;

  // ── Actions — selections ─────────────────────────────────────────────────────
  selectEmployee: (employeeId: string | null, isAnyPerson?: boolean) => void;
  selectCategory: (category: Category) => void;
  /** Single-service select; keeps selectedServices in sync for backward compat */
  selectService: (service: Service) => void;
  /** Combined category+service selection (used in compact step 1/2 variants) */
  selectCategoryAndService: (category: Category, service: Service) => void;
  selectDate: (date: Date) => void;
  selectTime: (time: string) => void;
  setCustomerDetails: (details: CustomerDetails) => void;

  // ── Actions — multi-service ──────────────────────────────────────────────────
  /** Add a service (max 3). Replaces if multipleServicesAllowed=false. */
  addService: (service: Service) => void;
  /** Remove a service by ID; recomputes derived values. */
  removeService: (serviceId: string) => void;

  // ── Actions — step navigation ────────────────────────────────────────────────
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: BookingStep) => void;
  /** Navigate directly to step 7 (Stripe payment) */
  goToPayment: () => void;

  // ── Actions — slots / stripe / language ─────────────────────────────────────
  setSlotsMap: (map: Record<string, DaySlots>) => void;
  setLoadingSlots: (v: boolean) => void;
  setStripePaymentInfo: (info: StripePaymentInfo | null) => void;
  setLanguage: (lang: SupportedLanguage) => void;

  // ── Actions — loading / result ───────────────────────────────────────────────
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setBookingConfirmation: (confirmation: BookingState['bookingConfirmation']) => void;

  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────
const initialState: Omit<BookingState,
  | 'setInitData' | 'setTheme' | 'setCompany' | 'setEmployeesUI'
  | 'setCategories' | 'setServices' | 'setServicesByCategory'
  | 'setEmployeesByServiceId' | 'selectEmployee' | 'selectCategory'
  | 'selectService' | 'selectCategoryAndService' | 'selectDate'
  | 'selectTime' | 'setCustomerDetails' | 'addService' | 'removeService'
  | 'nextStep' | 'prevStep' | 'goToStep' | 'goToPayment'
  | 'setSlotsMap' | 'setLoadingSlots' | 'setStripePaymentInfo' | 'setLanguage'
  | 'setLoading' | 'setSubmitting' | 'setBookingConfirmation' | 'reset'
> = {
  currentStep: 1 as BookingStep,
  theme: DEFAULT_THEME,
  company: null,
  employeesUI: [],
  categories: [],
  services: [],
  servicesByCategory: {},
  employeesByServiceId: {},
  resursi: [],
  storitveResursiMap: {},
  selectedService: null,
  selectedEmployeeId: null,
  anyPerson: false,
  eligibleEmployeeIds: [],
  selectedCategory: null,
  selectedDate: null,
  selectedTime: null,
  customerDetails: null,
  selectedServices: [],
  multipleServicesAllowed: false,
  noEmployeeForCombination: false,
  requiredResursiIds: [],
  totalDurationMin: 0,
  slotsMap: {},
  isLoadingSlots: false,
  language: getPersistedLanguage(),
  stripeEnabled: false,
  stripePaymentMode: 'full',
  stripeDepositPercent: 30,
  stripePaymentInfo: null,
  prikazZaposlenih: true,
  maxDniRezervacija: 60,
  isLoading: false,
  isSubmitting: false,
  bookingConfirmation: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useBookingStore = create<BookingState>((set, get) => {

  // ── Internal helpers ─────────────────────────────────────────────────────────

  /**
   * Compute eligible employee IDs as the intersection across all selected services.
   * Returns { eligible, noMatch, autoId }.
   */
  function computeEligibleFrom(services: Service[]) {
    const { employeesByServiceId, employeesUI } = get();

    if (services.length === 0) {
      return { eligible: [] as string[], noMatch: false, autoId: null as string | null };
    }

    const perService = services.map((svc) => {
      const key = String(svc.id);
      if (key in employeesByServiceId) {
        return employeesByServiceId[key].map(String);
      }
      return employeesUI.map((e) => String(e.id));
    });

    const eligible = perService.reduce((acc, ids) => {
      const s = new Set(ids);
      return acc.filter((id) => s.has(id));
    });

    const noMatch = eligible.length === 0 && services.length > 1;
    const autoId = eligible.length === 1 ? eligible[0] : null;

    return { eligible, noMatch, autoId };
  }

  /**
   * Compute deduplicated union of resursi IDs required by all selected services.
   */
  function computeResursiFrom(services: Service[]): number[] {
    const { storitveResursiMap } = get();
    return Array.from(
      new Set(services.flatMap((svc) => storitveResursiMap[String(svc.id)] ?? []))
    );
  }

  /**
   * Build the derived state changes for a new services array, keeping the
   * current selectedEmployeeId if it is still in the eligible intersection.
   */
  function deriveFromServices(services: Service[]) {
    const { eligible, noMatch, autoId } = computeEligibleFrom(services);
    const prevSelected = get().selectedEmployeeId;
    const newSelectedId =
      autoId ??
      (prevSelected && eligible.includes(prevSelected) ? prevSelected : null);

    return {
      selectedServices: services,
      selectedService: services[0] ?? null,
      eligibleEmployeeIds: eligible,
      noEmployeeForCombination: noMatch,
      selectedEmployeeId: newSelectedId,
      requiredResursiIds: computeResursiFrom(services),
      totalDurationMin: services.reduce((sum, s) => sum + s.trajanjeMin, 0),
    };
  }

  // ── Store object ─────────────────────────────────────────────────────────────

  return {
    ...initialState,

    // ── Init ──────────────────────────────────────────────────────────────────

    setInitData: (data) => {
      const { company, theme, employees_ui, serviceCategories, services,
        servicesByCategory, employeesByServiceId, resursi, storitveResursiMap } = data;

      // Prefer a persisted language choice over the company default
      const savedLang =
        typeof window !== 'undefined'
          ? (localStorage.getItem('booking_lang') as SupportedLanguage | null)
          : null;
      const lang: SupportedLanguage = savedLang ?? company.defaultLanguage ?? 'sl';

      set({
        company,
        theme: theme ? { ...DEFAULT_THEME, ...theme } : DEFAULT_THEME,
        employeesUI: employees_ui ?? [],
        categories: serviceCategories ?? [],
        services: services ?? [],
        servicesByCategory: servicesByCategory ?? {},
        employeesByServiceId: employeesByServiceId ?? {},
        resursi: resursi ?? [],
        storitveResursiMap: storitveResursiMap ?? {},
        multipleServicesAllowed: company.multiple_services_online ?? false,
        prikazZaposlenih: company.prikaz_zaposlenih_rezervacija ?? true,
        maxDniRezervacija: company.max_dnevi_rezervacija ?? 60,
        stripeEnabled: company.stripe_enabled ?? false,
        stripePaymentMode: company.stripe_payment_mode ?? 'full',
        stripeDepositPercent: company.stripe_deposit_percent ?? 30,
        language: lang,
      });
    },

    // ── Individual setters (variant page backward compat) ─────────────────────

    setTheme: (theme) => set({ theme }),

    setCompany: (company) => set({ company }),

    setEmployeesUI: (employeesUI) => set({ employeesUI }),

    setCategories: (categories) => set({ categories }),

    setServices: (services) => set({ services }),

    setServicesByCategory: (servicesByCategory) => set({ servicesByCategory }),

    setEmployeesByServiceId: (employeesByServiceId) => set({ employeesByServiceId }),

    // ── Selections ────────────────────────────────────────────────────────────

    selectEmployee: (employeeId, isAnyPerson = false) => {
      set({
        selectedEmployeeId: employeeId,
        anyPerson: isAnyPerson,
      });
      get().nextStep();
    },

    selectCategory: (category) => {
      set({
        selectedCategory: category,
        selectedService: null,
        selectedServices: [],
        selectedEmployeeId: null,
        anyPerson: false,
        eligibleEmployeeIds: [],
        noEmployeeForCombination: false,
        requiredResursiIds: [],
        totalDurationMin: 0,
      });
      get().nextStep();
    },

    selectService: (service) => {
      const derived = deriveFromServices([service]);
      set({
        ...derived,
        anyPerson: false,
        noEmployeeForCombination: false,
      });
      get().nextStep();
    },

    selectCategoryAndService: (category, service) => {
      const { multipleServicesAllowed } = get();
      const derived = deriveFromServices([service]);
      set({ selectedCategory: category, ...derived, anyPerson: false });

      if (!multipleServicesAllowed) {
        // Single-service mode: skip step 2, go straight to employee selection
        get().goToStep(3);
      } else {
        // Multi-service mode: go to step 2 so user can add more services
        get().goToStep(2);
      }
    },

    selectDate: (date) => set({ selectedDate: date, selectedTime: null }),

    selectTime: (time) => {
      set({ selectedTime: time });
      get().nextStep();
    },

    setCustomerDetails: (details) => set({ customerDetails: details }),

    // ── Multi-service ─────────────────────────────────────────────────────────

    addService: (service) => {
      const { selectedServices, multipleServicesAllowed } = get();

      let updated: Service[];
      if (!multipleServicesAllowed) {
        // Single-service mode: replace
        updated = [service];
      } else {
        // Multi-service mode: add (deduplicate, cap at 3)
        if (selectedServices.some((s) => s.id === service.id)) return;
        if (selectedServices.length >= 3) return;
        updated = [...selectedServices, service];
      }

      set(deriveFromServices(updated));
    },

    removeService: (serviceId) => {
      const { selectedServices } = get();
      const updated = selectedServices.filter((s) => s.id !== serviceId);
      if (updated.length === selectedServices.length) return; // not found

      set({
        ...deriveFromServices(updated),
        // Clear employee auto-selection when services change
        selectedEmployeeId: null,
        anyPerson: false,
      });
    },

    // ── Step navigation ───────────────────────────────────────────────────────

    nextStep: () => {
      const { currentStep } = get();
      if (currentStep < 7) {
        set({ currentStep: (currentStep + 1) as BookingStep });
      }
    },

    prevStep: () => {
      const { currentStep } = get();
      if (currentStep === 7) {
        // Payment step: go back to confirmation
        set({ currentStep: 6 as BookingStep });
      } else if (currentStep === 3) {
        // Step 3 can be reached by skipping step 2 via selectCategoryAndService
        set({ currentStep: 1 as BookingStep });
      } else if (currentStep > 1) {
        set({ currentStep: (currentStep - 1) as BookingStep });
      }
    },

    goToStep: (step) => set({ currentStep: step }),

    goToPayment: () => set({ currentStep: 7 as BookingStep }),

    // ── Slots / Stripe / Language ─────────────────────────────────────────────

    setSlotsMap: (slotsMap) => set({ slotsMap }),

    setLoadingSlots: (isLoadingSlots) => set({ isLoadingSlots }),

    setStripePaymentInfo: (stripePaymentInfo) => set({ stripePaymentInfo }),

    setLanguage: (language) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('booking_lang', language);
      }
      set({ language });
    },

    // ── Loading / result ──────────────────────────────────────────────────────

    setLoading: (isLoading) => set({ isLoading }),

    setSubmitting: (isSubmitting) => set({ isSubmitting }),

    setBookingConfirmation: (bookingConfirmation) => set({ bookingConfirmation }),

    reset: () => {
      // Preserve the user's language choice across resets
      const language = getPersistedLanguage();
      set({ ...initialState, language });
    },
  };
});
