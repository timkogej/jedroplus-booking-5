export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Holiday = 'christmas' | 'newyear' | 'valentine' | 'easter' | 'halloween' | 'thanksgiving' | null;

export interface SeasonalThemeConfig {
  name: string;
  // Seasonal background gradient (replaces API theme bg)
  bgFrom: string;
  bgTo: string;
  // Solid card surfaces
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
  // Accent
  accentColor: string;
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
        bgFrom: '#0d1f10', bgTo: '#2a0a0a',
        cardBg: '#132216', cardBgAlt: '#0f1c12', cardBgHover: '#1a2e1e', cardBorder: '#22381e',
        snowflakes: true, ornaments: true, santaHats: true,
        accentColor: '#C41E3A',
        headingFont: 'var(--font-christmas)',
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
        bgFrom: '#07071c', bgTo: '#10104a',
        cardBg: '#0d0d28', cardBgAlt: '#0a0a1e', cardBgHover: '#141440', cardBorder: '#1e1e54',
        snowflakes: true, fireworks: true, confetti: true,
        accentColor: '#FFD700',
        headingFont: 'var(--font-quicksand)',
      },
    };
  }

  // Valentine: Feb 1 - Feb 14
  if (month === 1 && day >= 1 && day <= 14) {
    return {
      season: 'winter',
      holiday: 'valentine',
      config: {
        name: "Valentinovo",
        bgFrom: '#1a0512', bgTo: '#380c20',
        cardBg: '#200818', cardBgAlt: '#1a0614', cardBgHover: '#2c1024', cardBorder: '#3e1630',
        hearts: true,
        accentColor: '#FF69B4',
        headingFont: 'var(--font-playfair)',
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
        bgFrom: '#140e28', bgTo: '#261a52',
        cardBg: '#1c1235', cardBgAlt: '#160e2c', cardBgHover: '#261848', cardBorder: '#322060',
        flowers: true, eggs: true, bunnies: true,
        accentColor: '#A78BFA',
        headingFont: 'var(--font-quicksand)',
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
        bgFrom: '#0a0414', bgTo: '#1c082e',
        cardBg: '#110820', cardBgAlt: '#0d0618', cardBgHover: '#181030', cardBorder: '#281840',
        pumpkins: true, ghosts: true, bats: true, leaves: true,
        accentColor: '#FF6600',
        headingFont: 'var(--font-creepster)',
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
        bgFrom: '#1a0900', bgTo: '#3a1600',
        cardBg: '#220e00', cardBgAlt: '#1c0a00', cardBgHover: '#2e1600', cardBorder: '#4a2200',
        leaves: true,
        accentColor: '#D2691E',
        headingFont: 'var(--font-quicksand)',
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
        bgFrom: '#0f1829', bgTo: '#1a2e4a',
        cardBg: '#162540', cardBgAlt: '#122035', cardBgHover: '#1e3052', cardBorder: '#243c5e',
        snowflakes: true,
        accentColor: '#87CEEB',
        headingFont: 'var(--font-quicksand)',
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
        bgFrom: '#0b1e0e', bgTo: '#153322',
        cardBg: '#102515', cardBgAlt: '#0d2010', cardBgHover: '#163022', cardBorder: '#1e3e2c',
        flowers: true,
        accentColor: '#4ade80',
        headingFont: 'var(--font-quicksand)',
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
        bgFrom: '#001524', bgTo: '#00263e',
        cardBg: '#001d30', cardBgAlt: '#001828', cardBgHover: '#002840', cardBorder: '#003255',
        sunRays: true, waves: true,
        accentColor: '#FCD34D',
        headingFont: 'var(--font-quicksand)',
      },
    };
  }

  // Autumn: Sep - Nov
  return {
    season: 'autumn',
    holiday: null,
    config: {
      name: 'Jesen',
      bgFrom: '#1e0d00', bgTo: '#3d1e00',
      cardBg: '#281500', cardBgAlt: '#221100', cardBgHover: '#341c00', cardBorder: '#4a2a00',
      leaves: true,
      accentColor: '#F97316',
      headingFont: 'var(--font-quicksand)',
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
