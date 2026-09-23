/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatBookingPrice } from '@/lib/pricing';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseHeaders = {
  'apikey': SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
  'Content-Type': 'application/json',
}

export interface ServicePromotion {
  id: string
  storitevId: string
  type: 'popust' | 'happy_hour'
  naziv: string
  tipPopusta: 'percentage' | 'fixed'
  vrednost: number
  originalCena: number
  finalCena: number
  popustZnesek: number
  badgeLabel: string
}

export interface AddOnOption {
  id: string
  storitevId: string
  naziv: string
  trajanjeMin: number
  originalCena: number
  finalCena: number
  popustZnesek: number
  tipPopusta: 'percentage' | 'fixed'
  vrednost: number
  badgeLabel: string
}

export function calculateDiscount(
  originalCena: number,
  tipPopusta: string,
  vrednost: number
): { finalCena: number; popustZnesek: number } {
  if (tipPopusta === 'percentage') {
    const popustZnesek = (originalCena * vrednost) / 100
    return { finalCena: Math.max(0, originalCena - popustZnesek), popustZnesek }
  } else {
    return {
      finalCena: Math.max(0, originalCena - vrednost),
      popustZnesek: vrednost,
    }
  }
}

function buildPromotion(
  id: string,
  storitevId: string,
  type: 'popust' | 'happy_hour',
  naziv: string,
  tipPopusta: string,
  vrednost: number,
  originalCena: number
): ServicePromotion {
  const { finalCena, popustZnesek } = calculateDiscount(originalCena, tipPopusta, vrednost)
  return {
    id,
    storitevId,
    type,
    naziv,
    tipPopusta: tipPopusta as 'percentage' | 'fixed',
    vrednost,
    originalCena,
    finalCena,
    popustZnesek,
    badgeLabel: tipPopusta === 'percentage'
      ? `-${vrednost}%`
      : `-${formatBookingPrice(vrednost)}`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fetch active discounts for all services of a company
//    NOTE: Callers must enrich originalCena after receiving the result —
//    the API does not store the current service price; it must be merged from
//    the services array returned by fetchInitData.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchActiveDiscounts(
  companyId: string,
  serviceIds: string[]
): Promise<Record<string, ServicePromotion>> {
  try {
    if (!companyId || serviceIds.length === 0) return {}
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {}

    const today = new Date().toISOString().split('T')[0]
    const url = `${SUPABASE_URL}/rest/v1/popusti?select=*&company_id=eq.${companyId}&aktiven=eq.true&datum_zacetek=lte.${today}&datum_konec=gte.${today}`

    const discountsRes = await fetch(url, { headers: supabaseHeaders })

    if (!discountsRes.ok) return {}

    const discounts = await discountsRes.json()

    if (!discounts?.length) return {}

    const discountIds = discounts.map((d: any) => d.id).join(',')
    const linksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/popusti_storitve?select=*&popust_id=in.(${discountIds})`,
      { headers: supabaseHeaders }
    )
    const links = await linksRes.json()

    const result: Record<string, ServicePromotion> = {}

    for (const discount of discounts) {
      // Find join rows for this specific discount
      const discountLinks = (links ?? []).filter((l: any) => l.popust_id === discount.id)

      // If no join rows exist → discount applies to ALL services
      const targetServiceIds = discountLinks.length === 0
        ? serviceIds
        : discountLinks.map((l: any) => String(l.storitev_id)).filter((sid: string) => serviceIds.includes(sid))

      for (const sid of targetServiceIds) {
        // Only set if not already set by a previous discount (first discount wins)
        if (!result[sid]) {
          result[sid] = buildPromotion(
            String(discount.id),
            sid,
            'popust',
            discount.naziv,
            discount.tip_popusta,
            Number(discount.vrednost),
            0
          )
        }
      }
    }

    return result
  } catch {
    return {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Fetch all happy-hour ranges for a company / service / day — used to
//     render badges on time-slot buttons before the user clicks.
// ─────────────────────────────────────────────────────────────────────────────
export interface HappyHourRange {
  startMin: number
  endMin: number
  label: string
}

export async function fetchHappyHoursForDay(
  companyId: string,
  storitevId: string,
  date: Date
): Promise<HappyHourRange[]> {
  if (!companyId || !storitevId || !date) return []
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  try {
    const dayOfWeek = date.getDay()

    const hhRes = await fetch(
      `${SUPABASE_URL}/rest/v1/happy_hours?select=*,happy_hours_storitve(storitev_id)&company_id=eq.${companyId}&aktiven=eq.true`,
      { headers: supabaseHeaders }
    )
    if (!hhRes.ok) return []
    const happyHours = await hhRes.json()
    if (!happyHours?.length) return []

    const result: HappyHourRange[] = []

    for (const hh of happyHours) {
      const days: number[] = hh.dnevi_v_tednu || []
      if (!days.includes(dayOfWeek)) continue

      if (!hh.vse_storitve) {
        const links: Array<{ storitev_id: number | string }> = hh.happy_hours_storitve || []
        const applies = links.some((l) => String(l.storitev_id) === String(storitevId))
        if (!applies) continue
      }

      const [sh, sm] = (hh.cas_zacetek || '00:00').split(':').map(Number)
      const [eh, em] = (hh.cas_konec || '23:59').split(':').map(Number)

      const label =
        hh.tip_popusta === 'percentage'
          ? `-${hh.vrednost}%`
          : `-${formatBookingPrice(Number(hh.vrednost))}`

      result.push({ startMin: sh * 60 + sm, endMin: eh * 60 + em, label })
    }

    return result
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Check happy hour for a specific service + date + time
// ─────────────────────────────────────────────────────────────────────────────
export async function checkHappyHour(
  companyId: string,
  storitevId: string,
  date: Date,
  time: string
): Promise<ServicePromotion | null> {
  if (!companyId || !storitevId || !date || !time) return null

  const dayOfWeek = date.getDay()

  const hhRes = await fetch(
    `${SUPABASE_URL}/rest/v1/happy_hours?select=*&company_id=eq.${companyId}&aktiven=eq.true`,
    { headers: supabaseHeaders }
  )
  const happyHours = await hhRes.json()
  if (!happyHours?.length) return null

  const matching = happyHours.filter((hh: any) => {
    const days: number[] = hh.dnevi_v_tednu || []
    if (!days.includes(dayOfWeek)) return false
    const [h, m] = time.split(':').map(Number)
    const [sh, sm] = (hh.cas_zacetek || '00:00').split(':').map(Number)
    const [eh, em] = (hh.cas_konec || '23:59').split(':').map(Number)
    const timeMin = h * 60 + m
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    return timeMin >= startMin && timeMin < endMin
  })

  if (!matching.length) return null

  for (const hh of matching) {
    if (hh.vse_storitve) {
      return buildPromotion(String(hh.id), storitevId, 'happy_hour', 'Happy Hour',
        hh.tip_popusta, hh.vrednost, 0)
    }
    const linkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/happy_hours_storitve?select=*&happy_hour_id=eq.${hh.id}&storitev_id=eq.${storitevId}`,
      { headers: supabaseHeaders }
    )
    const links = await linkRes.json()
    if (links?.length) {
      return buildPromotion(String(hh.id), storitevId, 'happy_hour', 'Happy Hour',
        hh.tip_popusta, hh.vrednost, 0)
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fetch available add-ons for employee + service + time
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAvailableAddOns(
  companyId: string,
  mainStoritevId: string,
  employeeId: string,
  date: Date,
  endTime: string,
  allServices: Array<{ id: string; naziv: string; trajanjeMin: number; cena: number }>
): Promise<AddOnOption[]> {
  if (!companyId || !employeeId) return []

  const addOnsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/add_on_storitve?select=*&company_id=eq.${companyId}&aktiven=eq.true`,
    { headers: supabaseHeaders }
  )
  const addOns = await addOnsRes.json()
  if (!addOns?.length) return []

  const employeeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/Osebe?select=id,Storitve,"Ali opravlja vse"&id=eq.${employeeId}`,
    { headers: supabaseHeaders }
  )
  const employeeData = await employeeRes.json()
  const doesAll: boolean = employeeData?.[0]?.['Ali opravlja vse'] === true
  let employeeServiceIds: string[] = []
  try {
    const raw = employeeData?.[0]?.Storitve
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      employeeServiceIds = Array.isArray(parsed) ? parsed.map(String) : []
    }
  } catch { employeeServiceIds = [] }

  const dateStr = date.toISOString().split('T')[0]
  const terminiRes = await fetch(
    `${SUPABASE_URL}/rest/v1/Termini?select="Čas","Konec"&"ID Osebe"=eq.${employeeId}&Datum=eq.${dateStr}`,
    { headers: supabaseHeaders }
  )
  const termini = await terminiRes.json() || []

  const result: AddOnOption[] = []

  for (const addOn of addOns) {
    const sId = String(addOn.storitev_id)

    if (sId === String(mainStoritevId)) continue
    if (!doesAll && employeeServiceIds.length > 0 && !employeeServiceIds.includes(sId)) continue

    const service = allServices.find(s => String(s.id) === sId)
    if (!service) continue

    const [eh, em] = endTime.split(':').map(Number)
    const endMinutes = eh * 60 + em
    const addOnEndMinutes = endMinutes + service.trajanjeMin

    const conflict = termini.some((t: any) => {
      const [sh, sm] = (t['Čas'] || '00:00').split(':').map(Number)
      const [kh, km] = (t['Konec'] || '00:00').split(':').map(Number)
      const tStart = sh * 60 + sm
      const tEnd = kh * 60 + km
      return tStart < addOnEndMinutes && tEnd > endMinutes
    })

    if (conflict) continue

    const originalCena = service.cena
    const { finalCena, popustZnesek } = calculateDiscount(
      originalCena, addOn.tip_popusta, addOn.vrednost_popusta
    )

    result.push({
      id: addOn.id,
      storitevId: sId,
      naziv: service.naziv,
      trajanjeMin: service.trajanjeMin,
      originalCena,
      finalCena,
      popustZnesek,
      tipPopusta: addOn.tip_popusta,
      vrednost: addOn.vrednost_popusta,
      badgeLabel: addOn.tip_popusta === 'percentage'
        ? `-${addOn.vrednost_popusta}%`
        : `-${formatBookingPrice(addOn.vrednost_popusta)}`,
    })
  }

  return result
}
