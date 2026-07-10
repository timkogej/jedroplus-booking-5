# JEDROPLUS BOOKING — n8n WORKFLOW SPECIFICATION

> **THIS WORKFLOW REPLACES THE EXISTING BOOKING WORKFLOW ENTIRELY.**
> The person building this must delete or disable the old workflow before activating this one.
> This document is self-contained — no prior knowledge of the codebase is required.

---

## BEFORE YOU START

### Step 1 — Run ALL ALTER TABLE statements in Supabase SQL Editor

Execute these in order in your Supabase project SQL editor before touching n8n.

```sql
-- ── "Podatki podjetij" — company settings table ──────────────────────────
ALTER TABLE "Podatki podjetij" ADD COLUMN IF NOT EXISTS "prikaz_zaposlenih_rezervacija" boolean DEFAULT true;
ALTER TABLE "Podatki podjetij" ADD COLUMN IF NOT EXISTS "max_dnevi_rezervacija" integer DEFAULT 60;
ALTER TABLE "Podatki podjetij" ADD COLUMN IF NOT EXISTS "stripe_enabled" boolean DEFAULT false;
ALTER TABLE "Podatki podjetij" ADD COLUMN IF NOT EXISTS "stripe_payment_mode" text DEFAULT 'full';
ALTER TABLE "Podatki podjetij" ADD COLUMN IF NOT EXISTS "stripe_deposit_percent" integer DEFAULT 30;

-- ── "Termini" — appointments table ────────────────────────────────────────
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "any_person" boolean DEFAULT false;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "eligible_employee_ids" text;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "payment_status" text;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "payment_amount" numeric(10,2);
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'sl';
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "assigned_employee_ids" text;
```

### Step 2 — Set these environment variables in n8n (Settings → Variables or Credentials)

| Variable Name | Description | Where used |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL, e.g. `https://xdudtawctybnphdpvlwu.supabase.co` | All Supabase nodes |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key (NOT anon key — needs write access) | All Supabase write nodes |
| `SUPABASE_ANON_KEY` | Supabase anon key (for read-only operations if you prefer) | Read-only Supabase nodes |
| `SMTP_HOST` | Email SMTP server hostname | Email notification nodes |
| `SMTP_PORT` | SMTP port (e.g. 587 for TLS) | Email notification nodes |
| `SMTP_USER` | SMTP username | Email notification nodes |
| `SMTP_PASS` | SMTP password | Email notification nodes |
| `SMS_API_KEY` | SMS gateway API key (e.g. Infobip, Twilio) | SMS notification nodes |
| `SMS_SENDER` | SMS sender name or number | SMS notification nodes |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_... or sk_test_...) | Stripe webhook verification |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) | Stripe webhook node |
| `N8N_WEBHOOK_BASE_URL` | Public base URL of this n8n instance, e.g. `https://n8n.jedroplus.com` | Webhook paths |

### Step 3 — Confirmation Checklist

Before going live, verify:

- [ ] All ALTER TABLE statements executed without errors (check each column exists)
- [ ] Supabase RLS policies allow the service_role key to SELECT and INSERT/UPDATE on all tables listed in Section 2
- [ ] Webhook URL `https://n8n.jedroplus.com/webhook/booking` is publicly accessible (test with curl)
- [ ] Stripe webhook endpoint `https://n8n.jedroplus.com/webhook/stripe-booking` registered in Stripe Dashboard → Webhooks
- [ ] Stripe webhook listens for event: `payment_intent.succeeded`
- [ ] SMTP credentials tested (send a test email from n8n)
- [ ] SMS credentials tested
- [ ] Old booking workflow is deactivated
- [ ] All 4 actions tested end-to-end: `init`, `slots`, `create`, `check-slots`

---

## SECTION 1 — OVERVIEW

### Architecture

This is a single n8n workflow reachable at one webhook URL:

```
POST/GET https://n8n.jedroplus.com/webhook/booking
```

All four booking actions (`init`, `slots`, `create`, `check-slots`) enter through this single webhook. An IF node at the top of the workflow reads the `action` field and routes to the correct branch.

There is also a **separate** companion workflow for Stripe payment confirmation (Section 9).

### Entry Point Routing

```
Webhook node
     │
     ├─ IF action === 'init'        → INIT branch (Section 3)
     ├─ IF action === 'slots'       → SLOTS branch (Section 4)
     ├─ IF action === 'create'      → CREATE branch (Section 5)
     └─ IF action === 'check-slots' → CHECK-SLOTS branch (Section 6)
```

- `init` comes as a **GET** request: `?action=init&companySlug=...`
- `slots`, `create`, `check-slots` come as **POST** requests with JSON body

### Technology Stack Rules

1. **Supabase nodes** — use the built-in n8n Supabase node for all Supabase reads/writes. Use HTTP Request node only if the Supabase node cannot express the required query.
2. **AI** — primary: Anthropic Claude node. Fallback: OpenAI node, activated by an IF node that checks if the Anthropic node output contains an error.
3. **All responses** — always returned via a "Respond to Webhook" node with `Content-Type: application/json`.
4. **Error responses** — always use the error schema from Section 11. Never return HTTP 200 for business logic errors that the frontend must handle.

---

## SECTION 2 — SUPABASE TABLES REFERENCE

All table names and column names use **exact casing** as shown. Supabase is case-sensitive.

---

### Table: `"Podatki podjetij"` (Company Settings)

**Used in:** `init` action (READ), `create` action (READ to validate)

| Column | Type | Purpose |
|---|---|---|
| `"ID Podjetja"` | text | Primary business identifier (used as companyId everywhere else) |
| `"Naziv"` | text | Display name of the company |
| `"slug"` | text | URL-friendly identifier — this is what comes in from the frontend |
| `"country"` | text | ISO 2-letter country code, e.g. `'SI'` for Slovenia |
| `"plan"` | text | Subscription plan. Must be `'active'` or equivalent to allow bookings |
| `"prikaz_zaposlenih_rezervacija"` | boolean | **NEW COLUMN** — if `false`, skip employee selection step (always use any_person=true) |
| `"max_dnevi_rezervacija"` | integer | **NEW COLUMN** — max days ahead a booking can be made. Default 60. |
| `"stripe_enabled"` | boolean | **NEW COLUMN** — if `true`, payment is required before confirming |
| `"stripe_payment_mode"` | text | **NEW COLUMN** — `'full'` or `'deposit'` |
| `"stripe_deposit_percent"` | integer | **NEW COLUMN** — deposit percentage (0–100). Only used when mode=`'deposit'` |
| `"valuta"` | text | Currency code, e.g. `'EUR'`. Used in payment and notification text |
| Color/theme columns | text | Any columns storing primaryColor, bgFrom, bgTo, secondaryColor — include all in SELECT |

**Query for init:** `SELECT * FROM "Podatki podjetij" WHERE slug = $companySlug LIMIT 1`

---

### Table: `"Storitve"` (Services)

**Used in:** `init` action (READ), `slots` action (READ for duration), `create` action (READ for name)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment primary key |
| `"ID storitve"` | text | Text-based service identifier (used everywhere in frontend) |
| `"ID podjetja"` | text | Foreign key → `"Podatki podjetij"."ID Podjetja"` |
| `"Naziv"` | text | Service name |
| `"Opis"` | text | Service description |
| `"Cena"` | numeric / text | Price (normalize to number in Code node) |
| `"Trajanje"` | integer or text | Duration in minutes (normalize to integer in Code node) |
| `"Kategorija"` | text | Category name — categories are derived from distinct values of this column |
| `"Status"` | text | Filter: only include rows where `Status = 'active'` (or equivalent active value) |

**Query for init:** `SELECT * FROM "Storitve" WHERE "ID podjetja" = $companyId AND "Status" = 'active'`

**Note:** If a `"Kategorije"` table exists in the database, you may query it instead for category metadata. If it does not exist, derive categories from `DISTINCT "Kategorija"` values in Storitve. Build category IDs by slugifying the category name (lowercase, spaces to hyphens).

---

### Table: `"Osebe"` (Employees)

**Used in:** `init` action (READ), `slots` action (READ for schedule), `create` action (READ for availability)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment primary key |
| `"ID Osebe"` | text | Text-based employee identifier — used as foreign key in bookings |
| `"ID podjetja"` | text | Foreign key → `"Podatki podjetij"."ID Podjetja"` |
| `"Ime"` | text | First name |
| `"Priimek"` | text | Last name |
| `"Naziv"` | text | Job title / role (e.g. "Senior Stylist") |
| `"Storitve"` | text (JSON) | JSON-encoded array of service text IDs this employee can perform. Parse with `JSON.parse()` |
| `"Urnik"` | text (JSON) | JSON-encoded weekly schedule. Structure: `{ "mon": { "start": "09:00", "end": "18:00" }, "tue": ..., "wed": null }`. Null means not working. Keys: `mon tue wed thu fri sat sun`. |
| `"Status"` | text | Filter: only include `Status = 'active'` |
| avatar/photo | text | URL to profile photo if column exists |

**Query for init:** `SELECT * FROM "Osebe" WHERE "ID podjetja" = $companyId AND "Status" = 'active'`

