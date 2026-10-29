// Seasonal design: which holiday or season to dress the page for, depending
// on the salon's country (Jedro+ "country_code") and today's date. Holidays
// show during the week or so before them; shorter windows are checked first so
// a longer one around them does not hide them.

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Holiday =
  | 'christmas'
  | 'newyear'
  | 'valentine'
  | 'pust'
  | 'womensday'
  | 'mothersday'
  | 'easter'
  | 'martinovo'
  | 'miklavz'
  | 'befana'
  | 'halloween'
  | 'thanksgiving'
  | null;

export interface SeasonalThemeConfig {
  /** Display name in the page language. */
  name: string;
  // Light seasonal background gradient
  bgFrom: string;
  bgTo: string;
  // Solid white content card surfaces
  cardBg: string;
  cardBgAlt: string;
  cardBgHover: string;
  cardBorder: string;
  // Decorations
  snowflakes?: boolean;
  flowers?: boolean;
  leaves?: boolean;
  sunRays?: boolean;
  waves?: boolean;
  santaHats?: boolean;
  ornaments?: boolean;
  hearts?: boolean;
  eggs?: boolean;
  bunnies?: boolean;
  fireworks?: boolean;
  confetti?: boolean;
  // Accent color (used for glows, borders, accents)
  accentColor: string;
  // Heading font — defaults to Stardom; holiday variants may use their own
  headingFont?: string;
}

export interface SeasonalTheme {
  season: Season;
  holiday: Holiday;
  config: SeasonalThemeConfig;
}

type Look = Omit<SeasonalThemeConfig, 'name'>;
type Key = Exclude<Holiday, null> | Season;

const NAMES: Record<Key, { sl: string; en: string }> = {
  christmas: { sl: 'Božič', en: 'Christmas' },
  newyear: { sl: 'Novo leto', en: 'New Year' },
  valentine: { sl: 'Valentinovo', en: "Valentine's Day" },
  pust: { sl: 'Pust', en: 'Carnival' },
  womensday: { sl: 'Dan žena', en: "Women's Day" },
  mothersday: { sl: 'Materinski dan', en: "Mother's Day" },
  easter: { sl: 'Velika noč', en: 'Easter' },
  martinovo: { sl: 'Martinovo', en: "St. Martin's Day" },
  miklavz: { sl: 'Miklavž', en: 'St. Nicholas' },
  befana: { sl: 'Befana', en: 'Epiphany' },
  halloween: { sl: 'Noč čarovnic', en: 'Halloween' },
  thanksgiving: { sl: 'Zahvalni dan', en: 'Thanksgiving' },
  winter: { sl: 'Zima', en: 'Winter' },
  spring: { sl: 'Pomlad', en: 'Spring' },
  summer: { sl: 'Poletje', en: 'Summer' },
  autumn: { sl: 'Jesen', en: 'Autumn' },
};

const HOLIDAY_LOOK: Record<Exclude<Holiday, null>, Look> = {
  christmas: {
    bgFrom: '#F3FFF5', bgTo: '#FFF9F0',
    cardBg: '#FFFFFF', cardBgAlt: '#F9FDFB', cardBgHover: '#F4FAF6', cardBorder: '#D6EDDA',
    snowflakes: true, ornaments: true, santaHats: true,
    accentColor: '#16A34A',
    headingFont: 'var(--font-stardom)',
  },
  newyear: {
    bgFrom: '#F8F6FF', bgTo: '#F0F8FF',
    cardBg: '#FFFFFF', cardBgAlt: '#F9F8FF', cardBgHover: '#F4F2FF', cardBorder: '#DDD8F5',
    snowflakes: true, fireworks: true, confetti: true,
    accentColor: '#7C3AED',
    headingFont: 'var(--font-stardom)',
  },
  valentine: {
    bgFrom: '#FFF5F8', bgTo: '#FFF0F5',
    cardBg: '#FFFFFF', cardBgAlt: '#FFF8FB', cardBgHover: '#FFF2F6', cardBorder: '#F9C0D0',
    hearts: true,
    accentColor: '#E11D48',
    headingFont: 'var(--font-stardom)',
  },
  pust: {
    bgFrom: '#FFF9EE', bgTo: '#F4F2FF',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFCF5', cardBgHover: '#FFF7E8', cardBorder: '#EBD9B5',
    confetti: true,
    accentColor: '#C2410C',
    headingFont: 'var(--font-stardom)',
  },
  womensday: {
    bgFrom: '#FFF5F8', bgTo: '#FFF8F2',
    cardBg: '#FFFFFF', cardBgAlt: '#FFF8FB', cardBgHover: '#FFF2F6', cardBorder: '#F5C6D6',
    flowers: true,
    accentColor: '#BE185D',
    headingFont: 'var(--font-stardom)',
  },
  mothersday: {
    bgFrom: '#FFF6F9', bgTo: '#F6FFF8',
    cardBg: '#FFFFFF', cardBgAlt: '#FFF9FB', cardBgHover: '#FFF3F7', cardBorder: '#F2CADA',
    flowers: true, hearts: true,
    accentColor: '#BE185D',
    headingFont: 'var(--font-stardom)',
  },
  easter: {
    bgFrom: '#F5F0FF', bgTo: '#F0FFF8',
    cardBg: '#FFFFFF', cardBgAlt: '#FAF8FF', cardBgHover: '#F3F0FF', cardBorder: '#DDD0F5',
    flowers: true, eggs: true, bunnies: true,
    accentColor: '#7C3AED',
    headingFont: 'var(--font-stardom)',
  },
  martinovo: {
    bgFrom: '#FFF8F3', bgTo: '#FBF1EC',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFBF8', cardBgHover: '#FDF4EF', cardBorder: '#EBCFC2',
    leaves: true,
    accentColor: '#9F1239',
    headingFont: 'var(--font-stardom)',
  },
  miklavz: {
    bgFrom: '#FFF6F6', bgTo: '#F3F7FF',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFAFA', cardBgHover: '#FFF2F2', cardBorder: '#F2CFCF',
    snowflakes: true,
    accentColor: '#B91C1C',
    headingFont: 'var(--font-stardom)',
  },
  befana: {
    bgFrom: '#F6F3FF', bgTo: '#FFF8EE',
    cardBg: '#FFFFFF', cardBgAlt: '#FAF8FF', cardBgHover: '#F4F0FF', cardBorder: '#DDD3F2',
    snowflakes: true,
    accentColor: '#6D28D9',
    headingFont: 'var(--font-stardom)',
  },
  halloween: {
    bgFrom: '#FFF8F0', bgTo: '#FFF4E8',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFAF6', cardBgHover: '#FFF6EE', cardBorder: '#F5D8B0',
    leaves: true,
    accentColor: '#EA580C',
    headingFont: 'var(--font-stardom)',
  },
  thanksgiving: {
    bgFrom: '#FFFBF0', bgTo: '#FFF7E6',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFDF8', cardBgHover: '#FFF9EE', cardBorder: '#EDD8A8',
    leaves: true,
    accentColor: '#B45309',
    headingFont: 'var(--font-stardom)',
  },
};

