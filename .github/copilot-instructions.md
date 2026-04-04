# Copilot Instructions - Jedroplus Booking System

## Project Overview
**Next.js 14 multi-theme booking platform** for service businesses (salons, wellness). Dynamic 6-step form (Category→Service→Employee→DateTime→CustomerDetails→Confirmation). Integrates n8n webhook for business data & booking submission. **Key feature**: 5 design themes (elegant, classic, modern, magazine, seasonal/casino) with unified Zustand state + theme-specific UI implementations.

## Core Architecture

### Theme Variant System (Critical Pattern)
This is **NOT a single-layout app**—it's a **multi-variant architecture**:
- **URL structure**: `/booking/[business-slug]/[theme-variant]/` (e.g., `/booking/elegant-salon/elegant/`)
- **5 theme variants** (separate component trees in `src/app/[slug]/`):
  - **Elegant** (`elegant/`) - sidebar layout, serif fonts, minimal animations
  - **Classic** (`classic/`) - gradient background, center-focused, contrast-aware
  - **Modern** (`modern/`) - glassmorphism, computed CSS vars, sleek
  - **Magazine** (`magazine/`) - editorial layout with masthead & progress
  - **Seasonal** (`seasonal/`) - dynamic seasonal themes (spring/summer/autumn/winter), emoji decorations
- **Each theme has**: `page.tsx` (entry), `layout/` (main container), `components/` (steps + UI), `styles/css` file
- **No shared step components**—each theme defines its own (e.g., `ElegantCategorySelection` vs `ModernCategorySelection`)
- **Theming approach**: API returns `theme: { primaryColor, secondaryColor, bgFrom, bgTo }` merged with defaults; CSS variables applied at layout level

### State Management (Zustand)
- **Single global store**: `src/store/bookingStore.ts` (shared across ALL themes)
- **Step state**: `currentStep: 1-6`, with Slovenian-first UI text
- **Selections**: `selectedCategory`, `selectedService`, `selectedEmployeeId`, `selectedDate`, `selectedTime`, `customerDetails`
- **Theme state**: `theme: { primaryColor, secondaryColor, bgFrom, bgTo }`
- **Auto-advance pattern**: `selectEmployee()`, `selectService()`, `selectTime()` call `nextStep()` automatically (reduces clicks)

### API Integration
- **Base**: `https://tikej.app.n8n.cloud/webhook/booking`
- **Endpoints** (in `src/lib/api.ts`):
  1. `GET ?action=init&companySlug=X` → business data, employees, categories, services, theme
  2. `POST action=slots` → time slots for date/service/employee combo
  3. `POST action=create` → submit booking (returns Slovenian fields: `storitev`, `datum`, `čas`)

### Component Structure Per Theme
- **Layout entry**: `[slug]/[theme]/page.tsx` → loads data, renders `[Theme]Layout`
- **Core layout**: `[slug]/[theme]/components/[Theme]Layout.tsx` → handles step rendering, animations, store integration
- **Step components**: `[slug]/[theme]/components/steps/[Theme][StepName].tsx` (e.g., `ElegantCategorySelection.tsx`)
- **UI primitives**: Theme-specific buttons, cards (e.g., `ModernButton.tsx`, `ElegantSidebar.tsx`)
- **Shared state access**: All components use `useBookingStore()` hook

## Key Patterns & Conventions

### Theme-Specific Implementation (Most Important Pattern)
When adding features, you **must implement per theme**:
```
Feature added to Modern theme? → Copy logic to Elegant, Classic, Magazine, Seasonal with their own styling
```
Example: If adding a "save for later" button:
- Create `ModernSaveButton.tsx` in `src/app/[slug]/modern/components/`
- Copy structure to `elegant/components/ElegantSaveButton.tsx`, etc.
- Each theme's button uses its own fonts (`var(--font-inter)` for Modern, `var(--font-playfair)` for Elegant)

### CSS Variables Per Theme
Each theme computes its own CSS var set:
- **Modern**: `--t-primary`, `--s1`, `--s2`, `--header-bg`, etc. (computed from hex colors via `hexToRgb()` + `luminance()` in `ModernLayout.tsx`)
- **Elegant**: Simple override of primary/secondary colors
- **Classic**: Uses API theme (bgFrom, bgTo) directly
- **Seasonal**: Dynamically computed from `SeasonDetector.ts` (spring/summer/autumn/winter configs)
- **Magazine**: Minimal vars, relies on API theme colors

### Store Actions with Auto-Advance (Zustand Pattern)
```typescript
selectService: (service) => {
  set({ selectedService: service });
  get().nextStep(); // Auto-advance immediately
}
```
Used for: `selectEmployee()`, `selectService()`, `selectTime()`. Reduces step-by-step clicks for UX.

### Data Transformation Pipeline
1. **Init fetch** → API returns `employees`, `services`, `servicesByCategory` (grouped by category ID)
2. **Transform employees** → `employees_ui`: map to `{ id, label, subtitle, initials }` (initials for avatar display)
3. **Store grouping**: `servicesByCategory: Record<categoryId, Service[]>` populated via `setServicesByCategory()`
4. **Always check**: Before rendering service selection, verify `servicesByCategory` is populated

### Localization (Slovenian Primary)
- All UI strings are in Slovenian (e.g., "Izberi kategorijo", "Nalagam...")
- API response fields: `storitev` (service), `datum` (date), `čas` (time)
- Error messages: "Napaka pri nalaganju", "Poskusi znova"
- Date formatting: Use `date-fns` with `sl` locale for Slovenian: `format(date, 'dd. MMMM yyyy', { locale: sl })`

## Common Tasks

