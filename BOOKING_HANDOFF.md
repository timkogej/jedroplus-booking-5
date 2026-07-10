# JEDROPLUS BOOKING SYSTEM — COMPLETE HANDOFF

> **Purpose:** This document is a full technical audit of the Jedroplus Booking 5 frontend codebase. It is intended to serve as the foundation for a major rebuild/upgrade. All information was extracted by reading actual source files on 2026-05-31.

---

## 1. Project Structure

### Root

```
Jedroplus-booking-5/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout — loads global fonts + globals.css
│   │   ├── page.tsx                   # Root page (unused / placeholder)
│   │   ├── globals.css                # Global Tailwind + CSS variables + scrollbar styles
│   │   └── [slug]/                    # Dynamic route: /[slug]/[variant]
│   │       ├── page.tsx               # Default variant page (uses BookingPage component)
│   │       ├── classic/               # Classic variant
│   │       ├── elegant/               # Elegant variant
│   │       ├── modern/                # Modern variant
│   │       ├── magazine/              # Magazine variant
│   │       ├── casino/                # Casino (Monte Carlo) variant
│   │       └── seasonal/              # Seasonal variant (auto-detects holiday/season)
│   ├── components/
│   │   ├── BookingPage.tsx            # Default booking UI (used by [slug]/page.tsx)
│   │   ├── TimelineStepper.tsx        # Desktop left-side step timeline
│   │   ├── MobileStepIndicator.tsx    # Mobile step bar
│   │   ├── NavigationBar.tsx          # Mobile fixed bottom nav
│   │   ├── shared/
│   │   │   ├── PromotionBadge.tsx     # Reusable badge: shows discount or happy-hour
│   │   │   └── AddOnSelector.tsx      # Add-on service picker (used in CustomerDetails)
│   │   └── steps/
│   │       ├── index.ts               # Re-exports all default step components
│   │       ├── CategorySelection.tsx
│   │       ├── ServiceSelection.tsx
│   │       ├── EmployeeSelection.tsx
│   │       ├── DateTimeSelection.tsx
│   │       ├── CustomerDetails.tsx
│   │       └── Confirmation.tsx
│   ├── store/
│   │   ├── bookingStore.ts            # Main Zustand store — all booking state
│   │   └── promotionsStore.ts         # Promotions Zustand store
│   ├── lib/
│   │   ├── api.ts                     # Main n8n webhook API functions
│   │   ├── promotionsApi.ts           # Supabase-direct promotions/add-on API
│   │   └── validations/
│   │       └── booking.ts             # Zod schema + honeypot + sanitize utils
│   ├── hooks/
│   │   └── useSecureBooking.ts        # Secure booking hook (honeypot + validation)
│   └── types/
│       └── index.ts                   # All TypeScript types/interfaces
├── .env.example                       # Env var reference
├── .env.local                         # Active env vars (not in git)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

### Variant folder pattern (all 6 follow the same structure)

```
[variant]/
├── layout.tsx                         # Loads variant-specific Google Fonts + variant CSS
├── page.tsx                           # Fetches init data, loads promotions, renders Layout
├── styles/[variant].css               # Variant-specific CSS utilities/classes
└── components/
    ├── [Variant]Layout.tsx            # Main shell: header, stepper, step switcher
    ├── [Variant]SummaryCard.tsx       # Desktop booking summary sidebar (classic/elegant)
    ├── [Variant]Sidebar.tsx           # Left nav sidebar (elegant)
    ├── [Variant]Header.tsx            # Top header component (modern, seasonal)
    └── steps/
        ├── [Variant]ServiceSelection.tsx     # Steps 1+2 combined
        ├── [Variant]EmployeeSelection.tsx    # Step 3
        ├── [Variant]DateTimeSelection.tsx    # Step 4
        ├── [Variant]CustomerDetails.tsx      # Step 5
        └── [Variant]Confirmation.tsx         # Step 6 (pre-submit + success)
