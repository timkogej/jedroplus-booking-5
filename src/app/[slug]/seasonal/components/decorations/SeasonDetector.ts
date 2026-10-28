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
  | null;

export interface SeasonalThemeConfig {
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `from` to `to` (both taken at local midnight). */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

/**
 * Picks the look for today. Slovenian holidays: the week before each one,
 * shorter ones first so they are not hidden by a longer window around them.
 */
export function getCurrentSeasonalTheme(date: Date = new Date()): SeasonalTheme {
  const month = date.getMonth();
  const day = date.getDate();
  const toEaster = daysBetween(date, easterSunday(date.getFullYear()));

  // Miklavž (6 Dec): 1–6 Dec
  if (month === 11 && day >= 1 && day <= 6) {
    return {
      season: 'winter',
      holiday: 'miklavz',
      config: {
        name: 'Miklavž',
        bgFrom: '#FFF6F6', bgTo: '#F3F7FF',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFAFA', cardBgHover: '#FFF2F2', cardBorder: '#F2CFCF',
        snowflakes: true,
        accentColor: '#B91C1C',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Christmas: Dec 15 - Dec 26
  if (month === 11 && day >= 15 && day <= 26) {
    return {
      season: 'winter',
      holiday: 'christmas',
      config: {
        name: 'Božič',
        bgFrom: '#F3FFF5', bgTo: '#FFF9F0',
        cardBg: '#FFFFFF', cardBgAlt: '#F9FDFB', cardBgHover: '#F4FAF6', cardBorder: '#D6EDDA',
        snowflakes: true, ornaments: true, santaHats: true,
        accentColor: '#16A34A',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // New Year: Dec 27 - Jan 5
  if ((month === 11 && day >= 27) || (month === 0 && day <= 5)) {
    return {
      season: 'winter',
      holiday: 'newyear',
      config: {
        name: 'Novo leto',
        bgFrom: '#F8F6FF', bgTo: '#F0F8FF',
        cardBg: '#FFFFFF', cardBgAlt: '#F9F8FF', cardBgHover: '#F4F2FF', cardBorder: '#DDD8F5',
        snowflakes: true, fireworks: true, confetti: true,
        accentColor: '#7C3AED',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Pust: the week up to Shrove Tuesday (47 days before Easter)
  if (toEaster >= 47 && toEaster <= 53) {
    return {
      season: 'winter',
      holiday: 'pust',
      config: {
        name: 'Pust',
        bgFrom: '#FFF9EE', bgTo: '#F4F2FF',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFCF5', cardBgHover: '#FFF7E8', cardBorder: '#EBD9B5',
        confetti: true,
        accentColor: '#C2410C',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Dan žena (8 Mar): 1–8 Mar
  if (month === 2 && day >= 1 && day <= 8) {
    return {
      season: 'spring',
      holiday: 'womensday',
      config: {
        name: 'Dan žena',
        bgFrom: '#FFF5F8', bgTo: '#FFF8F2',
        cardBg: '#FFFFFF', cardBgAlt: '#FFF8FB', cardBgHover: '#FFF2F6', cardBorder: '#F5C6D6',
        flowers: true,
        accentColor: '#BE185D',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Materinski dan (25 Mar): 18–25 Mar
  if (month === 2 && day >= 18 && day <= 25) {
    return {
      season: 'spring',
      holiday: 'mothersday',
      config: {
        name: 'Materinski dan',
        bgFrom: '#FFF6F9', bgTo: '#F6FFF8',
        cardBg: '#FFFFFF', cardBgAlt: '#FFF9FB', cardBgHover: '#FFF3F7', cardBorder: '#F2CADA',
        flowers: true, hearts: true,
        accentColor: '#BE185D',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Easter: ten days before Easter Sunday up to Easter Monday
  if (toEaster >= -1 && toEaster <= 10) {
    return {
      season: 'spring',
      holiday: 'easter',
      config: {
        name: 'Velika noč',
        bgFrom: '#F5F0FF', bgTo: '#F0FFF8',
        cardBg: '#FFFFFF', cardBgAlt: '#FAF8FF', cardBgHover: '#F3F0FF', cardBorder: '#DDD0F5',
        flowers: true, eggs: true, bunnies: true,
        accentColor: '#7C3AED',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Valentine: Feb 1 - Feb 14
  if (month === 1 && day >= 1 && day <= 14) {
    return {
      season: 'winter',
      holiday: 'valentine',
      config: {
        name: 'Valentinovo',
        bgFrom: '#FFF5F8', bgTo: '#FFF0F5',
        cardBg: '#FFFFFF', cardBgAlt: '#FFF8FB', cardBgHover: '#FFF2F6', cardBorder: '#F9C0D0',
        hearts: true,
        accentColor: '#E11D48',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Martinovo (11 Nov): the week before
  if (month === 10 && day >= 4 && day <= 11) {
    return {
      season: 'autumn',
      holiday: 'martinovo',
      config: {
        name: 'Martinovo',
        bgFrom: '#FFF8F3', bgTo: '#FBF1EC',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFBF8', cardBgHover: '#FDF4EF', cardBorder: '#EBCFC2',
        leaves: true,
        accentColor: '#9F1239',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Winter: Dec, Jan, Feb
  if (month === 11 || month === 0 || month === 1) {
    return {
      season: 'winter',
      holiday: null,
      config: {
        name: 'Zima',
        bgFrom: '#F0F6FF', bgTo: '#EAF3FF',
        cardBg: '#FFFFFF', cardBgAlt: '#F6FAFF', cardBgHover: '#EEF5FF', cardBorder: '#C8DCEE',
        snowflakes: true,
        accentColor: '#2563EB',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Spring: Mar - May
  if (month >= 2 && month <= 4) {
    return {
      season: 'spring',
      holiday: null,
      config: {
        name: 'Pomlad',
        bgFrom: '#F2FFF6', bgTo: '#F8FFF4',
        cardBg: '#FFFFFF', cardBgAlt: '#F8FFFA', cardBgHover: '#F0FFF4', cardBorder: '#BBE5C8',
        flowers: true,
        accentColor: '#16A34A',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Summer: Jun - Aug
  if (month >= 5 && month <= 7) {
    return {
      season: 'summer',
      holiday: null,
      config: {
        name: 'Poletje',
        bgFrom: '#FFFBF0', bgTo: '#FFF8E6',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFDF8', cardBgHover: '#FFF9EE', cardBorder: '#E8D8A0',
        sunRays: true, waves: true,
        accentColor: '#D97706',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Autumn: Sep - Nov
  return {
    season: 'autumn',
    holiday: null,
    config: {
      name: 'Jesen',
      bgFrom: '#FFF9F0', bgTo: '#FFF5E8',
      cardBg: '#FFFFFF', cardBgAlt: '#FFFDF9', cardBgHover: '#FFF8EE', cardBorder: '#E8CEAC',
      leaves: true,
      accentColor: '#EA580C',
      headingFont: 'var(--font-stardom)',
    },
  };
}

export function getSeasonEmoji(seasonalTheme: SeasonalTheme): string {
  const { holiday, season } = seasonalTheme;
  if (holiday === 'christmas') return '🎄';
  if (holiday === 'newyear') return '🎉';
  if (holiday === 'valentine') return '💕';
  if (holiday === 'easter') return '🐣';
  if (holiday === 'pust') return '🎭';
  if (holiday === 'womensday') return '🌷';
  if (holiday === 'mothersday') return '💐';
  if (holiday === 'martinovo') return '🍇';
  if (holiday === 'miklavz') return '🎁';
  if (season === 'winter') return '❄️';
  if (season === 'spring') return '🌸';
  if (season === 'summer') return '☀️';
  return '🍁';
}
