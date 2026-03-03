import { create } from 'zustand';
import {
  BookingStep,
  ServiceSubStep,
  EmployeeUI,
  Category,
  Service,
  CustomerDetails,
  Theme,
  Company,
} from '@/types';
import { DEFAULT_THEME } from '@/lib/api';

interface BookingState {
  // Current step
  currentStep: BookingStep;
  serviceSubStep: ServiceSubStep;

  // Theme
  theme: Theme;

  // Company data
  company: Company | null;

  // Data
  employeesUI: EmployeeUI[];
  categories: Category[];
  services: Service[];
  servicesByCategory: Record<string, Service[]>;

  // Selections
  selectedEmployeeId: string | null;
  anyPerson: boolean;
  selectedCategory: Category | null;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  customerDetails: CustomerDetails | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Booking result
  bookingConfirmation: {
    success: boolean;
    message: string;
    storitev: string;
    datum: string;
    cas: string;
  } | null;

  // Actions
  setTheme: (theme: Theme) => void;
  setCompany: (company: Company) => void;
  setEmployeesUI: (employees: EmployeeUI[]) => void;
  setCategories: (categories: Category[]) => void;
  setServices: (services: Service[]) => void;
  setServicesByCategory: (data: Record<string, Service[]>) => void;

  selectEmployee: (employeeId: string | null, isAnyPerson?: boolean) => void;
  selectCategory: (category: Category) => void;
  selectService: (service: Service) => void;
  selectDate: (date: Date) => void;
  selectTime: (time: string) => void;
  setCustomerDetails: (details: CustomerDetails) => void;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: BookingStep) => void;

  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setBookingConfirmation: (confirmation: BookingState['bookingConfirmation']) => void;

  reset: () => void;
}

const initialState = {
  currentStep: 1 as BookingStep,
  serviceSubStep: 'category' as ServiceSubStep,
  theme: DEFAULT_THEME,
  company: null,
  employeesUI: [],
  categories: [],
  services: [],
  servicesByCategory: {},
  selectedEmployeeId: null,
  anyPerson: false,
  selectedCategory: null,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  customerDetails: null,
  isLoading: false,
  isSubmitting: false,
  bookingConfirmation: null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  setTheme: (theme) => set({ theme }),

  setCompany: (company) => set({ company }),

  setEmployeesUI: (employeesUI) => set({ employeesUI }),

  setCategories: (categories) => set({ categories }),

  setServices: (services) => set({ services }),

  setServicesByCategory: (servicesByCategory) => set({ servicesByCategory }),

  selectEmployee: (employeeId, isAnyPerson = false) => {
    set({
      selectedEmployeeId: employeeId,
      anyPerson: isAnyPerson,
    });
    // Auto-advance after selection
    get().nextStep();
  },

  selectCategory: (category) => {
    set({
      selectedCategory: category,
      serviceSubStep: 'service',
      selectedService: null,
    });
  },

  selectService: (service) => {
    set({ selectedService: service });
    // Auto-advance after service selection
    get().nextStep();
  },

  selectDate: (date) => set({ selectedDate: date }),

  selectTime: (time) => {
    set({ selectedTime: time });
    // Auto-advance after time selection
    get().nextStep();
  },

  setCustomerDetails: (details) => set({ customerDetails: details }),

  nextStep: () => {
    const { currentStep, serviceSubStep } = get();

    if (currentStep === 2 && serviceSubStep === 'category') {
      // Stay on step 2, just switch sub-step (handled by selectCategory)
      return;
    }

    if (currentStep < 5) {
      set({
        currentStep: (currentStep + 1) as BookingStep,
        serviceSubStep: 'category',
      });
    }
  },

  prevStep: () => {
    const { currentStep, serviceSubStep } = get();

    if (currentStep === 2 && serviceSubStep === 'service') {
      set({ serviceSubStep: 'category' });
      return;
    }

    if (currentStep > 1) {
      set({
        currentStep: (currentStep - 1) as BookingStep,
        serviceSubStep: currentStep === 3 ? 'service' : 'category',
      });
    }
  },

  goToStep: (step) => set({ currentStep: step, serviceSubStep: 'category' }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  setBookingConfirmation: (bookingConfirmation) => set({ bookingConfirmation }),

  reset: () => set(initialState),
}));