### Adding a Feature Across All Themes
1. **Plan the implementation**: Sketch feature in one theme (recommend: Modern, most advanced)
2. **Per-theme implementation**:
   - Implement in `[slug]/modern/components/[Feature].tsx`
   - Copy to `elegant/`, `classic/`, `magazine/`, `seasonal/` with theme-specific styling
   - Each uses its own fonts, colors, animations (see CSS variables section)
3. **Shared logic**: If feature touches store, add action to `src/store/bookingStore.ts` (used by all themes)
4. **Test**: Visit `/booking/[slug]/modern/`, then each variant

### Adding a New Step
1. Add `BookingStep` type update in `src/types/index.ts` (e.g., from `1-6` to `1-7`)
2. Add store state/actions in `src/store/bookingStore.ts` for new data
3. **Per theme**:
   - Create `[slug]/[theme]/components/steps/[Theme]NewStep.tsx`
   - Add case in `[Theme]Layout.tsx` renderStep switch
   - Update step indicators (if any) to reflect new count
4. Verify step progression in `nextStep()` and `prevStep()`

### Modifying API Integration
1. Update types in `src/types/index.ts` (InitResponse, SlotsResponse, etc.)
2. Modify `src/lib/api.ts` functions (fetchInitData, fetchTimeSlots, submitBooking)
3. Add corresponding store actions if new data type
4. Test with real API: start dev server and verify network calls

### Styling & Animations
- **Tailwind classes**: Mobile-first (`md:`, `lg:` breakpoints)
- **Framer Motion**: `motion.div` with `variants` for coordinated animations across steps
- **Theme colors**: Reference via Zustand `theme.primaryColor` or CSS variables `var(--s1)`, `var(--t-primary)`
- **Gradient backgrounds**: `bg-gradient-to-r from-[var(--bg-from)] to-[var(--bg-to)]`
- **Responsive fonts**: Themes use `var(--font-*)` CSS custom properties for consistent typography

### State Reset
- Full reset: `useBookingStore.getState().reset()` (clears all selections, used after successful booking)
- Partial reset: Call `set()` directly in store for specific fields (e.g., `selectedService`)

### Seasonal Theme Special Cases
- Uses `SeasonDetector.ts` to determine current season (spring/summer/autumn/winter)
- Each season has distinct colors (primary, secondary, bg gradients) + emoji decorations
- Components accept `seasonalTheme: SeasonalTheme` prop to apply season-specific styling
- See `SeasonalLayout.tsx` for how season determines decorations and color palette

## Build & Development

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint check
```

**Entry points**:
- Home page: `localhost:3000/` (shows demo links)
- Demo booking (elegant theme): `localhost:3000/booking/elegant-salon/elegant`
- Other themes: `/booking/elegant-salon/{classic|modern|magazine|seasonal}`

**Key development workflow**:
1. Start dev server: `npm run dev`
2. Navigate to theme variant URL
3. Open DevTools Network tab to inspect API calls
4. Zustand store state accessible via browser DevTools extension
5. HMR applies changes instantly (except Store mutations sometimes require page refresh)

## Dependencies
- **next@14.2.35** - Framework with dynamic routing
- **zustand@5.0.10** - State management (single store shared across all themes)
- **framer-motion@12.29.2** - Animations (page transitions, button interactions, seasonal effects)
- **date-fns@4.1.0** - Date utilities (Slovenian locale support via `sl` import)
- **lucide-react@0.563.0** - Icons (consistent across themes)
- **tailwindcss@3.4.1** - Styling (mobile-first, CSS variables for theming)
- **zod@4.3.6** - Validation (booking form validation)

## Project File Structure
```
src/
├── app/
│   ├── page.tsx                    # Home page with demo links
│   └── [slug]/                     # Dynamic business slug
│       ├── page.tsx                # Redirect/routing
│       ├── elegant/page.tsx        # Elegant theme entry (loads ElegantLayout)
│       ├── classic/page.tsx        # Classic theme entry
│       ├── modern/page.tsx         # Modern theme entry
│       ├── magazine/page.tsx       # Magazine theme entry
│       ├── seasonal/page.tsx       # Seasonal theme entry
│       └── casino/page.tsx         # Casino theme entry (bonus)
├── store/
│   └── bookingStore.ts             # Single Zustand store (all themes use this)
├── lib/
│   ├── api.ts                      # n8n webhook API calls
│   └── validations/booking.ts      # Zod schemas
└── types/
    └── index.ts                    # Shared types (Theme, Employee, Service, etc.)
```

## Important Notes

### Multi-Theme Discipline
- **NEVER** share step components across themes (no `shared/CategorySelection.tsx`)
- Each theme's `[Theme]Layout.tsx` owns its entire step rendering logic
- API & state management (`bookingStore.ts`) are shared—component trees are NOT

### API Response Handling
- `fetchInitData()` merges API response with `DEFAULT_THEME` (see `api.ts`)
- Response includes `servicesByCategory: Record<categoryId, Service[]>` (pre-grouped)
- Confirmation response contains Slovenian fields: `storitev`, `datum`, `čas` (not English)

### Browser Compatibility
- Assumes modern browser (CSS variables, Framer Motion, ES2020)
- Mobile-first responsive design: test at `375px` (iPhone) and `768px` (tablet)

### Common Gotchas
1. **Forgot to apply style to a theme**: Feature looks broken in Classic but works in Modern—check per-theme styling
2. **Forgot per-theme implementation**: Added button to Modern, forgot Elegant—other themes missing the feature
3. **Store state not updating UI**: Use `useBookingStore()` hook; direct `bookingStore.getState()` for actions only
4. **API returns null/undefined for theme**: Handled by `DEFAULT_THEME` merge in `fetchInitData()`
5. **Date formatting wrong locale**: Must use `import { sl } from 'date-fns/locale'` and pass `locale: sl` to `format()`
