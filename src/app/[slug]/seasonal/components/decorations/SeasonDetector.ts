export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Holiday = 'christmas' | 'newyear' | 'valentine' | 'easter' | 'halloween' | 'thanksgiving' | null;

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
  pumpkins?: boolean;
  ghosts?: boolean;
  bats?: boolean;
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

export function getCurrentSeasonalTheme(date: Date = new Date()): SeasonalTheme {
  const month = date.getMonth();
  const day = date.getDate();

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
        name: 'Novo Leto',
        bgFrom: '#F8F6FF', bgTo: '#F0F8FF',
        cardBg: '#FFFFFF', cardBgAlt: '#F9F8FF', cardBgHover: '#F4F2FF', cardBorder: '#DDD8F5',
        snowflakes: true, fireworks: true, confetti: true,
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

  // Easter: mid-March to mid-April
  if ((month === 2 && day >= 15) || (month === 3 && day <= 15)) {
    return {
      season: 'spring',
      holiday: 'easter',
      config: {
        name: 'Velika Noč',
        bgFrom: '#F5F0FF', bgTo: '#F0FFF8',
        cardBg: '#FFFFFF', cardBgAlt: '#FAF8FF', cardBgHover: '#F3F0FF', cardBorder: '#DDD0F5',
        flowers: true, eggs: true, bunnies: true,
        accentColor: '#7C3AED',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Halloween: Oct 20 - Oct 31
  if (month === 9 && day >= 20) {
    return {
      season: 'autumn',
      holiday: 'halloween',
      config: {
        name: 'Halloween',
        bgFrom: '#FFF8F0', bgTo: '#FFF4E8',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFAF6', cardBgHover: '#FFF6EE', cardBorder: '#F5D8B0',
        pumpkins: true, ghosts: true, bats: true, leaves: true,
        accentColor: '#EA580C',
        headingFont: 'var(--font-stardom)',
      },
    };
  }

  // Thanksgiving: Nov 20 - Nov 30
  if (month === 10 && day >= 20) {
    return {
      season: 'autumn',
      holiday: 'thanksgiving',
      config: {
        name: 'Zahvalnost',
        bgFrom: '#FFFBF0', bgTo: '#FFF7E6',
        cardBg: '#FFFFFF', cardBgAlt: '#FFFDF8', cardBgHover: '#FFF9EE', cardBorder: '#EDD8A8',
        leaves: true,
        accentColor: '#B45309',
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
  if (holiday === 'halloween') return '🎃';
  if (holiday === 'thanksgiving') return '🍂';
  if (season === 'winter') return '❄️';
  if (season === 'spring') return '🌸';
  if (season === 'summer') return '☀️';
  return '🍁';
}
