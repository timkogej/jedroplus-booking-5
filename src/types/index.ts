export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  bgFrom: string;
  bgTo: string;
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  specializations: string[];
}

export interface EmployeeUI {
  id: string;
  label: string;
  subtitle: string;
  initials: string;
}

export interface Category {
  id: string;
  name: string;
  service_count: number;
}

export interface Service {
  id: string;
  category_id: string;
  naziv: string;
  opis: string;
  trajanjeMin: number;
  cena: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  notes?: string;
  gdprSendMarketing?: boolean;
}

export interface BookingData {
  employeeId: string | null;
  categoryId: string | null;
  serviceId: string | null;
  date: Date | null;
  time: string | null;
  customer: CustomerDetails | null;
}

export interface BookingConfirmation {
  success: boolean;
  message: string;
  storitev: string;
  datum: string;
  cas: string;
}

export type BookingStep = 1 | 2 | 3 | 4 | 5;
export type ServiceSubStep = 'category' | 'service';

export interface Company {
  idPodjetja?: string;
  naziv?: string;
  slug: string;
  email?: string;
  panoga?: string;
}

export interface InitResponse {
  company: Company;
  employees: Employee[];
  employees_ui: EmployeeUI[];
  services: Service[];
  serviceCategories: Category[];
  servicesByCategory: Record<string, Service[]>;
  ui: {
    employeeSelection: {
      mode: 'single' | 'multi';
    };
  };
  theme?: Partial<Theme>;
}

export interface SlotsResponse {
  date: string;
  slots: string[];
}
