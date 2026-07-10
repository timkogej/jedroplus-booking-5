## 1. INIT

`fetchInitData(companySlug)` posts to `NEXT_PUBLIC_N8N_BOOKING_URL` or `https://n8n.jedroplus.com/webhook/booking-v2` with:

```ts
{ action: 'init', companySlug }
```

It expects `InitResponse`: `company`, `employees`, `employees_ui`, `services`, `serviceCategories`, `servicesByCategory`, `employeesByServiceId`, `resursi`, `storitveResursiMap`, `ui`, and optional `theme`. `theme` is merged over `DEFAULT_THEME`.

Classic page stores the response via `bookingStore.setInitData(data)`, which sets `company`, `employeesUI`, `categories`, `services`, `servicesByCategory`, `employeesByServiceId`, `resursi`, `storitveResursiMap`, `multipleServicesAllowed`, `prikazZaposlenih`, `maxDniRezervacija`, Stripe config, and `language` from persisted `booking_lang`, then `company.defaultLanguage`, then `sl`.

## 2. SLOTS

`fetchTimeSlotsRange` posts:

```ts
{
  action: 'slots',
  companySlug,
  serviceIds,
  employeeId,
  any_person: anyPerson,
  eligibleEmployeeIds,
  startDate,
  endDate,
  resursiIds? // only when required resources exist
}
```

Classic calls it when date/time step mounts or selected service/employee mode changes. `serviceIds` are selected services, `employeeId` is the selected employee or `null`, `eligibleEmployeeIds` is the intersection of employees that can perform all selected services, and `resursiIds` is `requiredResursiIds`.

Response format:

```ts
{
  slots: {
    'yyyy-MM-dd': string[] | 'fully_booked' | 'unavailable'
  },
  totalDurationMin: number,
  employeeId?: string
}
```

The frontend stores `res.slots` in `bookingStore.slotsMap`. A date is selectable only when `slotsMap[dateKey]` is a non-empty string array. `fully_booked`, `unavailable`, empty arrays, missing keys, or failed slot fetches all behave as no selectable slots.

## 3. PROMOTIONS

After init, Classic calls `fetchActiveDiscounts(company.idPodjetja, serviceIds)` for all init services. It queries Supabase `popusti` and `popusti_storitve`, returns `Record<serviceId, ServicePromotion>`, then Classic enriches each promotion with service `cena`, recalculated `finalCena`, and `popustZnesek`, and stores it with `promotionsStore.setServiceDiscounts`.

On time selection, Classic calls `checkHappyHour(company.idPodjetja, primaryServiceId, selectedDate, time)` only if the primary service has no fixed-period discount. It returns `ServicePromotion | null`; Classic enriches it with primary service price and calls `setActiveHappyHour(hh)` or clears it.

After happy-hour resolution, `computeActivePromotion(primaryServiceId)` sets `activePromotion` to `serviceDiscounts[primaryServiceId] ?? activeHappyHour`; fixed-period `popust` wins over happy hour. Multi-service bookings apply promotions only to the primary service.

On time selection, if `selectedEmployeeId` and primary service exist, Classic calls `fetchAvailableAddOns(company.idPodjetja, primaryServiceId, selectedEmployeeId, selectedDate, endTime, services)`. It returns `AddOnOption[]` after checking active add-ons, employee service capability, and appointment conflicts after the main booking end time. The list is stored with `setAvailableAddOns`; user selection is stored as `selectedAddOn` through `selectAddOn(addOn | null)`.

## 4. SUBMIT

Classic confirmation posts directly to n8n with `action: 'create'`. Exact body shape currently built:

```ts
{
  action: 'create',
  companySlug,
  date: format(selectedDate, 'yyyy-MM-dd'),
  time: selectedTime,
  serviceIds: services.map((s) => s.id),
  employeeId: selectedEmployeeId,
  any_person: anyPerson,
  eligibleEmployeeIds,
  resursiIds: requiredResursiIds,

  firstName: customerDetails.firstName,
  lastName: customerDetails.lastName,
  email: customerDetails.email,
  phone: customerDetails.phone,
  gender: customerDetails.gender ?? '',
  notes: customerDetails.notes ?? '',

  privacy_consent: customerDetails.privacyConsent ?? false,
  marketing_consent: customerDetails.gdprSendMarketing ?? false,
  consent_timestamp: new Date().toISOString(),
  language
}
```

