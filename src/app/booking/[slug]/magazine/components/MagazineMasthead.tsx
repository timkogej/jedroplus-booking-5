'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function MagazineMasthead() {
  const { company, theme } = useBookingStore();

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

        {/* Right side decorative element */}
        <div className="hidden md:flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B]">
              Spletna rezervacija
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </div>
          {/* Small decorative line */}
          <div
            className="w-16 h-[1px]"
            style={{ backgroundColor: `${theme.primaryColor}30` }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="h-[1px] bg-black/10" />
    </header>
  );
}
