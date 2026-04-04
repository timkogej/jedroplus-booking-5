import { create } from 'zustand';
import {
  BookingStep,
  EmployeeUI,
  Category,
  Service,
  CustomerDetails,
  Theme,
  Company,
} from '@/types';
import { DEFAULT_THEME } from '@/lib/api';

interface BookingState {
  // Current step (1=category, 2=service, 3=employee, 4=date+time, 5=customer, 6=confirm)
  currentStep: BookingStep;

  // Theme
  theme: Theme;

  // Company data
  company: Company | null;

  // Data
  employeesUI: EmployeeUI[];
  categories: Category[];
  services: Service[];
  servicesByCategory: Record<string, Service[]>;
  employeesByServiceId: Record<string, (string | number)[]>;

  // Selections
  selectedEmployeeId: string | null;
  anyPerson: boolean;
  eligibleEmployeeIds: string[];
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
  setEmployeesByServiceId: (data: Record<string, (string | number)[]>) => void;

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
  theme: DEFAULT_THEME,
  company: null,
  employeesUI: [],
  categories: [],
  services: [],
  servicesByCategory: {},
  employeesByServiceId: {},
  selectedEmployeeId: null,
  anyPerson: false,
  eligibleEmployeeIds: [],
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

  setEmployeesByServiceId: (employeesByServiceId) => set({ employeesByServiceId }),

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
      selectedEmployeeId: null,
      anyPerson: false,
      eligibleEmployeeIds: [],
    });
    get().nextStep();
  },

  selectService: (service) => {
    const { employeesByServiceId, employeesUI } = get();
    const serviceKey = String(service.id);

    let eligibleIds: string[];
    if (serviceKey in employeesByServiceId) {
      // Explicit mapping exists — may be empty (meaning no one can do this service)
      eligibleIds = employeesByServiceId[serviceKey].map(String);
    } else {
      // No mapping found — treat all employees as eligible
      eligibleIds = employeesUI.map(emp => String(emp.id));
    }

    const eligibleSet = new Set(eligibleIds);
    const filteredEmployees = employeesUI.filter(emp => eligibleSet.has(String(emp.id)));

    // Pre-select if exactly one eligible employee
    const autoSelectedId = filteredEmployees.length === 1 ? filteredEmployees[0].id : null;

    set({
      selectedService: service,
      selectedEmployeeId: autoSelectedId,
      anyPerson: false,
      eligibleEmployeeIds: eligibleIds,
    });
    get().nextStep();
  },

  selectDate: (date) => set({ selectedDate: date, selectedTime: null }),

  selectTime: (time) => {
    set({ selectedTime: time });
    get().nextStep();
  },

  setCustomerDetails: (details) => set({ customerDetails: details }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 6) {
      set({ currentStep: (currentStep + 1) as BookingStep });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as BookingStep });
    }
  },

  goToStep: (step) => set({ currentStep: step }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  setBookingConfirmation: (bookingConfirmation) => set({ bookingConfirmation }),

  reset: () => set(initialState),
}));