When `activePromotion` exists, these fields are added:

```ts
{
  promocijaTip: activePromotion.type, // 'popust' | 'happy_hour'
  promocijaNaziv: activePromotion.naziv ?? null,
  popust: activePromotion.popustZnesek,
  finalCena: activePromotion.finalCena,
  originalCena: baseTotalPrice,
  popust_id: activePromotion.id,      // only when type === 'popust'
  happy_hour_id: activePromotion.id   // only when type === 'happy_hour'
}
```

When `selectedAddOn` exists, these fields are added:

```ts
{
  addOnServiceId: selectedAddOn.id,
  addOnNaziv: selectedAddOn.naziv ?? null,
  addOnOriginalCena: selectedAddOn.originalCena
}
```

`BookingSubmission` also defines optional `stripe_payment_intent_id?: string | null`, but the Classic first create call does not send it. Current Classic payment flow creates the appointment first, then redirects to POS/Stripe; final payment confirmation is handled server-side by POS webhook.

## 5. PAYMENT

n8n create response is parsed as `BookingConfirmation`. If `requiresPayment === true`, Classic treats the created appointment as pending payment and calls `redirectToCheckout`.

Checkout payload sent to POS `/api/stripe/checkout`:

```ts
{
  companySlug,
  appointmentId: String(confirmation.terminRowId ?? confirmation.terminId ?? ''),
  amount: confirmation.paymentAmount ?? finalPrice,
  currency: confirmation.currency ?? 'EUR',
  serviceName: confirmation.storitev || services.map((s) => s.naziv).join(' + '),
  customerEmail: customerDetails.email,
  customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
  language,
  paymentMode: confirmation.paymentMode ?? 'full',
  successUrl,
  cancelUrl
}
```

`successUrl` is absolute: `/{slug}/classic/success?lang={language}&service={serviceName}&date={confirmation.datum || displayDate}&time={confirmation.cas || selectedTime}`. Stripe/POS may append `session_id`. `cancelUrl` is absolute: `/{slug}/classic`.

The success page reads query params `session_id`, `status=cancelled`, `lang`, `service`, `date`, and `time`. It does not confirm the booking itself; POS confirms payment server-side via Stripe webhook.

## 6. STORE STATE

`currentStep`: booking flow step; `1-6` standard flow, `7` legacy/incomplete payment step.

`company`: init company config used for IDs, booking limits, employee visibility, Stripe config, currency, and default language.

`employeesUI`, `categories`, `services`, `servicesByCategory`, `employeesByServiceId`: init data used to select category/service/employee and compute eligibility.

`resursi`, `storitveResursiMap`, `requiredResursiIds`: init resources and selected-service resource requirements sent to slots/create for capacity checks.

`selectedServices`, `selectedService`, `selectedCategory`, `selectedEmployeeId`, `anyPerson`, `selectedDate`, `selectedTime`, `customerDetails`: current booking selections used to build slots and create payloads.

`eligibleEmployeeIds`: intersection of employees that can perform all selected services; sent on slots/create and used when `any_person` is true.

`multipleServicesAllowed`: from `company.multiple_services_online`; controls whether selection replaces one service or allows up to 3 services.

`noEmployeeForCombination`: true when multiple selected services have no common eligible employee; used to block invalid combinations.

`totalDurationMin`: sum of selected service durations; used for timing/add-on end-time calculations.

`slotsMap`: map of `yyyy-MM-dd` to `DaySlots`; drives selectable dates and available times.

`isLoadingSlots`, `isLoading`, `isSubmitting`: async state for slots, init, and create request.

`language`: persisted to `localStorage.booking_lang`; sent to n8n and POS and used in success URL.

`stripeEnabled`, `stripePaymentMode`, `stripeDepositPercent`: init Stripe config from company. Classic currently uses create response payment fields for checkout.

`stripePaymentInfo`: store slot for old step-7 payment implementation; not used by current Classic Checkout redirect.

`prikazZaposlenih`: from company; when false, employee selection can be skipped and bookings use `any_person`.

`maxDniRezervacija`: number of days ahead to generate/fetch in the date range.

`bookingConfirmation`: local non-payment success state shown after create when no payment is required.
