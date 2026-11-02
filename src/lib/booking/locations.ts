// Several locations: the client first picks a location, then sees only the
// services, people and resources that belong to it. The server (booking-v2)
// checks the same rules again, so this is for a clean page, not for safety.
//
// Rule everywhere: no link = everywhere. A company with one location gets an
// empty `locations` list from init and nothing in here changes its booking.

import type { Category, EmployeeUI, Location, Resurs, Service } from '@/types';

/** What init returned, before any location filter. */
export interface Catalog {
  employeesUI: EmployeeUI[];
  categories: Category[];
  services: Service[];
  servicesByCategory: Record<string, Service[]>;
  employeesByServiceId: Record<string, (string | number)[]>;
  resursi: Resurs[];
  storitveResursiMap: Record<string, number[]>;
}

const at = (list: string[] | null | undefined, locationId: string) =>
  !list || list.length === 0 || list.includes(locationId);

/** The catalog as seen from one location. */
export function catalogForLocation(raw: Catalog, locations: Location[], locationId: string): Catalog {
  const mainId = (locations.find((l) => l.je_glavna) ?? locations[0])?.id;

  const employeesUI = raw.employeesUI.filter((e) => at(e.lokacije, locationId));
  const employeeIds = new Set(employeesUI.map((e) => String(e.id)));

  const services = raw.services.filter((s) => at(s.lokacije, locationId));
  const serviceIds = new Set(services.map((s) => String(s.id)));

  const servicesByCategory: Record<string, Service[]> = {};
  for (const [categoryId, list] of Object.entries(raw.servicesByCategory)) {
    const kept = list.filter((s) => serviceIds.has(String(s.id)));
    if (kept.length > 0) servicesByCategory[categoryId] = kept;
  }
  const categories = raw.categories
    .filter((c) => servicesByCategory[c.id])
    .map((c) => ({ ...c, service_count: servicesByCategory[c.id].length }));

  const employeesByServiceId: Record<string, (string | number)[]> = {};
  for (const [serviceId, ids] of Object.entries(raw.employeesByServiceId)) {
    if (serviceIds.has(serviceId)) employeesByServiceId[serviceId] = ids.filter((id) => employeeIds.has(String(id)));
  }

  const resursi = raw.resursi.filter((r) => String(r.lokacija_id ?? mainId) === locationId);
  const resourceIds = new Set(resursi.map((r) => r.id));
  const storitveResursiMap: Record<string, number[]> = {};
  for (const [serviceId, ids] of Object.entries(raw.storitveResursiMap)) {
    storitveResursiMap[serviceId] = ids.filter((id) => resourceIds.has(id));
  }

  return { employeesUI, categories, services, servicesByCategory, employeesByServiceId, resursi, storitveResursiMap };
}

export const LOCATION_TEXT = {
  sl: {
    title: 'Izberite lokacijo',
    subtitle: 'Kje želite opraviti storitev?',
    label: 'Lokacija',
    change: 'Spremeni',
    call: 'Tel.',
  },
  en: {
    title: 'Choose a location',
    subtitle: 'Where would you like your appointment?',
    label: 'Location',
    change: 'Change',
    call: 'Tel.',
  },
} as const;

export const locationStorageKey = (companyId: string) => `booking_location_${companyId}`;