```

---

## 2. Variant Design Documentation

### 2.1 Classic

**URL pattern:** `/{slug}/classic`

**Fonts:**
- `--font-nunito`: Nunito (weights 400/500/600/700/800) — headings, buttons, prices
- `--font-nunito-sans`: Nunito Sans (weights 400/500/600/700) — body, labels, inputs

**Background:**
- Gradient applied to full page: `linear-gradient(135deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`
- Default: `bgFrom: #7C3AED`, `bgTo: #4F46E5` (purple gradient)
- Background adapts to company theme via API
- **Contrast detection**: `getContrastMode()` function computes average luminance of bgFrom+bgTo, returns `'light'` (dark bg → white text) or `'dark'` (light bg → dark text)

**Text colors (contrast-adaptive):**
- Light mode (dark bg): textPrimary `rgba(255,255,255,0.95)`, textSecondary `rgba(255,255,255,0.65)`
- Dark mode (light bg): textPrimary `rgba(0,0,0,0.9)`, textSecondary `rgba(0,0,0,0.55)`

**Cards:**
- Service cards, employee cards: `background: rgba(255,255,255,0.97)`, border 2px solid transparent (or primaryColor when selected), `border-radius: 1rem (rounded-2xl)`, `box-shadow: 0 2px 12px rgba(0,0,0,0.06)`
- Selected state adds: `border: 2px solid ${primaryColor}`, `box-shadow: 0 8px 28px ${primaryColor}25`
- Hover: `scale(1.01)`, elevated shadow

**Stepper (top):**
- Horizontal row: 4 visual steps (Storitev, Oseba, Termin, Podatki)
- Active step: pulsing scale animation, primaryColor background, 3px glow ring
- Done step: `✓` checkmark, primaryColor fill
- Connector lines 36px wide, `h-0.5`, primaryColor when done

**Date picker:**
- Horizontal scrollable strip of date chips (60 days, `CARD_W = 72px`)
- Left/right arrow nav buttons (`w-9 h-9 rounded-xl`, white with border)
- Selected date chip: `backgroundColor: primaryColor`, scale 1.06, shadow
- Today: `border: 2px solid ${secondaryColor}`
- CSS classes: `.classic-scrollbar-hide`, `.classic-date-chip`, `.classic-date-swiper`

**Time slots:**
- White card container `rounded-2xl overflow-hidden`
- Mobile: single centered column (scrollable, `max-h: 18rem`), `max-width: 220px` per slot
- Desktop: 4-column grid
- Selected slot: `backgroundColor: primaryColor`, white text
- Loading state: shimmer placeholders

**Form inputs:**
- Inline `ClassicInput` component: white bg, 2px border (gray → primaryColor on focus), `rounded-xl`, focus ring `0 0 0 3px ${primaryColor}20`

**Desktop summary card:**
- Right sidebar, `width: 280px`, sticky, white glass card with primary accent gradient header
- Shows: employee, service name+price+duration, dateTime, customer name

**Animations:**
- Page transitions: `opacity 0→1, x: 20→0` (enter), `x: 0→-20` (exit)
- Framer Motion `AnimatePresence mode="wait"`

**UI style:** Rounded, friendly, card-forward. Semi-transparent white cards on a branded gradient background. Clean sans-serif typography.

---

### 2.2 Elegant

**URL pattern:** `/{slug}/elegant`

**Fonts:**
- `--font-playfair`: Playfair Display (weights 400/500/600) — company name, step headings
- `--font-inter`: Inter (weights 400/500/600) — all body text, labels, inputs, buttons

**Background:**
- `linear-gradient(180deg, ${theme.bgFrom}06 0%, #ffffff 15%, #ffffff 85%, ${theme.bgTo}04 100%)`
- Effectively: near-white, with very subtle brand color tint at top and bottom edges
- Always light background regardless of API theme colors

**Layout: Two-panel (sidebar + main)**
- Left sidebar: `width: 240px`, `border-r: #F3F4F6`, `background: implied white`
  - Company name in Playfair Display 1.1rem
  - `ElegantSidebar` nav with 5 steps: Storitev, Specialist, Datum in ura, Podatki, Potrditev
  - Each step has circle indicator (outline → filled gradient), connecting line, and value preview when done
- Right main area: flex-1, scrollable
- On mobile: sidebar hidden, mobile pill dots shown in header

**Mobile header:**
- Company name (Playfair, 1rem) + pill step dots (active pill is 18px wide, gradient)
- Back button + step label (desktop only)

**Step indicator (mobile):**
- 5 dots: active pill 18px wide with gradient; done dot with primaryColor; pending dot `#E5E7EB`

**Cards:**
- Service cards: white bg `#ffffff`, `border: 1px solid #E5E7EB`, `border-radius: 0.75rem (rounded-xl)`, hover lift shadow
- Selected: primaryColor border + soft primaryColor background tint
- Clean, minimal, no heavy shadows

**Date picker:**
- Full month calendar grid (not a horizontal strip)
- `.elegant-cal-day`: 2.5rem circles
- `.elegant-date-strip` for mobile strip view (scrollbar-hidden)
- Selected day: `background: primaryColor`, white text
- Today: highlighted border

**Form inputs:**
- `.elegant-input` CSS class: white bg, `border: 1px solid #E5E7EB`, `border-radius: 0.5rem`, `outline: none`
- Focus: `box-shadow: 0 0 0 3px rgba(0,0,0,0.04)`, borderColor → primaryColor (inline style)
- `.elegant-input.error`: `border-color: #EF4444`

**Animations:**
- Page transition: `opacity 0→1, y: 10→0` (enter), `y: 0→-8` (exit), 300ms

**UI style:** Minimal, editorial, luxury spa feel. White space dominant. Playfair serif headings. No gradients on cards. Professional and calm.

---

### 2.3 Modern

**URL pattern:** `/{slug}/modern`

**Fonts:**
- `--font-inter`: Inter (weights 400/500/600/700) — body, inputs, labels
- `--font-dm-sans`: DM Sans (weights 400/500/600/700) — headings, step titles

**Background:**
- `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`
- Two animated floating orbs (CSS keyframe animations, compositor thread):
  - Orb 1: `600px × 600px`, `blur-3xl`, `opacity: 0.25`, top-left, animates with `modernOrbFloat1` (22s loop)
  - Orb 2: `450px × 450px`, `blur-3xl`, `opacity: 0.18`, bottom-right, animates with `modernOrbFloat2` (28s loop)

**CSS variable system (computed from theme):**
- All colors expressed as CSS custom properties (`--t-primary`, `--t-soft`, `--t-muted`, `--t-faint`, `--t-disabled`, `--s1`–`--s3`, `--b1`–`--b3`, `--header-bg`, `--nav-bg`)
- Light bg → dark text vars; Dark bg → white text vars
- Components use `var(--t-primary)`, `var(--s2)`, etc. throughout

**Layout:**
- Single-column, centered `max-w-2xl` content
- `ModernHeader` component at top: company name, step count, progress bar, back button
- Main: scrollable `flex-1`

**Cards:**
- `.modern-glass` class: `backdrop-filter: blur(12px)`
- Service cards: `background: var(--s2)`, `border: 1px solid var(--b2)`, `border-radius: 0.75rem`
- Selected: primaryColor border + `var(--s2h)` bg
- `.modern-gradient-text` utility for gradient text effects

**Date picker:**
- Full month calendar grid (`.modern-cal-day`: 2.25rem circles)
- Selected: `background: primaryColor`
- Today: border highlight

**Form inputs:**
- `.modern-input` CSS class: `border: 1px solid var(--b2)`, `background: var(--s1)`, `border-radius: 0.75rem`
- Focus: `background: var(--s2)`, borderColor → primaryColor
- `.modern-input.error`: red border + red shadow

**Loading spinner:**
- `.modern-loading-arc`: conic gradient arc (no ring background), masked to 2px arc only
- Colors: `#7C3AED → #3B82F6 → #06B6D4`

**Animations:**
- Page transition: `opacity 0→1, y: 12→0`, `ease: [0.25, 0.46, 0.45, 0.94]`, 220ms

**UI style:** Dark glassmorphism. Floating gradient orbs on animated background. Sleek tech/SaaS feel. DM Sans headings. Minimal borders, translucent surfaces.

---

### 2.4 Magazine

**URL pattern:** `/{slug}/magazine`

**Fonts:**
- `--font-playfair`: Playfair Display (weights 400/500/600, normal+italic) — serif headings, decorative text
- `--font-source-serif`: Source Serif 4 (weights 400/600, normal+italic) — body text

**CSS utility classes:**
- `.magazine-serif`: Playfair Display font
- `.magazine-body`: Source Serif 4 font
- `.magazine-caps`: Playfair, uppercase, `letter-spacing: 0.12em`, 0.7rem — used for labels
- `.pull-quote-mark`: 5rem serif `"` character, 12% opacity, primaryColor — decorative
- `.toc-dots`: dotted separator line for table-of-contents style layouts
- `.mag-underline`: animated underline on hover (CSS transition)
- `.mag-input-wrap`: animated underline on focus-within

**Background:**
- Cream/off-white: `bg-[#FAFAF9]`
- CSS vars: `--mag-primary`, `--mag-secondary`, `--mag-bg-from`, `--mag-bg-to` set from API theme

**Color palette:**
- Background: `#FAFAF9` (warm cream)
- Text: `#1A1A1A` (near-black)
- Muted: `#6B6B6B`
- Border: `rgba(0,0,0,0.1)`

**Layout:**
- `MagazineLayout.tsx` (not fully read, follows same 6-step pattern)
- Uses `MagazineMasthead` and `MagazineProgress` components
- Editorial aesthetic with pull-quotes, dotted TOC lines

**Date picker:**
- Full month calendar via `MagazineCalendar.tsx` UI component

**Form inputs:**
- `MagazineInput.tsx` UI component — underline style (no border box, only bottom border that animates on focus)

**Confirmation:**
- Animated SVG check (`.check-path`, `.circle-path` drawn via CSS keyframes)
- Confetti particles via `.confetti-particle` CSS class

**Animations:**
- Shimmer skeleton: `.mag-skeleton` — gradient sweep animation
- Radiate rings: `.radiate-ring` — scale+fade-out for success effect

**UI style:** Editorial print magazine. Cream background. All-serif typography. Uppercase labels with wide letter-spacing. Subtle decorative elements (pull-quotes, TOC dots). Restrained color palette.

---

### 2.5 Casino (Monte Carlo)

**URL pattern:** `/{slug}/casino`

**Fonts:**
- `--font-playfair`: Playfair Display (weights 400/700/900, normal+italic) — headings, company name
- `--font-cormorant`: Cormorant Garamond (weights 300/400/500/600, normal+italic) — body, summaries
- `--font-oswald`: Oswald (weights 400/500/600) — labels, uppercase caps, buttons, step indicators

**Background:**
- `.mc-bg` CSS class — layered felt texture:
  - Base color: `#060f08` (very dark green-black)
  - `repeating-linear-gradient(45deg)` — gold diagonal hatch at 0.8% opacity
  - `repeating-linear-gradient(-45deg)` — cross-hatch at 0.5% opacity
  - Radial glows at 20%/80% positions: dark casino felt green `#0d3b1e`
  - Final radial: `#0d3b1e → #060f08`
- Overall: dark green casino felt with subtle gold texture

**CSS color variables:**
```css
--mc-bg-primary: #060f08   (deep black-green)
--mc-felt-dark:  #0d3b1e
--mc-felt-mid:   #145228
--mc-felt-light: #1a6b35
--mc-gold:       #c9a84c
--mc-gold-light: #e8c96d
--mc-gold-dark:  #a07830
--mc-cream:      #f5edd6
--mc-cream-muted:#e8d9b8
--mc-muted-gold: #a89060
```

**Decorative elements (fixed positioned, `pointer-events-none z-0`):**
- `RouletteDecoration`: large 380px circle top-right, slowly rotates (60s CSS animation), gold concentric ring strokes
- `CardSuitsDecoration`: 3 fixed large card suit symbols (♣ ♥ ♠), 160px, `rgba(201,168,76,0.025)` — barely visible

**Cards (`.mc-card`):**
- `background: rgba(10, 40, 20, 0.85)` — semi-transparent casino felt
- `backdrop-filter: blur(8px)`
- `border: 1px solid rgba(201, 168, 76, 0.25)` — gold border
- `border-radius: 10px`
- Hover: border brightens to 0.5, translateY(-3px), box-shadow adds gold glow
- Selected: border 0.8 opacity, inner gold glow

**Buttons:**
- `.mc-btn-gold`: hexagonal clip-path `polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, ...)`, gold gradient background (`#a07830 → #c9a84c → #e8c96d`), animated shimmer, Oswald font, uppercase
- `.mc-btn-secondary`: transparent + gold border, Oswald font, uppercase

**Inputs:**
- `.mc-input`: transparent background, NO border box — only `border-bottom: 1.5px solid rgba(201,168,76,0.3)`, Cormorant Garamond font (italic), cream text, gold bottom border on focus
- `.mc-textarea`: dark felt-colored background, gold border all sides

**Gold divider (`.mc-divider`):**
- 1px height, gradient: `transparent → gold(0.5) → gold(0.7) → gold(0.5) → transparent`

**Step indicator:**
- 5 dots, active = `width: 28px, height: 8px`, rounded pill, gold gradient background + glow
- Done = `width: 8px`, solid gold
- Pending = `width: 6px`, `rgba(201,168,76,0.18)`

**Calendar (`.mc-calendar-day`):**
- Grid squares `aspect-ratio: 1`, `border-radius: 6px`, Oswald font
- Available hover: gold tint bg + border
- Selected: `background: var(--mc-gold)`, near-black text `#060f08`, gold glow

**Time slots (`.mc-time-slot`):**
- `background: rgba(10,40,20,0.6)`, `border: 1px solid rgba(201,168,76,0.25)`, gold text
- Selected: gold background, dark text

**Animations:**
- `mc-shimmer`: button gold shimmer (3s loop)
- `mc-slow-rotate`: roulette decoration (60s loop)
- `mc-pulse-ring`: scale+fade for active elements
- `mc-shake`: error shake effect
- `mc-float`: translateY breathing animation
- `mc-gold-particles`: success particles

**Page transition:**
- `opacity 0→1, y: 18→0, filter: blur(3px)→blur(0px)`, cubic bezier `[0.25, 0.46, 0.45, 0.94]`, 500ms

**Booking summary card:**
- `SlotMachine.tsx` component (the import name is `BookingSummaryCard`) — shown before step content

**UI style:** Monte Carlo casino, private gaming room. Dark green felt background with gold accents everywhere. All text is cream/gold. No bright colors except gold. Hexagonal buttons. Roulette + card suit decorations. Italic Cormorant Garamond body text.

**⚠️ Note:** Casino loading screen uses English text ("Monte Carlo Booking Suite", "Preparing your table…") while all other variants use Slovenian. Error screen also uses English ("Table Unavailable").

---

### 2.6 Seasonal

**URL pattern:** `/{slug}/seasonal`

**Fonts (loaded in layout, all conditional by season):**
- `--font-quicksand`: Quicksand (weights 400/500/600/700) — primary body/UI font
- `--font-playfair`: Playfair Display — used in Valentine + Elegant holiday modes
- `--font-christmas`: Mountains of Christmas — used during Christmas holiday
- `--font-creepster`: Creepster — used during Halloween

**Season detection (`SeasonDetector.ts`):**
Reads `new Date()` and returns a `SeasonalTheme` object. Priority order:

| Date Range | Season | Holiday | Heading Font | accentColor |
|---|---|---|---|---|
| Dec 15–26 | winter | christmas | `--font-christmas` | `#C41E3A` |
| Dec 27 – Jan 5 | winter | newyear | quicksand | `#FFD700` |
| Feb 1–14 | winter | valentine | `--font-playfair` | `#FF69B4` |
| Mar 15 – Apr 15 | spring | easter | quicksand | `#A78BFA` |
| Oct 20–31 | autumn | halloween | `--font-creepster` | `#FF6600` |
| Nov 20–30 | autumn | thanksgiving | quicksand | `#D2691E` |
| Dec/Jan/Feb | winter | null | quicksand | `#87CEEB` |
| Mar–May | spring | null | quicksand | `#4ade80` |
| Jun–Aug | summer | null | quicksand | `#FCD34D` |
| Sep–Nov | autumn | null | quicksand | `#F97316` |

**Background:**
- `linear-gradient(150deg, ${config.bgFrom}, ${config.bgTo})` — from SeasonalTheme config
- All seasonal backgrounds are **dark** (opposite of Elegant)
- Subtle accent glow overlays (fixed positioned radial gradients)

**Card surfaces:**
- CSS variables `--s1`, `--s2`, `--s2h`, `--b2` are set from `config.cardBg`, `config.cardBgAlt`, `config.cardBgHover`, `config.cardBorder`
- Example Christmas: `cardBg: #132216`, `cardBgAlt: #0f1c12`, `cardBgHover: #1a2e1e`

**Decorative animations:**
- `SeasonalDecorations.tsx`: renders appropriate decoration based on season/holiday flags
  - `FallingSnowflakes.tsx`: winter/christmas/newyear
  - `SpringFlowers.tsx`: spring/easter
  - `FallingLeaves.tsx`: autumn/halloween/thanksgiving
  - `SummerElements.tsx`: summer
  - `ChristmasOrnaments.tsx`: christmas
  - `FloatingHearts.tsx`: valentine
  - `EasterElements.tsx`: easter
  - `HalloweenElements.tsx`: halloween
  - `NewYearElements.tsx`: newyear
- `FloatingEmojis.tsx`: floating season-appropriate emojis (22 desktop / 12 mobile)
- `SeasonalSuccessAnimation.tsx`: burst animation on booking success

**Company name display:**
- Large gradient text: `clamp(2.2rem, 8vw, 4.5rem)`, bold, gradient from `primaryColor → secondaryColor`, drop-shadow glow
- Heading font from `config.headingFont` (season-dependent)
- Season pill above: emoji + season name, glass-like pill border

**Step progress:**
- 5-step horizontal row with animated filled circles + connectors
- Active step: pulsing scale animation, full primary color fill + glow
- Done: filled circle with `✓`

**Form inputs:**
- `.seasonal-input`: similar to modern, uses CSS vars `var(--s1)`, `var(--b2)`, `var(--t-primary)`

**Animations:**
- Page transition: `opacity 0→1, y: 16→0`, cubic bezier, 350ms

**Mobile optimization:**
- `isMobile` state tracks `window.innerWidth < 768`
- Decoration count halved on mobile

**UI style:** Highly festive and contextual. Changes appearance 10+ times per year. Dark backgrounds with bright seasonal accents. Animated decorations (snowflakes, leaves, hearts, etc.). Fun, warm, celebratory feel. Always dark theme.

---

## 3. Shared Infrastructure

### 3.1 Zustand Stores

#### `src/store/bookingStore.ts`

**Store name:** `useBookingStore`

**Full state shape:**

```typescript
interface BookingState {
  // Navigation
  currentStep: BookingStep;           // 1|2|3|4|5|6, default: 1

  // Styling
  theme: Theme;                       // default: DEFAULT_THEME from api.ts

  // Company
  company: Company | null;            // default: null

  // Data arrays (populated from fetchInitData)
  employeesUI: EmployeeUI[];          // default: []
  categories: Category[];             // default: []
  services: Service[];                // default: []
  servicesByCategory: Record<string, Service[]>;         // default: {}
  employeesByServiceId: Record<string, (string|number)[]>; // default: {}

  // Selections
  selectedEmployeeId: string | null;  // default: null
  anyPerson: boolean;                 // default: false
  eligibleEmployeeIds: string[];      // default: []
  selectedCategory: Category | null;  // default: null
  selectedService: Service | null;    // default: null
  selectedDate: Date | null;          // default: null
  selectedTime: string | null;        // default: null
  customerDetails: CustomerDetails | null; // default: null

  // Loading states
  isLoading: boolean;                 // default: false
  isSubmitting: boolean;              // default: false

  // Result
  bookingConfirmation: {
    success: boolean;
    message: string;
    storitev: string;
    datum: string;
    cas: string;
  } | null;                           // default: null

  // Actions (setters)
  setTheme: (theme: Theme) => void;
  setCompany: (company: Company) => void;
  setEmployeesUI: (employees: EmployeeUI[]) => void;
  setCategories: (categories: Category[]) => void;
  setServices: (services: Service[]) => void;
  setServicesByCategory: (data: Record<string, Service[]>) => void;
  setEmployeesByServiceId: (data: Record<string, (string|number)[]>) => void;

  // Selection actions (these also call nextStep internally)
  selectEmployee: (employeeId: string | null, isAnyPerson?: boolean) => void;
  selectCategory: (category: Category) => void;
  selectService: (service: Service) => void;
  selectCategoryAndService: (category: Category, service: Service) => void; // skips to step 3
  selectDate: (date: Date) => void;   // resets selectedTime
  selectTime: (time: string) => void; // calls nextStep

  // Navigation
  nextStep: () => void;
  prevStep: () => void;               // step 3 → step 1 (skips 2)
  goToStep: (step: BookingStep) => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setBookingConfirmation: (conf: ...) => void;

  reset: () => void;
}
```

**Key business logic in store:**
- `selectService()`: computes `eligibleEmployeeIds` from `employeesByServiceId`. If no mapping exists, all employees are eligible. Auto-selects employee if only one is eligible.
- `selectCategoryAndService()`: same eligibility computation, skips directly to step 3 (`goToStep(3)`)
- `prevStep()`: step 3 → step 1 (intentionally skips step 2, since steps 1+2 share same component)

#### `src/store/promotionsStore.ts`

**Store name:** `usePromotionsStore`

**Full state shape:**

```typescript
interface PromotionsState {
  serviceDiscounts: Record<string, ServicePromotion>; // keyed by service ID string
  activeHappyHour: ServicePromotion | null;
  activePromotion: ServicePromotion | null;           // computed: discount wins over happy hour
  availableAddOns: AddOnOption[];
  selectedAddOn: AddOnOption | null;
  isLoadingDiscounts: boolean;
  isLoadingAddOns: boolean;

  setServiceDiscounts(discounts: Record<string, ServicePromotion>): void;
  setActiveHappyHour(hh: ServicePromotion | null): void;
  computeActivePromotion(storitevId: string): void;   // sets activePromotion
  setAvailableAddOns(addOns: AddOnOption[]): void;
  selectAddOn(addOn: AddOnOption | null): void;
  setLoadingDiscounts(v: boolean): void;
  setLoadingAddOns(v: boolean): void;
  resetSelections(): void;                            // clears happyHour, activePromotion, addOns
}
```

**Key logic:**
- `computeActivePromotion(storitevId)`: sets `activePromotion = serviceDiscounts[id] ?? activeHappyHour` (service discount takes priority over happy hour)

---

### 3.2 API / Lib Functions

#### `src/lib/api.ts`

**Base URL:** `https://n8n.jedroplus.com/webhook/booking`

**`fetchInitData(companySlug: string): Promise<InitResponse>`**
- Method: `GET`
- URL: `${API_BASE_URL}?action=init&companySlug=${encodeURIComponent(companySlug)}`
- Response: `InitResponse` (see types section)
- Post-processing: merges API theme with `DEFAULT_THEME` (API values override defaults)
- Errors: throws on non-OK HTTP response

**`fetchTimeSlots(companySlug, date, serviceId, employeeId, anyPerson, eligibleEmployeeIds?): Promise<string[]>`**
- Method: `POST`
- URL: `${API_BASE_URL}`
- Payload:
```json
{
  "action": "slots",
  "companySlug": "...",
  "date": "yyyy-MM-dd",
  "serviceId": "...",
  "employeeId": "...",
  "any_person": false,
  "employeeIds": ["..."]    // only when anyPerson=true AND eligibleEmployeeIds provided
}
```
- Response type: `SlotsResponse[]` — array of `{ date: string; slots: string[] }`
- Post-processing: finds entry for requested date, returns `slots` array or `[]`

**`submitBooking(data: BookingSubmission): Promise<BookingConfirmation>`**
- Method: `POST`
- URL: `${API_BASE_URL}`
- Payload (full):
```json
{
  "action": "create",
  "companySlug": "...",
  "date": "yyyy-MM-dd",
  "time": "HH:mm",
  "serviceId": "...",
  "employeeId": "...",
  "any_person": false,
  "employeeIds": ["..."],      // only when anyPerson=true
  "firstName": "...",
  "lastName": "...",
  "customerName": "firstName lastName",
  "customerEmail": "...",
  "customerPhone": "...",
  "customerGender": "...",
  "customerNote": "...",
  "gdprSendMarketing": false,
  "privacy_consent": false,
  "marketing_consent": false,
  "consent_timestamp": "ISO 8601",
  // Promotions fields (sent by Confirmation component, NOT in BookingSubmission type):
  "promocijaTip": "popust|happy_hour",
  "promocijaNaziv": "...",
  "popust": 10.00,
  "finalCena": 45.00,
  // Add-on fields:
  "addOnServiceId": "...",
  "addOnNaziv": "...",
  "addOnOriginalCena": 20.00
}
```
- ⚠️ **Note:** The `BookingSubmission` interface in api.ts does NOT include promotion or add-on fields. These are spread in as extra properties directly in the Confirmation component's `handleConfirm()`. This is a type inconsistency.
- Response handling: empty body → success; non-JSON body → success; JSON → parse
- Fallback success: `{ success: true, message: 'Rezervacija uspešna!' }`

**`DEFAULT_THEME`:**
```typescript
{
  primaryColor: '#8B5CF6',
  secondaryColor: '#A78BFA',
  bgFrom: '#7C3AED',
  bgTo: '#4F46E5',
}
```

#### `src/lib/promotionsApi.ts`

**Supabase direct REST API** (no Supabase SDK, raw `fetch` with anon key headers)

**Environment variables required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Exported types:**

```typescript
interface ServicePromotion {
  storitevId: string;
  type: 'popust' | 'happy_hour';
  naziv: string;
  tipPopusta: 'percentage' | 'fixed';
  vrednost: number;
  originalCena: number;
  finalCena: number;
  popustZnesek: number;
  badgeLabel: string;   // e.g. "-20%" or "-€5.00"
}

interface AddOnOption {
  id: string;
  storitevId: string;
  naziv: string;
  trajanjeMin: number;
  originalCena: number;
  finalCena: number;
  popustZnesek: number;
  tipPopusta: 'percentage' | 'fixed';
  vrednost: number;
  badgeLabel: string;
}
```

**`calculateDiscount(originalCena, tipPopusta, vrednost): { finalCena, popustZnesek }`**
- Internal utility. Used everywhere to compute discounted price.
- `percentage`: `popustZnesek = (originalCena * vrednost) / 100`
- `fixed`: `popustZnesek = vrednost`
- Both: `finalCena = Math.max(0, originalCena - popustZnesek)`

**`fetchActiveDiscounts(companyId, serviceIds[]): Promise<Record<string, ServicePromotion>>`**
1. Fetches `popusti` table: `aktiven=true`, current date between `datum_zacetek` and `datum_konec`
2. Fetches `popusti_storitve` join table for those discount IDs
3. Matches service IDs, builds `ServicePromotion` map
- ⚠️ **Note:** `originalCena` is set to `0` in this function — the page.tsx files enrich it with actual service prices after calling this function

**`checkHappyHour(companyId, storitevId, date, time): Promise<ServicePromotion | null>`**
1. Fetches `happy_hours` table: `aktiven=true`, for companyId
2. Filters by `dnevi_v_tednu` (day of week array) and `cas_zacetek`/`cas_konec` time range
3. For matches: if `hh.vse_storitve=true` → applies to all; else checks `happy_hours_storitve` join table
- ⚠️ **Note:** `originalCena` also set to `0` here; enriched by caller

**`fetchAvailableAddOns(companyId, mainStoritevId, employeeId, date, endTime, allServices[]): Promise<AddOnOption[]>`**
1. Fetches `add_on_storitve` table: `aktiven=true`, for companyId
2. Fetches employee services from `Osebe` table (`Storitve` column, JSON-parsed)
3. Fetches existing appointments from `Termini` table for that employee on that date (`Čas`, `Konec` columns)
4. For each add-on: checks if employee can do it, computes end time, checks for conflicts
5. Returns eligible add-ons with discounted prices

---

#### `src/lib/validations/booking.ts`

**`bookingFormSchema`** (Zod v4):
```typescript
z.object({
  ime: z.string().min(2).max(50),
  priimek: z.string().min(2).max(50).optional(),
  email: z.string().email().refine(!isBlockedEmailDomain),
  telefon: z.string().optional(),
  datum: z.string().optional(),
  cas: z.string().optional(),
  storitev_id: z.string().optional(),
  zaposleni_id: z.string().optional(),
  opombe: z.string().max(500).optional(),
  website: z.string().max(0).optional(),   // honeypot field
})
```

Blocked email domains: `tempmail.com`, `guerrillamail.com`, `10minutemail.com`, `mailinator.com`, `yopmail.com`, `fakeinbox.com`

**`validateBookingForm(data: unknown)`:** Returns `{ success, errors? }` or `{ success: true, data }`

**`isHoneypotFilled(data: { website?: string }): boolean`:** Returns true if honeypot `website` field has content → silently treat as success (no actual submission)

**`sanitizeInput(text: string): string`:** Strips HTML tags `<>`, trims, slices to 2000 chars

#### `src/hooks/useSecureBooking.ts`

**⚠️ Note:** This hook validates and sanitizes but does NOT actually submit to the API. The `submitBooking` try block just sets `isSuccess = true` and calls `onSuccess()`. The actual API submission is done directly in the Confirmation component using `submitBooking` from `api.ts`. The hook is used in `CustomerDetails` components to validate form data before advancing to the confirmation step.

---

### 3.3 API Routes

**No Next.js API routes exist** (`src/app/api/` directory does not exist).

All backend communication goes through:
1. n8n webhooks (via `src/lib/api.ts`)
2. Supabase REST API directly (via `src/lib/promotionsApi.ts`)

---

### 3.4 Environment Variables

**File:** `.env.example` (actual values in `.env.local`, not committed)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xdudtawctybnphdpvlwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Used in code:**
- `NEXT_PUBLIC_SUPABASE_URL`: used in `promotionsApi.ts` for Supabase REST calls
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: used as `apikey` + `Authorization: Bearer` header in Supabase REST calls

**⚠️ Note:** There are NO environment variables for the n8n webhook URL — it is hardcoded as `'https://n8n.jedroplus.com/webhook/booking'` in `src/lib/api.ts`.

🔄 **For rebuild:** The n8n URL should be moved to an environment variable.

---

## 4. Current Booking Flow

The 6-step flow is identical across all variants. Store steps (1–6) map to visual steps differently per variant (Classic/Elegant/Modern/Casino/Seasonal collapse steps 1+2 into one visual step).

### Step Mapping (Store → Visual)

| Store Step | Screen Shows | Visual Step # |
|---|---|---|
| 1 | CategorySelection (or combined Service+Cat) | 1 |
| 2 | ServiceSelection (or continues step 1 UI) | 1 |
| 3 | EmployeeSelection | 2 |
| 4 | DateTimeSelection | 3 |
| 5 | CustomerDetails | 4 |
| 6 | Confirmation | 5 |

### On page load

1. Component mounts (`page.tsx` for each variant)
2. `fetchInitData(slug)` is called — GET to `https://n8n.jedroplus.com/webhook/booking?action=init&companySlug={slug}`
3. Response hydrates Zustand store: theme, company, employees_ui, categories, services, servicesByCategory, employeesByServiceId
4. `fetchActiveDiscounts(company.idPodjetja, serviceIds[])` is called (Supabase REST)
5. Discounts are enriched with actual service prices and stored in `promotionsStore`
6. After 300–400ms delay, `hasLoaded = true` → renders variant Layout
7. Theme CSS variables applied to `document.documentElement`

### Step 1+2: Service Selection (`[Variant]ServiceSelection`)

- **Data shown:** All categories with their services, grouped
- **Source:** `useBookingStore.categories`, `useBookingStore.servicesByCategory`
- **Promotion badges:** `usePromotionsStore.serviceDiscounts[serviceId]` — shown on each service card
- **On click:** `store.selectCategoryAndService(category, service)` → computes eligible employees → `goToStep(3)` (skips step 2)
- **No API call at this step**

### Step 3: Employee Selection (`[Variant]EmployeeSelection`)

- **Data shown:** Filtered list of employees eligible for selected service + "Kdorkoli" (anyone) option
- **Filtering:** `eligibleEmployeeIds` from store (computed during selectService)
- **Auto-skip:** If exactly 1 eligible employee, `autoSelectedId` is pre-set but user must still click "Naprej"
- **Note (Classic variant):** Selection is local state; committed to store only on "Naprej" button press
- **On select + Naprej:** `store.setState({ selectedEmployeeId, anyPerson })` then `store.nextStep()` → step 4
- **No API call at this step**

### Step 4: Date + Time Selection (`[Variant]DateTimeSelection`)

**Date picker:**
- Generates 60 days from today: `Array.from({ length: 60 }, (_, i) => addDays(today, i))`
- No API call for dates — all 60 days shown, client-side past-date disabling only

**Time slot fetch (on date selection):**
- POST to `https://n8n.jedroplus.com/webhook/booking`
- Payload:
```json
{
  "action": "slots",
  "companySlug": "...",
  "date": "yyyy-MM-dd",
  "serviceId": "...",
  "employeeId": "...",
  "any_person": true|false,
  "employeeIds": ["..."]    // only when anyPerson=true
}
```
- Response: `SlotsResponse[]` — `[{ "date": "yyyy-MM-dd", "slots": ["09:00", "09:30", ...] }]`
- Empty response or no matching date → shows "Ni prostih terminov"

**On time selection:**
1. `store.selectTime(time)` → also calls `store.nextStep()` to step 5
2. Checks if service has a discount already (`serviceDiscounts[storitevId]`); if not, calls `checkHappyHour()`
3. `computeActivePromotion(storitevId)` — sets `activePromotion`
4. If `selectedEmployeeId` is set (not anyPerson): calls `fetchAvailableAddOns()` → populates `availableAddOns`

### Step 5: Customer Details (`[Variant]CustomerDetails`)

**Form fields:**
- Ime (first name) — required, min 2 chars
- Priimek (last name) — required
- Email — required, validated
- Telefon (phone) — required
- Nagovor/gender — required (Gospod/Gospa/Drugo)
- Posebne želje (notes) — optional textarea
- GDPR marketing checkbox — optional
- Privacy consent checkbox — required
- Honeypot `website` field — hidden, tabIndex=-1

**`AddOnSelector` component:** Shown above the form if `availableAddOns.length > 0`. Allows selecting 1 optional add-on service.

**On submit ("Naprej na potrditev"):**
1. Client-side validation runs
2. `useSecureBooking.submitBooking()` validates + honeypot check
3. On success: `store.setCustomerDetails(details)` then `store.nextStep()` → step 6
4. **No actual API submission at this step**

### Step 6: Confirmation (`[Variant]Confirmation`)

**Pre-submit review screen:**
- Shows all selections: employee, service, duration, date, time, customer name/email/phone, add-on
- Shows price with discount applied (if `activePromotion` set)
- "Potrdi Rezervacijo" CTA button

**On confirm:**
1. `store.setSubmitting(true)`
2. POST to `https://n8n.jedroplus.com/webhook/booking`
3. Full payload (see `submitBooking` in api.ts section above) **plus** promotion + add-on fields spread in
4. On success: `store.setBookingConfirmation({ success: true, message, storitev, datum, cas })`
5. Renders `SuccessView` with confetti particles, confirmation card, calendar export (.ics), share/copy, "Nova Rezervacija" reset

**Calendar export (.ics):**
- Generated client-side using Blob + createObjectURL
- Downloads `rezervacija.ics` file
- No server involved

**Share:**
- Uses `navigator.share()` if available (mobile PWA), else copies to clipboard

---

## 5. Current Limitations & Missing Features

### Hardcoded values

- 🔄 n8n webhook URL hardcoded: `'https://n8n.jedroplus.com/webhook/booking'` in `src/lib/api.ts:3`
- 🔄 Privacy policy URL hardcoded: `'https://jedroplus.com/privacy'` in Classic/other CustomerDetails components
- ⚠️ `package.json` still shows `"name": "jedroplus-booking-3"` (should be `jedroplus-booking-5`)

### Type inconsistencies

- ⚠️ `BookingSubmission` interface in `api.ts` does NOT include `promocijaTip`, `promocijaNaziv`, `popust`, `finalCena`, `addOnServiceId`, `addOnNaziv`, `addOnOriginalCena` — these are spread in directly from Confirmation components without type safety
- ⚠️ `originalCena` is `0` when returned from `fetchActiveDiscounts()` — pages must manually enrich; this pattern is error-prone and could show `€0.00` if enrichment is missed

### Partial implementations

- ⚠️ `useSecureBooking` hook does NOT actually call `submitBooking` from api.ts — its try block just calls `onSuccess()`. The hook is vestigial for booking submission; its value is only form validation + honeypot. All variants call `submitBooking` directly in Confirmation step.
- ⚠️ `src/app/[slug]/page.tsx` (root slug page) uses a separate `BookingPage.tsx` component that does NOT load promotions. Only the 6 named variants load promotions on init.
- ⚠️ `src/components/steps/` (the default BookingPage steps) are separate from the variant steps and may be out of date — not actively used in production variants.

### Missing features

- 🔄 No resource (resursi) support — see Section 8
- 🔄 No multi-language/i18n system — see Section 6
- 🔄 Promotions not integrated into `useSecureBooking` hook
- 🔄 `gdprSendMarketing` vs `marketing_consent` — both exist in `BookingSubmission` but serve the same purpose (duplicate fields with different names sent to API)
- ⚠️ `SlotsResponse` type expects an array but API could return single object — code uses `.find()` which handles both

### Console.log pollution

- `promotionsApi.ts` has multiple `console.log` statements (Supabase URL, anon key, discount count, fetch URLs) — should be removed in production

---

## 6. Multilingual / Localization

### Current state: Slovenian only (mostly)

- All UI text is hardcoded in Slovenian within each component
- Date formatting uses `date-fns` with `sl` (Slovenian) locale:
  ```typescript
  import { sl } from 'date-fns/locale';
  format(date, 'd. MMMM yyyy', { locale: sl })
  ```
- Day names formatted as: `'EEE'` format → `'PON'`, `'TOR'`, `'SRE'`, etc.

### Exceptions

- ⚠️ Casino variant loading screen and error screen are in **English** ("Monte Carlo Booking Suite", "Preparing your table…", "Table Unavailable", "Pick your specialist", "Claim your slot", "Player registration")
- Casino `STEP_INFO` labels mix Slovenian title + English subtitle

### No i18n setup

- No `next-intl`, `react-i18next`, or any i18n library installed
- No translation files/dictionaries
- No locale detection from browser or company settings
- No `lang` attribute set on root HTML (layout.tsx has `lang="en"` which is incorrect for Slovenian content)

### Company locale

- `Company` interface has `panoga` (industry) field but no `country` or `locale` field
- No mechanism to switch language per company

🔄 **For rebuild:** Full i18n would require adding a translation library, extracting all string literals, and detecting locale from company data.

---

## 7. Promotions System (current state)

### What IS implemented

#### Service Discounts (`popust` type):
- Fetched at page load in all 6 variant `page.tsx` files
- Supabase tables used: `popusti`, `popusti_storitve`
- Displayed as `PromotionBadge` on service cards during selection
- Applied to final price in Confirmation screen
- Sent to n8n in booking submission payload

#### Happy Hour (`happy_hour` type):
- Checked when user selects a time slot
- Supabase table: `happy_hours`, `happy_hours_storitve`
- Supports: day-of-week filtering, time range, per-service or all-services modes
- Applied if no service discount exists (service discount takes priority)
- Shows in `PromotionBadge` in Confirmation
- Sent to n8n payload

#### Add-Ons:
- Fetched after time selection (only when specific employee selected, not anyPerson)
- Supabase tables: `add_on_storitve`, `Osebe`, `Termini`
- Conflict checking against existing appointments
- Displayed in `AddOnSelector` component in CustomerDetails
- Sent to n8n payload

#### Shared UI components:
- `PromotionBadge.tsx` — pill badge with discount type icon, name, percentage/amount, strikethrough original price, green final price
- `AddOnSelector.tsx` — list of add-on options with toggle selection

### What is NOT implemented / missing

- ⚠️ `originalCena` is `0` from `fetchActiveDiscounts()` — must be enriched in page.tsx (works, but fragile)
- ⚠️ Promotions not shown in the default `BookingPage.tsx` (only in named variants)
- ⚠️ Add-ons only available when specific employee selected; "Kdorkoli" path skips add-ons
- ⚠️ No UI in DateTimeSelection to show that a happy-hour applies to a time slot before selecting it (user only sees badge after clicking)
- 🔄 No promotion codes / voucher system
- 🔄 No bundle/package deals
- 🔄 No loyalty points

---

## 8. Resursi (Resources) System (current state)

### Status: NOT IMPLEMENTED

There is **no resources/resursi logic anywhere in the booking frontend codebase**:

- No resource fields in `types/index.ts`
- No resource fields in `bookingStore.ts`
- No resource API calls in `api.ts`
- No resource selection step in any variant
- No resource availability checking in date/time selection
- No resource assignment in booking submission payload

The n8n backend may handle resources internally, but the frontend has no awareness of them.

🔄 **For rebuild:** Resources would need:
1. New `Resource` type definition
2. `InitResponse` to include resource data
3. Store slices for resource selection
4. New step or integration into employee/time selection
5. Resource IDs in slots request payload
6. Resource ID in booking submission payload

---

## 9. Supabase Integration

### Supabase URL

From `.env.example`:
```
https://xdudtawctybnphdpvlwu.supabase.co
```

### Authentication method

All Supabase REST calls use anonymous key headers:
```typescript
const supabaseHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}
```

No Supabase client SDK is used — all calls are raw `fetch` against the Supabase REST API.

### All Supabase tables queried from frontend

| Table | Operation | Purpose | Filters |
|---|---|---|---|
| `popusti` | SELECT `*` | Active discounts | `company_id`, `aktiven=true`, date range |
| `popusti_storitve` | SELECT `*` | Discount↔Service mapping | `popust_id=in.(ids)` |
| `happy_hours` | SELECT `*` | Happy hour rules | `company_id`, `aktiven=true` |
| `happy_hours_storitve` | SELECT `*` | Happy hour↔Service mapping | `happy_hour_id`, `storitev_id` |
| `add_on_storitve` | SELECT `*` | Add-on definitions | `company_id`, `aktiven=true` |
| `Osebe` | SELECT `Storitve` | Employee's services (JSON column) | `"ID Osebe"=eq.${employeeId}` |
| `Termini` | SELECT `"Čas","Konec"` | Existing appointments (conflict check) | `"ID Osebe"=eq.${employeeId}`, `Datum=eq.${dateStr}` |

### Table schema assumptions

**`popusti`:**
- `id`, `company_id`, `naziv`, `aktiven` (boolean), `datum_zacetek` (date), `datum_konec` (date), `tip_popusta` ('percentage'|'fixed'), `vrednost` (number)

**`popusti_storitve`:**
- `popust_id`, `storitev_id`

**`happy_hours`:**
- `id`, `company_id`, `aktiven` (boolean), `dnevi_v_tednu` (number[] — 0=Sunday, 6=Saturday), `cas_zacetek` ('HH:MM'), `cas_konec` ('HH:MM'), `tip_popusta`, `vrednost`, `vse_storitve` (boolean)

**`happy_hours_storitve`:**
- `happy_hour_id`, `storitev_id`

**`add_on_storitve`:**
- `id`, `company_id`, `storitev_id`, `aktiven` (boolean), `tip_popusta`, `vrednost_popusta`

**`Osebe` (employees):**
- `"ID Osebe"`, `Storitve` (JSON string, array of service IDs)

**`Termini` (appointments):**
- `"ID Osebe"`, `Datum` (date string), `"Čas"` (start time 'HH:MM'), `"Konec"` (end time 'HH:MM')

### RLS policies assumed

All Supabase tables are assumed to be readable by the anonymous key (public read access). No write operations are performed directly to Supabase from the frontend — all booking creation goes through n8n.

---

## 10. TypeScript Types

All types defined in `src/types/index.ts`:

```typescript
interface Theme {
  primaryColor: string;     // e.g. '#8B5CF6'
  secondaryColor: string;   // e.g. '#A78BFA'
  bgFrom: string;           // e.g. '#7C3AED'
  bgTo: string;             // e.g. '#4F46E5'
}

interface Employee {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  specializations: string[];
}

interface EmployeeUI {
  id: string;
  label: string;       // display name
  subtitle: string;    // title/role
  initials: string;    // 2-letter initials for avatar
}

interface Category {
  id: string;
  name: string;
  service_count: number;
}

interface Service {
  id: string;
  category_id: string;
  naziv: string;       // service name
  opis: string;        // description
  trajanjeMin: number; // duration in minutes
  cena: number;        // price in EUR
}

interface TimeSlot {
  time: string;        // 'HH:MM' format
  available: boolean;  // ⚠️ unused — slots API just returns array of strings
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;     // 'male' | 'female' | 'other'
  notes?: string;
  gdprSendMarketing?: boolean;
  privacyConsent?: boolean;
}

interface BookingData {
  employeeId: string | null;
  categoryId: string | null;
  serviceId: string | null;
  date: Date | null;
  time: string | null;
  customer: CustomerDetails | null;
}

interface BookingConfirmation {
  success: boolean;
  message: string;
  storitev: string;    // service name (from API response)
  datum: string;       // formatted date string (from API response)
  cas: string;         // time string (from API response)
}

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface Company {
  idPodjetja?: string;  // company ID (used for Supabase queries)
  naziv?: string;       // company display name
  slug: string;
  email?: string;
  panoga?: string;      // industry
}

interface InitResponse {
  company: Company;
  employees: Employee[];
  employees_ui: EmployeeUI[];
  services: Service[];
  serviceCategories: Category[];
  servicesByCategory: Record<string, Service[]>;         // key: category.id
  employeesByServiceId: Record<string, (string|number)[]>; // key: service.id → array of employee IDs
  ui: {
    employeeSelection: {
      mode: 'single' | 'multi';     // ⚠️ 'multi' mode NOT implemented in UI
    };
  };
  theme?: Partial<Theme>;
}

interface SlotsResponse {
  date: string;         // 'yyyy-MM-dd'
  slots: string[];      // ['09:00', '09:30', ...]
}
```

**Types from `promotionsApi.ts`:**

```typescript
interface ServicePromotion {
  storitevId: string;
  type: 'popust' | 'happy_hour';
  naziv: string;
  tipPopusta: 'percentage' | 'fixed';
  vrednost: number;         // discount value (% or €)
  originalCena: number;     // ⚠️ starts as 0, enriched by page.tsx
  finalCena: number;        // ⚠️ starts as 0, enriched by page.tsx
  popustZnesek: number;     // ⚠️ starts as 0, enriched by page.tsx
  badgeLabel: string;       // '-20%' or '-€5.00'
}

interface AddOnOption {
  id: string;               // add_on_storitve.id
  storitevId: string;
  naziv: string;
  trajanjeMin: number;
  originalCena: number;
  finalCena: number;
  popustZnesek: number;
  tipPopusta: 'percentage' | 'fixed';
  vrednost: number;
  badgeLabel: string;
}
```

**Types from `validations/booking.ts`:**

```typescript
type BookingFormData = z.infer<typeof bookingFormSchema>;
// {
//   ime: string,
//   priimek?: string,
//   email: string,
//   telefon?: string,
//   datum?: string,
//   cas?: string,
//   storitev_id?: string,
//   zaposleni_id?: string,
//   opombe?: string,
//   website?: string,  // honeypot
// }
```

**Types from `seasonal/decorations/SeasonDetector.ts`:**

```typescript
type Season = 'winter' | 'spring' | 'summer' | 'autumn';
type Holiday = 'christmas' | 'newyear' | 'valentine' | 'easter' | 'halloween' | 'thanksgiving' | null;

interface SeasonalThemeConfig {
  name: string;
  bgFrom: string; bgTo: string;
  cardBg: string; cardBgAlt: string; cardBgHover: string; cardBorder: string;
  // Decoration flags (all optional boolean):
  snowflakes?; flowers?; leaves?; sunRays?; waves?; santaHats?; ornaments?;
  hearts?; eggs?; bunnies?; pumpkins?; ghosts?; bats?; fireworks?; confetti?;
  accentColor: string;
  headingFont?: string;  // CSS font variable reference
}

interface SeasonalTheme {
  season: Season;
  holiday: Holiday;
  config: SeasonalThemeConfig;
}
```

---

## Appendix: Key Dependencies

```json
{
  "next": "14.2.35",
  "react": "^18",
  "framer-motion": "^12.29.2",
  "zustand": "^5.0.10",
  "date-fns": "^4.1.0",
  "zod": "^4.3.6",
  "lucide-react": "^0.563.0",
  "tailwindcss": "^3.4.1",
  "typescript": "^5"
}
```

**Framer Motion v12 patterns used:**
- All `Variants` objects use `type Variants` annotation
- Ease strings: `'easeOut' as const`, `'easeIn' as const`, `'linear' as const`
- Bezier arrays: `[0.25, 0.46, 0.45, 0.94] as [number, number, number, number]`

**Google Fonts loaded (by variant):**

| Variant | Fonts |
|---|---|
| Root layout | Outfit, Libre Baskerville, JetBrains Mono, Nunito Sans |
| Classic | Nunito, Nunito Sans |
| Elegant | Playfair Display, Inter |
| Modern | Inter, DM Sans |
| Magazine | Playfair Display, Source Serif 4 |
| Casino | Playfair Display, Cormorant Garamond, Oswald |
| Seasonal | Quicksand, Playfair Display, Mountains of Christmas, Creepster |