**Query for slots/create:** `SELECT "ID Osebe", "Urnik" FROM "Osebe" WHERE "ID Osebe" = ANY($employeeIds)`

---

### Table: `"Termini"` (Appointments)

**Used in:** `slots` action (READ for conflict checking), `create` action (WRITE)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK — use this for `Termini_Resursi` FK, NOT the text ID |
| `"ID termina"` | text | Generated 8-char text ID — used in API responses and Stripe metadata |
| `"ID podjetja"` | text | Foreign key → company |
| `"ID Osebe"` | text | Foreign key → employee |
| `"ID storitve"` | text | Primary service text ID |
| `"ID storitve 2"` | text | Second service text ID (multi-service bookings) |
| `"ID storitve 3"` | text | Third service text ID (multi-service bookings) |
| `"Datum"` | date | Booking date (`yyyy-MM-dd`) |
| `"Čas"` | time | Start time (`HH:mm`) |
| `"Konec"` | time | End time (`HH:mm`) — calculated as start + total duration |
| `"Trajanje"` | text | Total duration string, e.g. `"90"` |
| `"Cena"` | text | Original price |
| `"Popust"` | text | Discount amount |
| `"Popust type"` | text | Discount type: `'%'` or `'valuta'` |
| `"Final cena"` | text | Final price after discount |
| `"promocija_tip"` | text | Promotion type: `'popust'` or `'happy_hour'` |
| `"promocija_naziv"` | text | Promotion name |
| `"popust_id"` | uuid | FK to popusti table (if applicable) |
| `"happy_hour_id"` | uuid | FK to happy_hours table (if applicable) |
| `"Status"` | text | `'confirmed'`, `'pending_payment'`, `'cancelled'`, etc. |
| `"any_person"` | boolean | **NEW COLUMN** — `true` if booked via "anyone available" mode |
| `"eligible_employee_ids"` | text | **NEW COLUMN** — JSON array of eligible employee IDs (for any_person bookings) |
| `"stripe_payment_intent_id"` | text | **NEW COLUMN** — Stripe PaymentIntent ID |
| `"payment_status"` | text | **NEW COLUMN** — `null`, `'pending'`, `'paid'`, `'refunded'` |
| `"payment_amount"` | numeric(10,2) | **NEW COLUMN** — amount charged via Stripe |
| `"language"` | text | **NEW COLUMN** — `'sl'` or `'en'` — used to send notifications in correct language |
| `"assigned_employee_ids"` | text | **NEW COLUMN** — JSON array, stores resolved employee for any_person bookings |

**Query for slots (conflict check):**
```sql
SELECT "Datum", "Čas", "Konec", "ID Osebe", "Status"
FROM "Termini"
WHERE "ID Osebe" = ANY($employeeIds)
  AND "Datum" BETWEEN $startDate AND $endDate
  AND "Status" NOT IN ('cancelled', 'no_show')
```

**Query for create (double-check):**
```sql
SELECT id FROM "Termini"
WHERE "ID Osebe" = $employeeId
  AND "Datum" = $date
  AND "Status" NOT IN ('cancelled', 'no_show')
  AND "Čas" < $endTime
  AND "Konec" > $startTime
```

---

### Table: `"Stranke"` (Customers)

**Used in:** `create` action (READ to find existing, WRITE to create new)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK |
| `"ID stranke"` | text | Generated 8-char text ID |
| `"ID podjetja"` | text | Foreign key → company |
| `"Ime"` | text | First name |
| `"Priimek"` | text | Last name |
| `"Email"` | text | Email address — used as lookup key |
| `"Telefon"` | text | Phone number |
| `"Spol"` | text | Gender: `'male'`, `'female'`, `'other'` |
| `"Opombe"` | text | Notes |
| `"GDPR marketing"` | boolean | Marketing consent |
| `created_at` | timestamptz | Auto-set by Supabase |
| `"je_nova_stranka"` | boolean | Computed flag: `true` if this is the customer's first booking with this company |

**Query to find customer:** `SELECT * FROM "Stranke" WHERE "Email" = $email AND "ID podjetja" = $companyId LIMIT 1`

---

### Table: `"Resursi"` (Resources)

**Used in:** `init` action (READ), `slots` action (READ for capacity check)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK — used as FK in Termini_Resursi and storitveResursiMap |
| `"ID resursa"` | text | Text-based resource identifier |
| `"ID podjetja"` | text | Foreign key → company |
| `"Naziv"` | text | Resource name (e.g. "Tretmajna soba 1") |
| `"Kolicina"` | integer | Number of physical units of this resource |
| `"Kapaciteta"` | integer | Max concurrent bookings per unit (usually 1) |
| `"Status"` | text | Filter: only include `Status = 'active'` |

**Query for init:** `SELECT * FROM "Resursi" WHERE "ID podjetja" = $companyId AND "Status" = 'active'`

---

### Table: `"Storitve_Resursi"` (Service ↔ Resource Mapping)

**Used in:** `init` action (READ to build storitveResursiMap)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK |
| `"ID podjetja"` | text | Foreign key → company |
| `storitev_id` | bigint | FK → `"Storitve".id` (bigint) — NOT the text ID |
| `"ID storitve"` | text | FK → `"Storitve"."ID storitve"` (text) — this is what's used as the key |
| `resurs_id` | bigint | FK → `"Resursi".id` (bigint) — THIS value goes into storitveResursiMap values |
| `"ID resursa"` | text | FK → `"Resursi"."ID resursa"` (text) |

**Query for init:** `SELECT * FROM "Storitve_Resursi" WHERE "ID podjetja" = $companyId`

**How to build storitveResursiMap in Code node:**
```javascript
const map = {};
for (const row of storitveResursiRows) {
  const key = row["ID storitve"]; // text service ID
  if (!map[key]) map[key] = [];
  map[key].push(row.resurs_id);   // bigint row ID — NOT text ID
}
```

---

### Table: `"Termini_Resursi"` (Appointment ↔ Resource Assignment)

**Used in:** `slots` action (READ for capacity conflict check), `create` action (WRITE)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK |
| `"ID podjetja"` | text | Foreign key → company |
| `termin_id` | bigint | FK → `"Termini".id` (bigint auto-increment) — CRITICAL: use the bigint id, NOT the text "ID termina" |
| `resurs_id` | bigint | FK → `"Resursi".id` (bigint) |
| `"ID resursa"` | text | FK → `"Resursi"."ID resursa"` (text) — for readability |

**Query for slots (capacity check):**
```sql
SELECT tr.resurs_id, COUNT(*) as booking_count,
       t."Čas", t."Konec"
FROM "Termini_Resursi" tr
JOIN "Termini" t ON t.id = tr.termin_id
WHERE tr.resurs_id = ANY($resursIds)
  AND t."Datum" BETWEEN $startDate AND $endDate
  AND t."Status" NOT IN ('cancelled', 'no_show')
GROUP BY tr.resurs_id, t."Datum", t."Čas", t."Konec"
```

---

### Table: `"Odsotnosti"` (Employee Absences)

**Used in:** `slots` action (READ to block availability)

| Column | Type | Purpose |
|---|---|---|
| `id` | bigint | Auto-increment PK |
| `"ID Osebe"` | text | FK → employee |
| `"ID podjetja"` | text | FK → company |
| `"Datum od"` | date | Absence start date (inclusive) |
| `"Datum do"` | date | Absence end date (inclusive) |
| `"Tip"` | text | Absence type (e.g. `'dopust'`, `'bolniška'`) — not used for filtering, just metadata |

**Query for slots:**
```sql
SELECT "ID Osebe", "Datum od", "Datum do"
FROM "Odsotnosti"
WHERE "ID Osebe" = ANY($employeeIds)
  AND "Datum od" <= $endDate
  AND "Datum do" >= $startDate
```

**Note:** If this table does not exist in the database, skip this step (wrap in a try/catch or check table existence first).

---

### Tables NOT handled by n8n (frontend reads them directly via Supabase)

The following tables are read directly by the frontend using the Supabase anon key. n8n does NOT need to query them:

- `popusti` — service discounts
- `popusti_storitve` — discount ↔ service mapping
- `happy_hours` — happy hour rules
- `happy_hours_storitve` — happy hour ↔ service mapping
- `add_on_storitve` — add-on service definitions

n8n only receives the **results** of these lookups as fields in the `create` action payload (promocijaTip, promocijaNaziv, popust, finalCena, addOnServiceId, etc.).

---

## SECTION 3 — ACTION: INIT

**Purpose:** Returns all data needed to initialize the booking UI for a given company.

**HTTP Method:** GET

**URL Pattern:** `?action=init&companySlug={slug}`

---

### Node Sequence

#### Node 1: Webhook
- Type: Webhook
- Method: GET
- Path: `/booking`
- Extract: `query.companySlug`

#### Node 2: IF — Route by action
- Condition: `{{$json.query.action}}` equals `init`
- True → continue to Node 3
- False → route to other action branches

#### Node 3: Supabase — Fetch Company
- Table: `"Podatki podjetij"`
- Operation: SELECT
- Filter: `slug` = `{{$json.query.companySlug}}`
- Limit: 1

**After Node 3 — IF node: company not found**
- Condition: result array is empty
- True → Respond to Webhook: `{ "success": false, "error": "company_not_found", "message": "Podjetje ne obstaja" }` (HTTP 404)