const SEASON_LOOK: Record<Season, Look> = {
  winter: {
    bgFrom: '#F0F6FF', bgTo: '#EAF3FF',
    cardBg: '#FFFFFF', cardBgAlt: '#F6FAFF', cardBgHover: '#EEF5FF', cardBorder: '#C8DCEE',
    snowflakes: true,
    accentColor: '#2563EB',
    headingFont: 'var(--font-stardom)',
  },
  spring: {
    bgFrom: '#F2FFF6', bgTo: '#F8FFF4',
    cardBg: '#FFFFFF', cardBgAlt: '#F8FFFA', cardBgHover: '#F0FFF4', cardBorder: '#BBE5C8',
    flowers: true,
    accentColor: '#16A34A',
    headingFont: 'var(--font-stardom)',
  },
  summer: {
    bgFrom: '#FFFBF0', bgTo: '#FFF8E6',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFDF8', cardBgHover: '#FFF9EE', cardBorder: '#E8D8A0',
    sunRays: true, waves: true,
    accentColor: '#D97706',
    headingFont: 'var(--font-stardom)',
  },
  autumn: {
    bgFrom: '#FFF9F0', bgTo: '#FFF5E8',
    cardBg: '#FFFFFF', cardBgAlt: '#FFFDF9', cardBgHover: '#FFF8EE', cardBorder: '#E8CEAC',
    leaves: true,
    accentColor: '#EA580C',
    headingFont: 'var(--font-stardom)',
  },
};

// ── Dates ────────────────────────────────────────────────────────────────────

/** Easter Sunday for a year (Gregorian calendar, Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Orthodox Easter Sunday (Julian computus, shown in the Gregorian calendar). */
function orthodoxEasterSunday(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return new Date(year, month - 1, day + 13);
}

/** The n-th given weekday (0 = Sunday) of a month. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

/** The last given weekday of a month. */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `from` to `to` (both taken at local midnight). */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

/** True from `before` days ahead of `target` up to `after` days past it. */
function near(date: Date, target: Date, before: number, after = 0): boolean {
  const d = daysBetween(date, target);
  return d <= before && d >= -after;
}

// ── Countries ────────────────────────────────────────────────────────────────

/** Jedro+ stores either an ISO code or an English country name. */
const COUNTRY_NAMES: Record<string, string> = {
  slovenia: 'SI', croatia: 'HR', serbia: 'RS', 'bosnia and herzegovina': 'BA', montenegro: 'ME',
  'north macedonia': 'MK', austria: 'AT', germany: 'DE', italy: 'IT', hungary: 'HU',
  'czech republic': 'CZ', slovakia: 'SK', poland: 'PL', romania: 'RO', bulgaria: 'BG', france: 'FR',
  spain: 'ES', portugal: 'PT', netherlands: 'NL', belgium: 'BE', switzerland: 'CH',
  'united kingdom': 'GB', 'united states': 'US', canada: 'CA', australia: 'AU',
};

