# Copilot Instructions - Jedroplus Booking System

## Project Overview
This is a **Next.js 14 booking system** for salons/service businesses. It's a dynamic multi-step form that collects employee, service, date/time, and customer details. The system integrates with an external n8n webhook API for data and booking submission.

## Architecture

### State Management (Zustand)
- **Single source of truth**: `src/store/bookingStore.ts` using Zustand
- **Booking flow state**: Tracks current step (1-5) and service sub-step (category/service)
- **Selection state**: Maintains selectedEmployee, selectedCategory, selectedService, selectedDate, selectedTime, customerDetails
- **Theme state**: Dynamic theming via CSS variables (primaryColor, secondaryColor, bgFrom, bgTo)
- **Auto-advance pattern**: `selectEmployee()`, `selectService()`, and `selectTime()` automatically call `nextStep()` after selection

### API Integration
- **Base URL**: `https://tikej.app.n8n.cloud/webhook/booking` (in `src/lib/api.ts`)
- **Three main endpoints**:
  1. `action=init&companySlug=X` (GET) - Fetches all business data, categories, services, employees, theme
  2. `action=slots` (POST) - Fetches available time slots for a date/service/employee
  3. `action=create` (POST) - Submits booking, returns confirmation with localized fields (storitev, datum, cas)
- **Note**: API response uses localized field names (e.g., `storitev` = service in Slovenian)

### Component Structure

**Main Flow**:
- `BookingPage.tsx` → renders current step based on store state
- Step components in `src/components/steps/` → each step handles its UI and calls store actions
- **Step progression**: 1→Employee → 2a→Category → 2b→Service → 3→DateTime → 4→CustomerDetails → 5→Confirmation

**Navigation & UI**:
- `NavigationBar.tsx` - Previous/Next buttons (disabled based on step)
- `TimelineStepper.tsx` - Desktop step indicator
- `MobileStepIndicator.tsx` - Mobile step progress
- Framer Motion animations on step transitions (fade + y-axis slide)

## Key Patterns & Conventions

### Store Actions with Side Effects
When adding/modifying store actions that change steps:
```typescript
selectService: (service) => {
  set({ selectedService: service });
  get().nextStep(); // Auto-advance after selection
}
```
This pattern reduces clicks for multi-step flows.

### Theme Customization
- Theme is fetched from API and merged with defaults (DEFAULT_THEME in api.ts)
- Applied via CSS variables in `BookingPage.tsx` useEffect:
  ```tsx
  document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
  ```
- Components reference theme via Zustand: `style={{ backgroundColor: theme.primaryColor }}`

### Data Transformation
- `employees` (from API) → `employees_ui` (for display) with initials & labels
- `services` → grouped by `servicesByCategory` (Record<categoryId, Service[]>)
- Always fetch `servicesByCategory` before rendering ServiceSelection

### Sub-Step Pattern (Step 2)
- Step 2 has two sub-states: 'category' and 'service'
- `selectCategory()` changes sub-step and resets selectedService
- `prevStep()` handles going back from service→category within step 2
- See `bookingStore.ts` nextStep/prevStep logic for details

### Slovenian Localization
- UI text in Slovenian (e.g., "Izberi kategorijo", "Nalagam...")
- API response fields use Slovenian names (storitev, datum, cas)
- Error messages localized: "Napaka pri nalaganju", "Poskusi znova"

## Common Tasks

### Adding a New Step
1. Create component in `src/components/steps/NewStep.tsx`
2. Export from `src/components/steps/index.ts`
3. Add import and case in `BookingPage.tsx` renderStep()
4. Update `BookingStep` type in `src/types/index.ts` (currently 1-5)
5. Add navigation logic to store if needed

### Modifying API Calls
- All API functions in `src/lib/api.ts`
- Update `InitResponse`, `SlotsResponse` types in `src/types/index.ts` if response changes
- Remember API uses POST for slots/create, GET for init

### Styling
- Tailwind CSS with custom CSS variables for theme
- Gradient backgrounds: `bg-gradient-to-r from-[var(--bg-from)] to-[var(--bg-to)]`
- Framer Motion animations use `motion.div` with variants for staggered animations
- Mobile-first responsive: `md:` and `lg:` breakpoints

### State Reset
- `useBookingStore.getState().reset()` clears entire booking (used in Confirmation after success)
- For partial resets, directly call `set()` in store

## Build & Development

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint check
```

**Demo entry**: `/booking/elegant-salon` (hardcoded in home page) or navigate to `/booking/[business-slug]`

## Dependencies
- **next@14.2.35** - Framework
- **zustand@5.0.10** - State management
- **framer-motion@12.29.2** - Animations
- **date-fns@4.1.0** - Date utilities
- **lucide-react@0.563.0** - Icons
- **tailwindcss@3.4.1** - Styling