**After Node 3 — IF node: plan invalid**
- Condition: `company.plan` is not `'active'` (adjust exact value to match your plan system)
- True → Respond to Webhook: `{ "success": false, "error": "plan_invalid", "message": "Podjetje nima aktivnega plana" }` (HTTP 403)

Store `company` row for use in subsequent nodes.

#### Node 4: Supabase — Fetch Services
- Table: `"Storitve"`
- Operation: SELECT
- Filter: `"ID podjetja"` = `{{company["ID Podjetja"]}}` AND `"Status"` = `'active'`

#### Node 5: Supabase — Fetch Employees
- Table: `"Osebe"`
- Operation: SELECT
- Filter: `"ID podjetja"` = `{{company["ID Podjetja"]}}` AND `"Status"` = `'active'`

#### Node 6: Supabase — Fetch Resursi
- Table: `"Resursi"`
- Operation: SELECT
- Filter: `"ID podjetja"` = `{{company["ID Podjetja"]}}` AND `"Status"` = `'active'`

#### Node 7: Supabase — Fetch Storitve_Resursi
- Table: `"Storitve_Resursi"`
- Operation: SELECT
- Filter: `"ID podjetja"` = `{{company["ID Podjetja"]}}`

#### Node 8: Code Node — Build InitResponse

```javascript
// Inputs available: company, services[], employees[], resursi[], storitveResursiRows[]

const company = $('Fetch Company').first().json;
const services = $('Fetch Services').all().map(i => i.json);
const employees = $('Fetch Employees').all().map(i => i.json);
const resursi = $('Fetch Resursi').all().map(i => i.json);
const srRows = $('Fetch Storitve_Resursi').all().map(i => i.json);

// ── Build categories ──────────────────────────────────────────────────────
const categoryMap = {};
for (const svc of services) {
  const catName = svc["Kategorija"] || "Splošno";
  const catId = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!categoryMap[catId]) {
    categoryMap[catId] = { id: catId, name: catName, service_count: 0 };
  }
  categoryMap[catId].service_count++;
}
const categories = Object.values(categoryMap);

// ── Build services array ──────────────────────────────────────────────────
const servicesOut = services.map(svc => {
  const catName = svc["Kategorija"] || "Splošno";
  const catId = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: svc["ID storitve"],
    category_id: catId,
    naziv: svc["Naziv"],
    opis: svc["Opis"] || "",
    trajanjeMin: parseInt(String(svc["Trajanje"]), 10) || 0,
    cena: parseFloat(String(svc["Cena"])) || 0,
  };
});

// ── Build servicesByCategory ──────────────────────────────────────────────
const servicesByCategory = {};
for (const svc of servicesOut) {
  if (!servicesByCategory[svc.category_id]) servicesByCategory[svc.category_id] = [];
  servicesByCategory[svc.category_id].push(svc);
}

// ── Build employees_ui ────────────────────────────────────────────────────
const employees_ui = employees.map(emp => {
  const first = emp["Ime"] || "";
  const last = emp["Priimek"] || "";
  return {
    id: emp["ID Osebe"],
    label: `${first} ${last}`.trim(),
    subtitle: emp["Naziv"] || "",
    initials: `${first.charAt(0)}${last.charAt(0)}`.toUpperCase(),
  };
});

// ── Build employeesByServiceId ────────────────────────────────────────────
// Key: service text ID → array of employee text IDs
const employeesByServiceId = {};
for (const emp of employees) {
  let empServiceIds = [];
  try {
    empServiceIds = JSON.parse(emp["Storitve"] || "[]");
  } catch { empServiceIds = []; }
  for (const svcId of empServiceIds) {
    const key = String(svcId);
    if (!employeesByServiceId[key]) employeesByServiceId[key] = [];
    employeesByServiceId[key].push(emp["ID Osebe"]);
  }
}

// ── Build resursi array ───────────────────────────────────────────────────
const resursiOut = resursi.map(r => ({
  id: r.id,                          // bigint row ID
  naziv: r["Naziv"],
  kolicina: parseInt(r["Kolicina"], 10) || 1,
  kapaciteta: parseInt(r["Kapaciteta"], 10) || 1,
}));

// ── Build storitveResursiMap ──────────────────────────────────────────────
// Key: service text ID → array of resurs row IDs (bigint)
const storitveResursiMap = {};
for (const row of srRows) {
  const key = row["ID storitve"];
  if (!storitveResursiMap[key]) storitveResursiMap[key] = [];
  storitveResursiMap[key].push(row.resurs_id);
}

// ── Build theme ───────────────────────────────────────────────────────────
// Adjust column names to match your actual theme columns in "Podatki podjetij"
const theme = {
  primaryColor: company.primaryColor || company.primary_color || '#8B5CF6',
  secondaryColor: company.secondaryColor || company.secondary_color || '#A78BFA',
  bgFrom: company.bgFrom || company.bg_from || '#7C3AED',
  bgTo: company.bgTo || company.bg_to || '#4F46E5',
};

// ── Build company output ──────────────────────────────────────────────────
const companyOut = {
  idPodjetja: company["ID Podjetja"],
  naziv: company["Naziv"],
  slug: company["slug"],
  country: company["country"] || "SI",
  plan: company["plan"],
  prikaz_zaposlenih_rezervacija: company["prikaz_zaposlenih_rezervacija"] !== false,
  max_dnevi_rezervacija: company["max_dnevi_rezervacija"] || 60,
  stripe_enabled: company["stripe_enabled"] === true,
  stripe_payment_mode: company["stripe_payment_mode"] || "full",
  stripe_deposit_percent: company["stripe_deposit_percent"] || 30,
  valuta: company["valuta"] || "EUR",
};

return [{
  json: {
    company: companyOut,
    employees_ui,
    categories,
    services: servicesOut,
    servicesByCategory,
    serviceCategories: categories,   // alias for frontend compatibility
    employeesByServiceId,
    resursi: resursiOut,
    storitveResursiMap,
    ui: {
      employeeSelection: {
        mode: companyOut.prikaz_zaposlenih_rezervacija ? 'single' : 'multi',
      },
    },
    theme,
  }
}];
```

#### Node 9: Respond to Webhook
- Response Code: 200
- Response Body: `{{$json}}` (the Code node output)
- Content-Type: `application/json`

---

### Init Response Shape (exact)

```json
{
  "company": {
    "idPodjetja": "string",
    "naziv": "string",
    "slug": "string",
    "country": "SI",
    "plan": "string",
    "prikaz_zaposlenih_rezervacija": true,
    "max_dnevi_rezervacija": 60,
    "stripe_enabled": false,
    "stripe_payment_mode": "full",
    "stripe_deposit_percent": 30,
    "valuta": "EUR"
  },
  "employees_ui": [
    { "id": "EMP001", "label": "Ana Novak", "subtitle": "Senior Stylist", "initials": "AN" }
  ],
  "categories": [
    { "id": "masaza", "name": "Masaža", "service_count": 3 }
  ],
  "services": [
    { "id": "SVC001", "category_id": "masaza", "naziv": "Klasična masaža", "opis": "Opis storitve", "trajanjeMin": 60, "cena": 45.00 }
  ],
  "servicesByCategory": {
    "masaza": [{ "id": "SVC001", "category_id": "masaza", "naziv": "Klasična masaža", "opis": "", "trajanjeMin": 60, "cena": 45.00 }]
  },
  "serviceCategories": [
    { "id": "masaza", "name": "Masaža", "service_count": 3 }
  ],
  "employeesByServiceId": {
    "SVC001": ["EMP001", "EMP002"]
  },
  "resursi": [
    { "id": 1, "naziv": "Tretmajna soba", "kolicina": 2, "kapaciteta": 1 }
  ],
  "storitveResursiMap": {
    "SVC001": [1]
  },
  "ui": {
    "employeeSelection": { "mode": "single" }
  },
  "theme": {
    "primaryColor": "#8B5CF6",
    "secondaryColor": "#A78BFA",
    "bgFrom": "#7C3AED",
    "bgTo": "#4F46E5"
  }
}
```

---

## SECTION 4 — ACTION: SLOTS

**Purpose:** Returns available time slots for a date range, given service(s) and employee selection.

**HTTP Method:** POST

**Request Body:**

```json
{
  "action": "slots",
  "companySlug": "my-salon",
  "serviceIds": ["SVC001", "SVC002"],
  "employeeId": "EMP001",
  "any_person": false,
  "eligibleEmployeeIds": ["EMP001", "EMP002"],
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```

**Field rules:**
- `serviceIds` — array of 1–3 service text IDs. Never empty.
- `employeeId` — specific employee ID when `any_person=false`. May be `null` when `any_person=true`.
- `any_person` — if `true`, ignore `employeeId` and use `eligibleEmployeeIds` instead.
- `eligibleEmployeeIds` — always populated by the frontend (intersection of employees that can do ALL selected services).
- `startDate` / `endDate` — `yyyy-MM-dd` format. Range is typically 30–60 days.

---

### Node Sequence

#### Node 1: Webhook (shared entry point, routed here by action=slots)

