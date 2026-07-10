'use client';

import { useBookingStore } from '@/store/bookingStore';
import { t } from '../i18n';

export default function MagazineMasthead() {
  const { company, theme, language, setLanguage } = useBookingStore();

  return (
    <header className="px-8 pt-8 pb-0 md:px-12 md:pt-10">
      <div className="flex items-end justify-between mb-5">
        {/* Brand name */}
        <div>
          <h1
            className="magazine-serif text-[1.75rem] md:text-[2.25rem] text-[#1A1A1A] tracking-[-0.02em] leading-none"
          >
            {company?.naziv || 'Rezervacije'}
          </h1>
          <p className="magazine-caps text-[9px] tracking-[0.28em] text-[#6B6B6B] mt-2">
            {company?.panoga ? `${company.panoga} · ` : ''}
            {new Date().getFullYear()}
          </p>
        </div>

        {/* Right side: booking label + language toggle */}
        <div className="flex flex-col items-end gap-2">
          <div className="hidden md:flex items-center gap-2">
            <span className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B]">
              {t(language, 'onlineBooking')}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => setLanguage('sl')}
              className="magazine-caps text-[9px] tracking-[0.18em] px-2 py-1 transition-colors duration-200"
              style={{
                color: language === 'sl' ? theme.primaryColor : 'rgba(0,0,0,0.25)',
                borderBottom: language === 'sl' ? `1px solid ${theme.primaryColor}` : '1px solid transparent',
              }}
              aria-pressed={language === 'sl'}
            >
              SL
            </button>
            <span className="magazine-caps text-[8px] text-black/15 px-0.5">/</span>
            <button
              onClick={() => setLanguage('en')}
              className="magazine-caps text-[9px] tracking-[0.18em] px-2 py-1 transition-colors duration-200"
              style={{
                color: language === 'en' ? theme.primaryColor : 'rgba(0,0,0,0.25)',
                borderBottom: language === 'en' ? `1px solid ${theme.primaryColor}` : '1px solid transparent',
              }}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
          </div>

          {/* Small decorative line */}
          <div
            className="hidden md:block w-16 h-[1px]"
            style={{ backgroundColor: `${theme.primaryColor}30` }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="h-[1px] bg-black/10" />
    </header>
  );
}