export function normalizeCountry(country?: string | null): string {
  const raw = (country ?? '').trim();
  if (/^[a-z]{2}$/i.test(raw)) return raw.toUpperCase();
  return COUNTRY_NAMES[raw.toLowerCase()] ?? 'SI';
}

const ORTHODOX = ['RS', 'ME', 'MK', 'BG', 'RO'];
const CARNIVAL = ['SI', 'HR', 'AT', 'DE', 'CH', 'IT', 'RS', 'BA', 'ME', 'MK', 'HU', 'CZ', 'SK', 'FR', 'ES', 'PT', 'BE', 'NL'];
const WOMENS_DAY = ['SI', 'HR', 'RS', 'BA', 'ME', 'MK', 'IT', 'BG', 'RO', 'HU', 'CZ', 'SK', 'PL'];
const ST_MARTIN = ['SI', 'HR', 'AT', 'DE', 'CH', 'HU', 'CZ', 'SK', 'NL', 'BE'];
const ST_NICHOLAS = ['SI', 'HR', 'AT', 'DE', 'CH', 'CZ', 'SK', 'PL', 'HU', 'BE', 'NL'];
const HALLOWEEN = ['US', 'CA', 'GB', 'AU'];
/** Mother's Day on the second Sunday of May. */
const MOTHERS_MAY = ['HR', 'AT', 'DE', 'CH', 'IT', 'BE', 'NL', 'CZ', 'SK', 'US', 'CA', 'AU', 'BA'];

/** Which holiday, if any, the salon's country is close to on `date`. */
function holidayFor(date: Date, country: string): Exclude<Holiday, null> | null {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const has = (list: string[]) => list.includes(country);
  const easter = has(ORTHODOX) ? orthodoxEasterSunday(y) : easterSunday(y);
  const westernEaster = easterSunday(y);

  if (has(ST_NICHOLAS) && m === 11 && d >= 1 && d <= 6) return 'miklavz';
  if (m === 11 && d >= 15 && d <= 26) return 'christmas';
  if (country === 'IT' && m === 0 && d >= 2 && d <= 6) return 'befana';
  if ((m === 11 && d >= 27) || (m === 0 && d <= (country === 'IT' ? 1 : 5))) return 'newyear';
  // Shrove Tuesday is 47 days before (Western) Easter.
  if (has(CARNIVAL) && near(date, new Date(westernEaster.getTime() - 47 * DAY_MS), 6)) return 'pust';
  if (has(WOMENS_DAY) && m === 2 && d >= 1 && d <= 8) return 'womensday';
  if (country === 'SI' && m === 2 && d >= 18 && d <= 25) return 'mothersday';
  if (country === 'GB' && near(date, new Date(westernEaster.getTime() - 21 * DAY_MS), 7)) return 'mothersday';
  if (has(MOTHERS_MAY) && near(date, nthWeekday(y, 4, 0, 2), 7)) return 'mothersday';
  if (country === 'FR' && near(date, lastWeekday(y, 4, 0), 7)) return 'mothersday';
  if (near(date, easter, 10, 1)) return 'easter';
  if (m === 1 && d >= 1 && d <= 14) return 'valentine';
  if (has(HALLOWEEN) && m === 9 && d >= 20) return 'halloween';
  if (country === 'US' && near(date, nthWeekday(y, 10, 4, 4), 7)) return 'thanksgiving';
  if (country === 'CA' && near(date, nthWeekday(y, 9, 1, 2), 7)) return 'thanksgiving';
  if (has(ST_MARTIN) && m === 10 && d >= 4 && d <= 11) return 'martinovo';
  return null;
}

function seasonFor(date: Date, country: string): Season {
  const m = date.getMonth();
  const north: Season = m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
  if (country !== 'AU') return north;
  return ({ winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' } as const)[north];
}

/** The look for today in the salon's country, named in the page language. */
export function getCurrentSeasonalTheme(
  date: Date = new Date(),
  country?: string | null,
  language: 'sl' | 'en' = 'sl',
): SeasonalTheme {
  const code = normalizeCountry(country);
  const season = seasonFor(date, code);
  const holiday = holidayFor(date, code);
  const look = holiday ? HOLIDAY_LOOK[holiday] : SEASON_LOOK[season];
  const name = NAMES[holiday ?? season][language];
  return { season, holiday, config: { ...look, name } };
}

export function getSeasonEmoji(seasonalTheme: SeasonalTheme): string {
  const { holiday, season } = seasonalTheme;
  const byHoliday: Record<Exclude<Holiday, null>, string> = {
    christmas: '🎄', newyear: '🎉', valentine: '💕', easter: '🐣', pust: '🎭', womensday: '🌷',
    mothersday: '💐', martinovo: '🍇', miklavz: '🎁', befana: '🧦', halloween: '🎃', thanksgiving: '🍂',
  };
  if (holiday) return byHoliday[holiday];
  return { winter: '❄️', spring: '🌸', summer: '☀️', autumn: '🍁' }[season];
}