#### Node 2: Validate Input — Code Node
```javascript
const body = $input.first().json.body;
const errors = [];
if (!body.companySlug) errors.push("companySlug required");
if (!body.serviceIds || body.serviceIds.length === 0) errors.push("serviceIds required");
if (!body.startDate || !body.endDate) errors.push("startDate and endDate required");
if (!body.any_person && !body.employeeId && (!body.eligibleEmployeeIds || body.eligibleEmployeeIds.length === 0)) {
  errors.push("employeeId or eligibleEmployeeIds required");
}
if (errors.length > 0) {
  return [{ json: { success: false, error: "validation_error", message: errors.join(", "), fields: errors } }];
}
return [{ json: body }];
```

#### Node 3: Supabase — Fetch Company
- Table: `"Podatki podjetij"`
- Filter: `slug` = `$companySlug`
- Extract: `max_dnevi_rezervacija`

#### Node 4: Supabase — Fetch Services (for duration)
- Table: `"Storitve"`
- Filter: `"ID storitve"` IN `$serviceIds`
- Extract: `"Trajanje"`, `"ID storitve"`

#### Node 5: Supabase — Fetch Employee Schedules
- Table: `"Osebe"`
- If `any_person=false`: filter `"ID Osebe"` = `$employeeId`
- If `any_person=true`: filter `"ID Osebe"` IN `$eligibleEmployeeIds`
- Extract: `"ID Osebe"`, `"Urnik"`

#### Node 6: Supabase — Fetch Existing Appointments
```sql
SELECT "Datum", "Čas", "Konec", "ID Osebe", "Status"
FROM "Termini"
WHERE "ID Osebe" = ANY($employeeIds)
  AND "Datum" BETWEEN $startDate AND $endDate
  AND "Status" NOT IN ('cancelled', 'no_show')
```

#### Node 7: Supabase — Fetch Resource Conflicts (if services use resursi)
- First determine which resurs IDs are needed from storitveResursiMap for the given serviceIds
- If no resursi needed, skip this step
```sql
SELECT tr.resurs_id, t."Datum", t."Čas", t."Konec"
FROM "Termini_Resursi" tr
JOIN "Termini" t ON t.id = tr.termin_id
WHERE tr.resurs_id = ANY($neededResursIds)
  AND t."Datum" BETWEEN $startDate AND $endDate
  AND t."Status" NOT IN ('cancelled', 'no_show')
```

