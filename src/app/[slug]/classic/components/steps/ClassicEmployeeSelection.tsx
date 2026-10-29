'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import { t } from '../../i18n';
import {
  Avatar,
  CARD,
  CheckCircle,
  FONT,
  INK,
  INK_2,
  PageTitle,
  PrimaryButton,
  SPRING,
  SectionLabel,
  itemVariants,
  listVariants,
  useClassicColors,
} from '../ui';

export default function ClassicEmployeeSelection() {
  const { theme, employeesUI, eligibleEmployeeIds, language } = useBookingStore();
  const c = useClassicColors();

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));
  const noEmployees = eligibleEmployeeIds.length === 0;

  const [localEmployeeId, setLocalEmployeeId] = useState<string | null>(null);
  const [localAnyPerson, setLocalAnyPerson] = useState(false);

  const canProceed = localAnyPerson || localEmployeeId !== null;

  const handleNext = () => {
    if (!canProceed) return;
    useBookingStore.setState({
      selectedEmployeeId: localAnyPerson ? null : localEmployeeId,
      anyPerson: localAnyPerson,
    });
    useBookingStore.getState().nextStep();
  };

  if (noEmployees) {
    return (
      <div className="py-16 text-center">
        <p style={{ fontFamily: FONT, color: c.text2, fontSize: 15 }}>{t(language, 'noStaff')}</p>
      </div>
    );
  }

  const row = (key: string, selected: boolean, onClick: () => void, avatar: React.ReactNode, title: string, subtitle?: string) => (
    <motion.button
      key={key}
      onClick={onClick}
      aria-pressed={selected}
      whileTap={{ scale: 0.985 }}
      transition={SPRING}
      className="classic-row flex w-full items-center gap-3.5 px-4 py-3.5 text-left sm:px-5"
      style={{
        ['--row-inset' as string]: '74px',
        background: selected ? `${theme.primarySolid}0A` : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold" style={{ fontFamily: FONT, color: INK }}>
          {title}
        </p>
        {subtitle && (
          <p className="truncate text-[14px]" style={{ fontFamily: FONT, color: INK_2 }}>
            {subtitle}
          </p>
        )}
      </div>
      <CheckCircle on={selected} color={theme.primarySolid} />
    </motion.button>
  );

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageTitle title={t(language, 'choosePerson')} subtitle={t(language, 'whoPerson')} />

      {/* "Anyone" */}
      <motion.div variants={itemVariants} className="mb-7 overflow-hidden" style={CARD}>
        {row(
          'any',
          localAnyPerson,
          () => {
            setLocalAnyPerson(true);
            setLocalEmployeeId(null);
          },
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: `${theme.primarySolid}16`, color: theme.primaryOnLight }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>,
          t(language, 'anyone'),
          t(language, 'anyoneDesc'),
        )}
      </motion.div>

      {/* People */}
      <motion.div variants={itemVariants}>
        <SectionLabel>{t(language, 'orChoosePerson').replace(/:$/, '')}</SectionLabel>
        <div className="overflow-hidden" style={CARD}>
          {filteredEmployees.map((emp) => {
            const isSelected = localEmployeeId === emp.id && !localAnyPerson;
            return row(
              emp.id,
              isSelected,
              () => {
                setLocalEmployeeId(emp.id);
                setLocalAnyPerson(false);
              },
              <Avatar initials={emp.initials} color={theme.primarySolid} />,
              emp.label,
              emp.subtitle || undefined,
            );
          })}
        </div>
      </motion.div>

      {/* Continue */}
      <motion.div
        variants={itemVariants}
        className="booking-sticky-cta mt-8 flex justify-end"
        style={stickyCtaStyle(theme.bgTo, 16)}
      >
        <PrimaryButton onClick={handleNext} disabled={!canProceed} className="w-full sm:w-auto sm:min-w-[220px]">
          {t(language, 'next')}
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}