#### Node 8: Supabase — Fetch Absences
```sql
SELECT "ID Osebe", "Datum od", "Datum do"
FROM "Odsotnosti"
WHERE "ID Osebe" = ANY($employeeIds)
  AND "Datum od" <= $endDate AND "Datum do" >= $startDate
```
(Wrap in try/catch; if table doesn't exist, return empty array)

#### Node 9: Code Node — Generate Slots

```javascript
// This is the core slot generation algorithm.
// All times are in 'HH:mm' format strings. All dates are 'yyyy-MM-dd' strings.

const input = $('Validate Input').first().json;
const company = $('Fetch Company').first().json;
const services = $('Fetch Services').all().map(i => i.json);
const employees = $('Fetch Employees').all().map(i => i.json);
const existingAppointments = $('Fetch Appointments').all().map(i => i.json);
const resursiConflicts = $('Fetch Resource Conflicts').all().map(i => i.json);
const absences = $('Fetch Absences').all().map(i => i.json);

// ── Helpers ────────────────────────────────────────────────────────────────

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function isoToDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

function dayKey(date) {
  // Returns 'mon','tue','wed','thu','fri','sat','sun'
  return ['sun','mon','tue','wed','thu','fri','sat'][date.getDay()];
}

// ── Calculate total duration ──────────────────────────────────────────────
let totalDurationMin = 0;
for (const svc of services) {
  totalDurationMin += parseInt(String(svc["Trajanje"]), 10) || 0;
}

// ── Build employee schedule map ───────────────────────────────────────────
// { employeeId: { mon: { start: 'HH:mm', end: 'HH:mm' } | null, ... } }
const employeeSchedules = {};
for (const emp of employees) {
  let schedule = {};
  try { schedule = JSON.parse(emp["Urnik"] || "{}"); } catch {}
  employeeSchedules[emp["ID Osebe"]] = schedule;
}

// ── Build appointments index ──────────────────────────────────────────────
// { "empId|yyyy-MM-dd": [{ start: minutes, end: minutes }] }
const apptIndex = {};
for (const appt of existingAppointments) {
  const key = `${appt["ID Osebe"]}|${appt["Datum"]}`;
  if (!apptIndex[key]) apptIndex[key] = [];
  apptIndex[key].push({
    start: toMinutes(appt["Čas"]),
    end: toMinutes(appt["Konec"]),
  });
}

// ── Build absence index ───────────────────────────────────────────────────
// { empId: [{ from: Date, to: Date }] }
const absenceIndex = {};
for (const abs of absences) {
  const empId = abs["ID Osebe"];
  if (!absenceIndex[empId]) absenceIndex[empId] = [];
  absenceIndex[empId].push({
    from: isoToDate(abs["Datum od"]),
    to: isoToDate(abs["Datum do"]),
  });
}

// ── Build resource conflict index ─────────────────────────────────────────
// { "resursId|yyyy-MM-dd|HH:mm|HH:mm": count }
const resursConflictIndex = {};
for (const row of resursiConflicts) {
  const key = `${row.resurs_id}|${row["Datum"]}`;
  if (!resursConflictIndex[key]) resursConflictIndex[key] = [];
  resursConflictIndex[key].push({
    start: toMinutes(row["Čas"]),
    end: toMinutes(row["Konec"]),
  });
}

// ── Determine which employees to consider ────────────────────────────────
const employeeIds = input.any_person
  ? input.eligibleEmployeeIds
  : [input.employeeId];

// ── Get needed resurs IDs (passed in input as resursiIds, or compute from map) ──
// The frontend should send resursiIds — if not present, we have no resurs data here.
// storitveResursiMap is not available in this node; use resursiIds from input if provided.
const neededResursIds = input.resursiIds || [];

// ── Get resursi capacity from Resursi node output ─────────────────────────
// (add a Fetch Resursi node for slots if resursiIds is non-empty)
// For now, assume each resurs has kolicina=1, kapaciteta=1 unless you pass it.
// Adjust this if you add a Resursi fetch to the slots flow.

// ── Slot interval (minutes between slot start times) ─────────────────────
const SLOT_INTERVAL = 30; // generate a candidate slot every 30 minutes

// ── Iterate over each date in range ──────────────────────────────────────
const maxDays = company["max_dnevi_rezervacija"] || 60;
const todayStr = new Date().toISOString().split('T')[0];
const today = isoToDate(todayStr);

const result = {};

let current = isoToDate(input.startDate);
const end = isoToDate(input.endDate);

while (current <= end) {
  const dateStr = current.toISOString().split('T')[0];

  // a. Check if date is within max booking window from today
  const diffDays = Math.floor((current - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > maxDays) {
    result[dateStr] = 'unavailable';
    current = new Date(current.getTime() + 86400000);
    continue;
  }

  const dow = dayKey(current);

  // b+c. Find at least one employee working on this day
  let anyEmployeeWorksToday = false;
  let availableSlots = new Set();

  for (const empId of employeeIds) {
    const schedule = employeeSchedules[empId];
    if (!schedule) continue;

    const daySchedule = schedule[dow];
    if (!daySchedule || !daySchedule.start || !daySchedule.end) continue; // not working this day

    // Check absence
    const empAbsences = absenceIndex[empId] || [];
    const isAbsent = empAbsences.some(abs => current >= abs.from && current <= abs.to);
    if (isAbsent) continue;

    anyEmployeeWorksToday = true;

    const workStart = toMinutes(daySchedule.start);
    const workEnd = toMinutes(daySchedule.end);
    const apptKey = `${empId}|${dateStr}`;
    const empAppts = apptIndex[apptKey] || [];

    // d. Generate candidate slots
    let slotStart = workStart;
    while (slotStart + totalDurationMin <= workEnd) {
      const slotEnd = slotStart + totalDurationMin;

      // f. Check employee appointment conflicts
      const hasConflict = empAppts.some(appt =>
        slotStart < appt.end && slotEnd > appt.start
      );
      if (hasConflict) {
        slotStart += SLOT_INTERVAL;
        continue;
      }

      // g. Check resource conflicts
      let resursBlocked = false;
      for (const resursId of neededResursIds) {
        const rKey = `${resursId}|${dateStr}`;
        const conflicts = resursConflictIndex[rKey] || [];
        // Count overlapping bookings in this time window
        const overlapping = conflicts.filter(c => slotStart < c.end && slotEnd > c.start).length;
        // Assume kolicina=1, kapaciteta=1 per resurs unless you have resurs data here
        if (overlapping >= 1) {
          resursBlocked = true;
          break;
        }
      }
      if (resursBlocked) {
        slotStart += SLOT_INTERVAL;
        continue;
      }

      availableSlots.add(fromMinutes(slotStart));
      slotStart += SLOT_INTERVAL;
    }
  }

  // i. Classify the date
  if (!anyEmployeeWorksToday) {
    result[dateStr] = 'unavailable';
  } else if (availableSlots.size === 0) {
    result[dateStr] = 'fully_booked';
  } else {
    // Sort slots chronologically
    result[dateStr] = Array.from(availableSlots).sort();
  }

  current = new Date(current.getTime() + 86400000);
}

return [{
  json: {
    slots: result,
    totalDurationMin,
    employeeId: input.any_person ? undefined : input.employeeId,
  }
}];
```

#### Node 10: Respond to Webhook
- Response Code: 200
- Body: Code node output

---

### Slots Response Shape

```json
{
  "slots": {
    "2026-06-01": ["09:00", "09:30", "10:00", "10:30"],
    "2026-06-02": [],
    "2026-06-03": "fully_booked",
    "2026-06-04": "unavailable",
    "2026-06-07": ["09:00", "11:00"]
  },
  "totalDurationMin": 90,
  "employeeId": "EMP001"
}
```

**Value semantics:**
- `string[]` (even empty `[]`) — date is a valid workday; empty array means all slots taken
- `"fully_booked"` — workday but every slot is occupied
- `"unavailable"` — not a workday, outside booking window, or employee absent

---

## SECTION 5 — ACTION: CREATE

**Purpose:** Creates a new booking. Runs full validation, slot double-check, customer find-or-create, appointment write, resource assignment, and notifications.

**HTTP Method:** POST

**Request Body (complete, every field documented):**

```json
{
  "action": "create",
  "companySlug": "my-salon",
  "date": "2026-06-15",
  "time": "10:00",
  "serviceIds": ["SVC001", "SVC002"],
  "employeeId": "EMP001",
  "any_person": false,
  "eligibleEmployeeIds": ["EMP001", "EMP002"],
  "resursiIds": [1, 2],
  "firstName": "Ana",
  "lastName": "Novak",
  "email": "ana.novak@example.com",
  "phone": "+38641123456",
  "gender": "female",
  "notes": "Posebne želje",
  "privacy_consent": true,
  "marketing_consent": false,
  "consent_timestamp": "2026-06-10T08:30:00.000Z",
  "language": "sl",
  "promocijaTip": "popust",
  "promocijaNaziv": "Poletna akcija",
  "popust": 10.00,
  "popustTip": "%",
  "finalCena": 40.50,
  "originalCena": 45.00,
  "addOnServiceId": "SVC005",
  "addOnNaziv": "Aromaterapija",
  "addOnFinalCena": 12.00,
  "addOnOriginalCena": 15.00,
  "addOnPopust": 3.00,
  "addOnPopustTip": "valuta",
  "addOnTrajanjeMin": 20,
  "stripe_payment_intent_id": null
}
```

**Field rules:**
- `serviceIds` — 1–3 service text IDs. Required. First is primary service; map to `"ID storitve"`, `"ID storitve 2"`, `"ID storitve 3"` in Termini.
- `employeeId` — specific employee. May be `null` when `any_person=true`.
- `any_person` — if `true`, run employee resolution logic (Section 7) before writing.
- `resursiIds` — array of resurs row IDs (bigint). May be empty `[]` if service uses no resources.
- `privacy_consent` — **required** to be `true`. Reject if `false`.
- `consent_timestamp` — ISO 8601 string. Store with customer record.
- `language` — `'sl'` or `'en'`. Used to select notification language.
- All promotion fields — optional. If present, write to Termini columns.
- `stripe_payment_intent_id` — `null` means payment not yet processed.

---

### Node Sequence

#### Node 1: Webhook entry (routed here by action=create)

#### Node 2: Code Node — Validate Required Fields
```javascript
const b = $input.first().json.body;
const missing = [];
if (!b.companySlug) missing.push('companySlug');
if (!b.date) missing.push('date');
if (!b.time) missing.push('time');
if (!b.serviceIds || b.serviceIds.length === 0) missing.push('serviceIds');
if (!b.firstName) missing.push('firstName');
if (!b.lastName) missing.push('lastName');
if (!b.email) missing.push('email');
if (!b.phone) missing.push('phone');
if (b.privacy_consent !== true) missing.push('privacy_consent must be true');

if (missing.length > 0) {
  return [{ json: { success: false, error: 'validation_error', message: missing.join(', '), fields: missing } }];
}
// Sanitize text inputs
b.firstName = b.firstName.replace(/<[^>]*>/g, '').trim().slice(0, 100);
b.lastName = b.lastName.replace(/<[^>]*>/g, '').trim().slice(0, 100);
b.notes = (b.notes || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
return [{ json: b }];
```

#### Node 3: Supabase — Fetch Company
- Filter: `slug` = `$companySlug`
- Verify: exists, plan is active

#### Node 4: Supabase — Fetch Services (for duration + name)
- Filter: `"ID storitve"` IN `$serviceIds`

#### Node 5: Code Node — Calculate Total Duration and End Time
```javascript
const services = $('Fetch Services').all().map(i => i.json);
const input = $('Validate').first().json;

let totalDurationMin = 0;
for (const svc of services) {
  totalDurationMin += parseInt(String(svc["Trajanje"]), 10) || 0;
}

const [h, m] = input.time.split(':').map(Number);
const startMin = h * 60 + m;
const endMin = startMin + totalDurationMin;
const endTime = `${String(Math.floor(endMin / 60)).padStart(2,'0')}:${String(endMin % 60).padStart(2,'0')}`;

return [{ json: { totalDurationMin, endTime, startTime: input.time } }];
```

#### Node 6: Supabase — Double-Check Slot Availability
```sql
SELECT id FROM "Termini"
WHERE "ID Osebe" = $employeeId
  AND "Datum" = $date
  AND "Status" NOT IN ('cancelled', 'no_show')
  AND "Čas" < $endTime
  AND "Konec" > $startTime
```
- **Note:** If `any_person=true`, skip this specific check here — it runs after employee resolution in Node 10.

**IF conflict found → return:**
```json
{ "success": false, "error": "slot_taken", "message": "Ta termin je bil medtem zaseden" }
```

#### Node 7: Supabase — Double-Check Resurs Availability
For each resurs_id in `resursiIds`:
```sql
SELECT COUNT(*) as booking_count
FROM "Termini_Resursi" tr
JOIN "Termini" t ON t.id = tr.termin_id
WHERE tr.resurs_id = $resursId
  AND t."Datum" = $date
  AND t."Status" NOT IN ('cancelled', 'no_show')
  AND t."Čas" < $endTime
  AND t."Konec" > $startTime
```
- Compare `booking_count` against the resurs `Kolicina × Kapaciteta` from the Resursi table.
- If at or over capacity → return `{ "success": false, "error": "resurs_taken", "message": "Resurs ni več na voljo" }`

#### Node 8: Supabase — Fetch Resursi (for capacity values)
- Filter: `id` IN `$resursiIds`
- Extract: `id`, `"Kolicina"`, `"Kapaciteta"`

#### Node 9: IF — any_person check
- If `any_person=false`: skip to Node 11 (use `employeeId` from input)
- If `any_person=true`: go to Node 10

#### Node 10: Code Node — Resolve Employee (any_person=true only)
```javascript
const input = $('Validate').first().json;
const date = input.date;
const startTime = input.time;
const endTime = $('Calculate Duration').first().json.endTime;
const eligibleIds = input.eligibleEmployeeIds || [];

// Fetch existing appointments for all eligible employees on this date
// (You need a Supabase node before this that fetches Termini for eligibleIds on this date)
const appointments = $('Fetch Employee Appointments').all().map(i => i.json);

// Count bookings per employee today
const bookingCount = {};
const startMin = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
const endMin = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

for (const emp of eligibleIds) {
  bookingCount[emp] = 0;
}

for (const appt of appointments) {
  const empId = appt["ID Osebe"];
  if (!bookingCount.hasOwnProperty(empId)) continue;

  // Check if this employee is free at requested time
  const apptStart = parseInt(appt["Čas"].split(':')[0]) * 60 + parseInt(appt["Čas"].split(':')[1]);
  const apptEnd = parseInt(appt["Konec"].split(':')[0]) * 60 + parseInt(appt["Konec"].split(':')[1]);

  if (startMin < apptEnd && endMin > apptStart) {
    // Conflict — mark this employee as unavailable
    bookingCount[empId] = 99999;
  } else {
    bookingCount[empId]++;
  }
}

// Find employee with lowest booking count (load balancing)
let resolvedEmployee = null;
let minCount = Infinity;
for (const emp of eligibleIds.sort()) { // sort alphabetically for tie-breaking
  if (bookingCount[emp] < minCount) {
    minCount = bookingCount[emp];
    resolvedEmployee = emp;
  }
}

if (!resolvedEmployee || minCount >= 99999) {
  return [{ json: { success: false, error: 'no_employee_available', message: 'Ni razpoložljivega izvajalca' } }];
}

return [{ json: { resolvedEmployeeId: resolvedEmployee } }];
```

**Add a Supabase node before Node 10 to fetch:**
```sql
SELECT "ID Osebe", "Čas", "Konec"
FROM "Termini"
WHERE "ID Osebe" = ANY($eligibleEmployeeIds)
  AND "Datum" = $date
  AND "Status" NOT IN ('cancelled', 'no_show')
```

#### Node 11: Code Node — Determine Final Employee ID
```javascript
const input = $('Validate').first().json;
const resolved = $('Resolve Employee').first()?.json;
const finalEmployeeId = input.any_person
  ? resolved?.resolvedEmployeeId
  : input.employeeId;
return [{ json: { finalEmployeeId } }];
```

#### Node 12: Supabase — Find or Create Customer

**Step A — Search for existing customer:**
```sql
SELECT * FROM "Stranke"
WHERE "Email" = $email AND "ID podjetja" = $companyId
LIMIT 1
```

**Step B — Code Node: branch on result**
- If found: use existing `"ID stranke"`, set `je_nova_stranka = false`
- If not found: generate new 8-char alphanumeric ID for `"ID stranke"`, set `je_nova_stranka = true`

**Step C — IF not found → Supabase INSERT into "Stranke":**
```json
{
  "ID stranke": "generated_8_char_id",
  "ID podjetja": "$companyId",
  "Ime": "$firstName",
  "Priimek": "$lastName",
  "Email": "$email",
  "Telefon": "$phone",
  "Spol": "$gender",
  "Opombe": "$notes",
  "GDPR marketing": "$marketing_consent"
}
```

**Generate 8-char ID (use in Code node):**
```javascript
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
```

#### Node 13: Code Node — Build Termini Row
```javascript
const input = $('Validate').first().json;
const company = $('Fetch Company').first().json;
const duration = $('Calculate Duration').first().json;
const finalEmployee = $('Final Employee').first().json;
const customer = $('Customer Result').first().json;
const stripe = input.stripe_enabled === true || company["stripe_enabled"] === true;

const terminId = generateId(); // 8-char text ID

const row = {
  "ID termina": terminId,
  "ID podjetja": company["ID Podjetja"],
  "ID Osebe": finalEmployee.finalEmployeeId,
  "ID storitve": input.serviceIds[0] || null,
  "ID storitve 2": input.serviceIds[1] || null,
  "ID storitve 3": input.serviceIds[2] || null,
  "Datum": input.date,
  "Čas": input.time,
  "Konec": duration.endTime,
  "Trajanje": String(duration.totalDurationMin),
  "Cena": String(input.originalCena || 0),
  "Popust": input.popust !== undefined ? String(input.popust) : null,
  "Popust type": input.popustTip || null,
  "Final cena": input.finalCena !== undefined ? String(input.finalCena) : String(input.originalCena || 0),
  "promocija_tip": input.promocijaTip || null,
  "promocija_naziv": input.promocijaNaziv || null,
  "Status": stripe ? 'pending_payment' : 'confirmed',
  "any_person": input.any_person === true,
  "eligible_employee_ids": input.any_person ? JSON.stringify(input.eligibleEmployeeIds) : null,
  "language": input.language || 'sl',
  "stripe_payment_intent_id": input.stripe_payment_intent_id || null,
  "payment_status": stripe ? 'pending' : null,
  "payment_amount": stripe ? computePaymentAmount(input, company) : null,
};

function computePaymentAmount(input, company) {
  const base = input.finalCena || input.originalCena || 0;
  const addOn = input.addOnFinalCena || 0;
  const total = base + addOn;
  if (company["stripe_payment_mode"] === 'deposit') {
    const pct = company["stripe_deposit_percent"] || 30;
    return Math.round(total * pct) / 100;
  }
  return total;
}

return [{ json: { row, terminId } }];
```

#### Node 14: Supabase — INSERT into "Termini"
- Table: `"Termini"`
- Operation: INSERT
- Data: Code node output `row`
- Return: inserted row (to get the `id` bigint auto-increment value)

#### Node 15: IF — resursiIds is non-empty

If `resursiIds.length > 0`:

#### Node 16: Supabase — INSERT into "Termini_Resursi" (one row per resurs)
Use a Loop node or SplitInBatches node to iterate over `resursiIds`:
```json
{
  "ID podjetja": "$companyId",
  "termin_id": "$termini_row_id_bigint",
  "resurs_id": "$resurs_id_bigint",
  "ID resursa": "$resurs_text_id"
}
```
**CRITICAL:** `termin_id` must be the bigint auto-increment `id` from the inserted Termini row (Node 14), NOT the text `"ID termina"`.

#### Node 17: IF — should send notifications now?
- Condition: `stripe_enabled=false` OR `stripe_payment_intent_id` is provided (payment already confirmed)
- If `true`: go to Node 18 (send notifications)
- If `false`: skip notifications, go to Node 20 (return response with requiresPayment=true)

#### Node 18: Send Company Notification Email
- To: company email address (from "Podatki podjetij")
- Subject: `Nova online rezervacija — ${firstName} ${lastName}`
- Body (HTML):
```
Nova rezervacija je bila oddana prek sistema Jedro+.

Stranka: ${firstName} ${lastName}
Email: ${email}
Telefon: ${phone}
Storitev: ${serviceNames joined with ' + '}
Izvajalec: ${resolvedEmployeeName}
Datum: ${date}
Ura: ${time} – ${endTime}
Opomba: ${notes || '-'}
```

#### Node 19: Send Customer Confirmation
**If language = 'sl':**
- Email Subject: `Potrjujemo vašo rezervacijo`
- Email Body (Slovenian):
```
Spoštovani/a ${firstName},

vaša rezervacija je potrjena!

Storitev: ${serviceNames}
Datum: ${formattedDate}
Ura: ${time}
Izvajalec: ${employeeName}

Čakamo vas! V primeru sprememb nas kontaktirajte.

Ekipa ${companyNaziv}
```
- SMS (no diacritics, max 160 chars):
```
Rezervacija potrjena! ${serviceNames} dne ${date} ob ${time}. Info: ${companyPhone}
```

**If language = 'en':**
- Email Subject: `Your booking is confirmed`
- Email Body (English):
```
Dear ${firstName},

Your booking is confirmed!

Service: ${serviceNames}
Date: ${formattedDate}
Time: ${time}
Specialist: ${employeeName}

We look forward to seeing you!

${companyNaziv} team
```
- SMS:
```
Booking confirmed! ${serviceNames} on ${date} at ${time}. Info: ${companyPhone}
```

#### Node 20: Respond to Webhook — Success

**If stripe_enabled=false (no payment required):**
```json
{
  "success": true,
  "terminId": "AB12CD34",
  "terminRowId": 42,
  "storitev": "Klasična masaža",
  "datum": "2026-06-15",
  "cas": "10:00",
  "konec": "11:00",
  "requiresPayment": false,
  "paymentAmount": 0,
  "je_nova_stranka": false
}
```

**If stripe_enabled=true (payment required):**
```json
{
  "success": true,
  "terminId": "AB12CD34",
  "terminRowId": 42,
  "storitev": "Klasična masaža",
  "datum": "2026-06-15",
  "cas": "10:00",
  "konec": "11:00",
  "requiresPayment": true,
  "paymentAmount": 45.00,
  "paymentMode": "full",
  "currency": "EUR",
  "je_nova_stranka": true
}
```

---

## SECTION 6 — ACTION: CHECK-SLOTS

**Purpose:** Lightweight check to verify a specific date+time is still available. Used as a final availability check just before showing the Stripe payment form (to avoid charging a customer for a slot that was just taken).

**HTTP Method:** POST

**Request Body:**

```json
{
  "action": "check-slots",
  "companySlug": "my-salon",
  "date": "2026-06-15",
  "time": "10:00",
  "serviceIds": ["SVC001", "SVC002"],
  "employeeId": "EMP001",
  "any_person": false,
  "eligibleEmployeeIds": ["EMP001"]
}
```

**Node Sequence:**

1. Validate input — companySlug, date, time, serviceIds required
2. Fetch services (for total duration)
3. Calculate endTime = time + totalDurationMin
4. If `any_person=false`:
   - Query Termini for employee+date overlap (same query as CREATE Node 6)
   - If conflict → return `{ "available": false, "reason": "slot_taken" }`
5. If `any_person=true`:
   - Check ALL eligible employees — if any one is free → available
   - If none free → return `{ "available": false, "reason": "no_employee_available" }`
6. Check resursi capacity (same as CREATE Node 7)
   - If blocked → return `{ "available": false, "reason": "resurs_taken" }`
7. Return `{ "available": true }`

**Response Shape:**

```json
{ "available": true }
{ "available": false, "reason": "slot_taken" }
{ "available": false, "reason": "no_employee_available" }
{ "available": false, "reason": "resurs_taken" }
```

---

## SECTION 7 — EMPLOYEE RESOLUTION LOGIC

### Overview

The frontend sends `any_person: true` when the user selects "Kdorkoli prost" (Anyone available). In this case, the specific employee is not known at booking time and must be resolved by the workflow.

### eligibleEmployeeIds — How the Frontend Computes This

The frontend computes `eligibleEmployeeIds` as the **intersection** of employees that appear in `employeesByServiceId` for **every** selected service:

```typescript
// Pseudocode — this runs in the browser, not n8n
const eligible = serviceIds.reduce((acc, svcId) => {
  const empIds = employeesByServiceId[svcId] || allEmployeeIds;
  return acc.filter(id => empIds.includes(id));
}, allEmployeeIds);
```

This means: `eligibleEmployeeIds` is already validated by the frontend before being sent to n8n. The n8n workflow trusts this list.

### For the SLOTS Action

When `any_person=true`, the SLOTS workflow considers the **union** of all eligible employee schedules. A time slot is marked available if **at least one** eligible employee is free at that time.

This is already implemented in the Code node in Section 4 (the outer loop iterates over all eligible employees and collects unique available slots via a Set).

### For the CREATE Action

At booking time, n8n must pick **one specific employee** from `eligibleEmployeeIds`. The selection algorithm:

1. Fetch all existing appointments for all eligible employees on the requested date
2. For each eligible employee:
   - Check if they are free at `time` to `endTime` (no conflicts)
   - Count how many appointments they already have that day
3. Select the free employee with the **fewest bookings** that day (load balancing)
4. If two employees have equal bookings: pick the first one **alphabetically by ID** (deterministic tie-breaking)
5. If no eligible employee is free: return `{ "success": false, "error": "no_employee_available" }`

### What Gets Written to "Termini"

```json
{
  "ID Osebe": "EMP002",
  "any_person": true,
  "eligible_employee_ids": "[\"EMP001\",\"EMP002\",\"EMP003\"]"
}
```

The `eligible_employee_ids` column stores the original eligible list as a JSON string, for audit purposes.

### Multi-Service + Any_Person

When multiple services are selected with `any_person=true`, the intersection logic still applies — `eligibleEmployeeIds` on the frontend already represents only employees that can do ALL selected services. n8n does not need to recompute this.

---

## SECTION 8 — MULTI-SERVICE LOGIC

### Employee Eligibility for Multiple Services

An employee is only eligible if they appear in `employeesByServiceId` for **every** serviceId in the selection. This intersection is computed by the frontend (in `bookingStore.ts`) and sent as `eligibleEmployeeIds`.

**If the frontend sends an empty `eligibleEmployeeIds` array** with multiple services, it means no single employee can perform all selected services. The n8n workflow must handle this:

In the CREATE action, after validating input, add an IF node:
- If `eligibleEmployeeIds.length === 0` AND `serviceIds.length > 1`:
```json
{
  "success": false,
  "error": "no_employee_for_combination",
  "message": "Ta kombinacija storitev ni na voljo pri enem izvajalcu",
  "serviceIds": ["SVC001", "SVC002"]
}
```

### Duration Calculation

When multiple services are selected, the total duration is the **sum** of all service durations:

```
totalDurationMin = service1.trajanjeMin + service2.trajanjeMin + ... + serviceN.trajanjeMin
```

This entire block is booked **consecutively** with the **same employee** in a single appointment record. Do not create separate appointment records per service.

**Example:**
- Service A: 60 min, Service B: 30 min → `totalDurationMin = 90`
- Start: 10:00 → End: 11:30
- One row in "Termini" with `"Čas"="10:00"`, `"Konec"="11:30"`, `"ID storitve"="SVC_A"`, `"ID storitve 2"="SVC_B"`

### Writing Multiple Services to "Termini"

```
serviceIds[0] → "ID storitve"    (required)
serviceIds[1] → "ID storitve 2"  (null if only one service)
serviceIds[2] → "ID storitve 3"  (null if fewer than 3 services)
```

### Resource Handling with Multiple Services

1. Collect all resurs IDs needed by each service (from storitveResursiMap)
2. **Deduplicate** — if two services need the same resurs_id, include it only once
3. Check availability for all unique resurs IDs over the full `totalDurationMin` window
4. At booking time, insert one row per unique resurs_id into `"Termini_Resursi"`

```javascript
// Deduplicate resursi across all services
const allResursIds = new Set();
for (const svcId of serviceIds) {
  const resursForService = storitveResursiMap[svcId] || [];
  for (const rId of resursForService) allResursIds.add(rId);
}
const uniqueResursIds = Array.from(allResursIds);
```

---

## SECTION 9 — STRIPE INTEGRATION

### Overview

Stripe payments are handled in TWO workflows:

1. **Main booking workflow** (this document) — saves appointment with `Status='pending_payment'`, returns payment info, does NOT send notifications yet
2. **Stripe webhook workflow** (separate) — triggered by Stripe, confirms the appointment and sends notifications

### Flow in Main Booking Workflow (CREATE action)

When `company.stripe_enabled = true` AND `input.stripe_payment_intent_id` is null:

1. Run all validation, slot checks, employee resolution, customer find-or-create normally
2. Write appointment to `"Termini"` with:
   - `"Status"`: `'pending_payment'`
   - `"payment_status"`: `'pending'`
   - `"payment_amount"`: computed amount (see below)
   - `"stripe_payment_intent_id"`: null (will be filled by Stripe webhook)
3. Write `"Termini_Resursi"` rows normally (reserve the resources)
4. **DO NOT send notifications**
5. Return response:
```json
{
  "success": true,
  "terminId": "AB12CD34",
  "terminRowId": 42,
  "requiresPayment": true,
  "paymentAmount": 45.00,
  "paymentMode": "full",
  "currency": "EUR",
  "storitev": "Klasična masaža",
  "datum": "2026-06-15",
  "cas": "10:00",
  "konec": "11:00",
  "je_nova_stranka": false
}
```

### Payment Amount Calculation
```javascript
const baseCena = finalCena || originalCena || 0;
const addOnCena = addOnFinalCena || 0;
const total = baseCena + addOnCena;

let paymentAmount;
if (stripe_payment_mode === 'deposit') {
  paymentAmount = Math.round(total * stripe_deposit_percent) / 100;
} else {
  paymentAmount = total; // full amount
}
```

### Stripe Webhook Workflow (Separate Workflow)

**Webhook URL:** `POST https://n8n.jedroplus.com/webhook/stripe-booking`

**Trigger event:** `payment_intent.succeeded`

**Node Sequence:**

#### Node 1: Webhook
- Path: `/stripe-booking`
- Method: POST

#### Node 2: Code Node — Verify Stripe Signature
```javascript
// Use the Stripe library or manual HMAC verification
// stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
// If verification fails, return HTTP 400
const sig = $input.first().json.headers['stripe-signature'];
const body = $input.first().json.rawBody; // raw body required for signature verification
// ... verification logic
```
**Important:** The n8n Webhook node must be configured to expose the raw body for signature verification.

#### Node 3: Code Node — Extract terminId from Stripe metadata
```javascript
const event = $input.first().json.body;
if (event.type !== 'payment_intent.succeeded') {
  return [{ json: { skip: true } }];
}
const pi = event.data.object;
const terminId = pi.metadata?.terminId;
const paymentIntentId = pi.id;
const amountPaid = pi.amount_received / 100; // Stripe stores in cents

return [{ json: { terminId, paymentIntentId, amountPaid } }];
```

#### Node 4: IF — skip if terminId missing
- If `skip=true` or `terminId` is null → return HTTP 200 (ignore event)

#### Node 5: Supabase — Update "Termini"
```sql
UPDATE "Termini"
SET "Status" = 'confirmed',
    "stripe_payment_intent_id" = $paymentIntentId,
    "payment_status" = 'paid',
    "payment_amount" = $amountPaid
WHERE "ID termina" = $terminId
RETURNING *
```

#### Node 6: Supabase — Fetch full booking details for notification
```sql
SELECT t.*, s."Naziv" as storitev_naziv, o."Ime", o."Priimek",
       str."Email", str."Ime" as stranka_ime, str."Priimek" as stranka_priimek,
       str."Telefon"
FROM "Termini" t
JOIN "Storitve" s ON s."ID storitve" = t."ID storitve"
JOIN "Osebe" o ON o."ID Osebe" = t."ID Osebe"
JOIN "Stranke" str ON str."ID stranke" = t."ID stranke"
WHERE t."ID termina" = $terminId
```

#### Node 7: Send Company Notification (same as Section 5, Node 18)

#### Node 8: Send Customer Confirmation (same as Section 5, Node 19 — use `language` from Termini row)

#### Node 9: Respond to Webhook
- HTTP 200
- Body: `{ "received": true }`

---

### New Columns for "Termini" (already listed in BEFORE YOU START)

```sql
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "payment_status" text;
ALTER TABLE "Termini" ADD COLUMN IF NOT EXISTS "payment_amount" numeric(10,2);
```

---

## SECTION 10 — NOTIFICATION LOGIC

### When Notifications Are Sent

| Scenario | When to send |
|---|---|
| Standard booking (no Stripe) | Immediately after `"Termini"` INSERT — in CREATE workflow |
| Stripe payment required | After `payment_intent.succeeded` webhook fires — in Stripe webhook workflow |
| Stripe payment already confirmed (payment_intent_id in payload) | Immediately in CREATE workflow |

### Company Notification (always required)

- **Channel:** Email
- **To:** Company email address from `"Podatki podjetij"` (add an `email` or `"Email"` column if not present)
- **Subject:** `Nova online rezervacija — [Ime Priimek]`
- **Language:** Always Slovenian (company language)
- **Body must include:**
  - Customer full name, email, phone
  - Service name(s) — if multiple, join with ` + `
  - Employee name
  - Date (formatted `d. M. yyyy`)
  - Time and end time
  - Notes/Opombe (if provided)
  - Whether new customer: `je_nova_stranka = true` → add note "Nova stranka!"
  - Promotion used (if any): discount name + amount

### Customer Confirmation Email

**Slovenian (language='sl'):**
- Subject: `Vaša rezervacija je potrjena ✓`
- Must include: service, date, time, employee, price, add-on (if selected)
- Sign off as company name

**English (language='en'):**
- Subject: `Your booking is confirmed ✓`
- Same structure, in English

### Customer SMS

**Rules:**
- Maximum 160 characters
- **No diacritics** (replace: č→c, š→s, ž→z, Č→C, Š→S, Ž→Z, ć→c, đ→d)
- Include: service (abbreviated), date, time, company name

**Slovenian template:**
```
Rezervacija potrjena! [Storitev] dne [dd.MM.] ob [HH:mm]. [Podjetje nazaj]. Info: [tel]
```

**English template:**
```
Booking confirmed! [Service] on [dd.MM.] at [HH:mm]. [Company]. Info: [tel]
```

---

## SECTION 11 — ERROR HANDLING

All error responses use HTTP 200 with `success: false` in the body (the frontend checks `response.success` not HTTP status), **except for** HTTP 404/403 on init (as noted in Section 3).

### Complete Error Response Catalog

```json
{ "success": false, "error": "company_not_found", "message": "Podjetje ne obstaja" }
```
*When:* `init`, `slots`, `create` — companySlug not found in "Podatki podjetij"

```json
{ "success": false, "error": "plan_invalid", "message": "Podjetje nima aktivnega plana" }
```
*When:* `init`, `create` — company found but plan is not active

```json
{ "success": false, "error": "slot_taken", "message": "Ta termin je bil medtem zaseden" }
```
*When:* `create`, `check-slots` — time slot occupied by another appointment

```json
{ "success": false, "error": "resurs_taken", "message": "Resurs ni več na voljo" }
```
*When:* `create`, `check-slots` — required resource at full capacity

```json
{ "success": false, "error": "no_employee_available", "message": "Ni razpoložljivega izvajalca" }
```
*When:* `create` with `any_person=true` — no eligible employee is free at the requested time

```json
{
  "success": false,
  "error": "no_employee_for_combination",
  "message": "Ta kombinacija storitev ni na voljo pri enem izvajalcu",
  "serviceIds": ["SVC001", "SVC002"]
}
```
*When:* `create` with multiple serviceIds where no single employee can perform all

```json
{
  "success": false,
  "error": "validation_error",
  "message": "companySlug required, email required",
  "fields": ["companySlug", "email"]
}
```
*When:* Any action — required field missing or invalid

### Error Handling in Every Branch

Every IF node that checks for errors (company not found, slot conflict, etc.) must route to a "Respond to Webhook" node with the appropriate error JSON. Never let a branch fall through to the success response with missing data.

---

## SECTION 12 — SQL STATEMENTS (COMPLETE REFERENCE)

### New Columns — Run Once Before Deploying

```sql
-- ══════════════════════════════════════════════════════════════════
-- "Podatki podjetij" — Company Settings
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE "Podatki podjetij"
  ADD COLUMN IF NOT EXISTS "prikaz_zaposlenih_rezervacija" boolean DEFAULT true;

ALTER TABLE "Podatki podjetij"
  ADD COLUMN IF NOT EXISTS "max_dnevi_rezervacija" integer DEFAULT 60;

ALTER TABLE "Podatki podjetij"
  ADD COLUMN IF NOT EXISTS "stripe_enabled" boolean DEFAULT false;

ALTER TABLE "Podatki podjetij"
  ADD COLUMN IF NOT EXISTS "stripe_payment_mode" text DEFAULT 'full';
  -- CHECK constraint (optional): CHECK ("stripe_payment_mode" IN ('full', 'deposit'))

ALTER TABLE "Podatki podjetij"
  ADD COLUMN IF NOT EXISTS "stripe_deposit_percent" integer DEFAULT 30;
  -- CHECK constraint (optional): CHECK ("stripe_deposit_percent" BETWEEN 0 AND 100)


-- ══════════════════════════════════════════════════════════════════
-- "Termini" — Appointments
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "any_person" boolean DEFAULT false;

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "eligible_employee_ids" text;
  -- Stores JSON array string: '["EMP001","EMP002"]'

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text;

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "payment_status" text;
  -- Valid values: NULL, 'pending', 'paid', 'refunded'

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "payment_amount" numeric(10,2);

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'sl';
  -- Valid values: 'sl', 'en'

ALTER TABLE "Termini"
  ADD COLUMN IF NOT EXISTS "assigned_employee_ids" text;
  -- For any_person bookings: stores resolved employee ID(s) as JSON string


-- ══════════════════════════════════════════════════════════════════
-- Indexes (recommended for performance)
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_termini_datum_oseba
  ON "Termini" ("Datum", "ID Osebe");

CREATE INDEX IF NOT EXISTS idx_termini_idpodjetja
  ON "Termini" ("ID podjetja");

CREATE INDEX IF NOT EXISTS idx_termini_stripe_payment_intent
  ON "Termini" ("stripe_payment_intent_id")
  WHERE "stripe_payment_intent_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_termini_resursi_resurs_id
  ON "Termini_Resursi" (resurs_id);

CREATE INDEX IF NOT EXISTS idx_termini_resursi_termin_id
  ON "Termini_Resursi" (termin_id);


-- ══════════════════════════════════════════════════════════════════
-- RLS Policy Reminder
-- ══════════════════════════════════════════════════════════════════
-- The n8n workflow uses the service_role key, which bypasses RLS.
-- No RLS changes are needed for n8n writes.
-- The frontend uses the anon key for Supabase direct reads (promotions tables).
-- Verify that the anon key has SELECT access on:
--   popusti, popusti_storitve, happy_hours, happy_hours_storitve,
--   add_on_storitve, Osebe (only Storitve column), Termini (only Čas, Konec columns)
```

---

## APPENDIX A — Node Naming Convention

Use these exact names in n8n for consistency with this document:

| Node Purpose | Suggested n8n Node Name |
|---|---|
| Webhook entry | `Booking Webhook` |
| Action routing IF | `Route: init / slots / create / check-slots` |
| Fetch company | `Supabase: Fetch Company` |
| Fetch services | `Supabase: Fetch Services` |
| Fetch employees | `Supabase: Fetch Employees` |
| Fetch resursi | `Supabase: Fetch Resursi` |
| Fetch Storitve_Resursi | `Supabase: Fetch Storitve_Resursi` |
| Build init response | `Code: Build InitResponse` |
| Validate create input | `Code: Validate Create Input` |
| Calculate duration + endTime | `Code: Calculate Duration` |
| Check slot availability | `Supabase: Double-Check Slot` |
| Check resurs availability | `Supabase: Double-Check Resursi` |
| Resolve any_person employee | `Code: Resolve Employee` |
| Find or create customer | `Supabase: Find Customer` + `Supabase: Create Customer` |
| Build Termini row | `Code: Build Termini Row` |
| Insert appointment | `Supabase: Insert Termini` |
| Insert resursi rows | `Supabase: Insert Termini_Resursi` |
| Send company email | `Email: Company Notification` |
| Send customer email | `Email: Customer Confirmation` |
| Send customer SMS | `SMS: Customer Confirmation` |
| Return success | `Respond: Success` |
| Return error | `Respond: Error [type]` |

---

## APPENDIX B — Data Type Reference

When mapping Supabase data to JSON for the frontend, normalize these types:

| Column Type | JavaScript / JSON |
|---|---|
| bigint (Supabase returns as string) | `parseInt(value, 10)` |
| numeric / decimal | `parseFloat(value)` |
| boolean | `value === true` (Supabase returns actual boolean) |
| date (`yyyy-MM-dd`) | Keep as string — do not convert to Date object |
| time (`HH:mm` or `HH:mm:ss`) | Normalize to `HH:mm` — slice to first 5 chars |
| JSON text column | `JSON.parse(value || '[]')` — always wrap in try/catch |
| null | Pass through as `null` |

---

## APPENDIX C — Quick Reference: Which Fields Go Where

### "Termini" column mapping from create payload

```
input.date              → "Datum"
input.time              → "Čas"
calculated endTime      → "Konec"
input.serviceIds[0]     → "ID storitve"
input.serviceIds[1]     → "ID storitve 2"    (null if absent)
input.serviceIds[2]     → "ID storitve 3"    (null if absent)
input.originalCena      → "Cena"
input.popust            → "Popust"
input.popustTip         → "Popust type"      ('% ' or 'valuta')
input.finalCena         → "Final cena"
input.promocijaTip      → "promocija_tip"
input.promocijaNaziv    → "promocija_naziv"
input.any_person        → "any_person"
input.eligibleEmployeeIds → "eligible_employee_ids"  (JSON string)
input.language          → "language"
input.stripe_payment_intent_id → "stripe_payment_intent_id"
resolved employeeId     → "ID Osebe"
```

### "Stranke" column mapping from create payload

```
input.firstName         → "Ime"
input.lastName          → "Priimek"
input.email             → "Email"
input.phone             → "Telefon"
input.gender            → "Spol"
input.notes             → "Opombe"
input.marketing_consent → "GDPR marketing"
```
