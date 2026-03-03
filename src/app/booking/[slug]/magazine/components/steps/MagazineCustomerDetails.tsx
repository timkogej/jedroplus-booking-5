'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails as CustomerDetailsType } from '@/types';

const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface FieldProps {
  name: keyof CustomerDetailsType;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  focused: string | null;
  theme: { primaryColor: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (name: string) => void;
  onBlur: () => void;
}

function MagField({
  name,
  label,
  type = 'text',
  required = true,
  value,
  error,
  focused,
  theme,
  onChange,
  onFocus,
  onBlur,
}: FieldProps) {
  const isFocused = focused === name;

  return (
    <div className="relative">
      <label
        className="block magazine-caps text-[9px] tracking-[0.2em] mb-2 transition-colors duration-200"
        style={{ color: isFocused ? theme.primaryColor : '#6B6B6B' }}
      >
        {label}
        {required && <span className="ml-1 text-black/20">*</span>}
      </label>

      <div className="mag-input-wrap relative">
        {/* Base underline */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ backgroundColor: error ? '#EF4444' : 'rgba(0,0,0,0.12)' }}
        />
        {/* Focus underline — animated via CSS in magazine.css, but also inline override */}
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] pointer-events-none"
          animate={{ width: isFocused ? '100%' : '0%' }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: error ? '#EF4444' : theme.primaryColor }}
        />

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => onFocus(name)}
          onBlur={onBlur}
          className="w-full bg-transparent border-0 pb-2.5 pt-0 px-0 text-[15px] outline-none transition-colors duration-200 text-[#1A1A1A] placeholder:text-black/20"
          style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-[11px] mt-1.5 magazine-caps tracking-[0.1em]"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default function MagazineCustomerDetails() {
  const {
    theme,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    selectedService,
    selectedDate,
    selectedTime,
    setCustomerDetails,
    nextStep,
  } = useBookingStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const [formData, setFormData] = useState<CustomerDetailsType>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    notes: '',
    gdprSendMarketing: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetailsType, string>>>({});
  const [focused, setFocused] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Partial<Record<keyof CustomerDetailsType, string>> = {};
    if (!formData.firstName.trim()) e.firstName = 'Ime je obvezno';
    if (!formData.lastName.trim()) e.lastName = 'Priimek je obvezen';
    if (!formData.email.trim()) {
      e.email = 'Email je obvezen';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Vnesi veljaven email';
    }
    if (!formData.phone.trim()) e.phone = 'Telefon je obvezen';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) {
      setCustomerDetails(formData);
      nextStep();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((p) => ({ ...p, [name]: val }));
    if (errors[name as keyof CustomerDetailsType]) {
      setErrors((p) => ({ ...p, [name]: undefined }));
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-2xl"
    >
      {/* Section header */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          Vaši Podatki
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izpolnite za potrditev rezervacije
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-md">
          <motion.div variants={itemVariants} className="space-y-7">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-6">
              <MagField
                name="firstName"
                label="Ime"
                value={formData.firstName}
                error={errors.firstName}
                focused={focused}
                theme={theme}
                onChange={handleChange}
                onFocus={setFocused}
                onBlur={() => setFocused(null)}
              />
              <MagField
                name="lastName"
                label="Priimek"
                value={formData.lastName}
                error={errors.lastName}
                focused={focused}
                theme={theme}
                onChange={handleChange}
                onFocus={setFocused}
                onBlur={() => setFocused(null)}
              />
            </div>

            <MagField
              name="email"
              label="E-pošta"
              type="email"
              value={formData.email}
              error={errors.email}
              focused={focused}
              theme={theme}
              onChange={handleChange}
              onFocus={setFocused}
              onBlur={() => setFocused(null)}
            />

            <MagField
              name="phone"
              label="Telefon"
              type="tel"
              value={formData.phone}
              error={errors.phone}
              focused={focused}
              theme={theme}
              onChange={handleChange}
              onFocus={setFocused}
              onBlur={() => setFocused(null)}
            />
          </motion.div>

          {/* Gender selection */}
          <motion.div variants={itemVariants} className="mt-8">
            <p className="magazine-caps text-[9px] tracking-[0.2em] text-[#6B6B6B] mb-4">
              Nagovor <span className="text-black/25 ml-1">(neobvezno)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'male', label: 'Gospod' },
                { value: 'female', label: 'Gospa' },
                { value: 'other', label: 'Nevtralno' },
              ].map((opt) => {
                const isSelected = formData.gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, gender: isSelected ? '' : opt.value }))
                    }
                    className="relative px-5 py-2 text-[13px] transition-all duration-250"
                    style={{
                      color: isSelected ? theme.primaryColor : '#6B6B6B',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                      fontStyle: isSelected ? 'italic' : 'normal',
                      borderBottom: `1px solid ${isSelected ? theme.primaryColor : 'rgba(0,0,0,0.12)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div variants={itemVariants} className="mt-8 relative">
            {/* Pull-quote decoration */}
            <span
              className="absolute -left-4 -top-4 magazine-serif text-4xl leading-none pointer-events-none select-none"
              style={{ color: `${theme.primaryColor}18`, fontStyle: 'italic' }}
              aria-hidden
            >
              &ldquo;
            </span>
            <label
              className="block magazine-caps text-[9px] tracking-[0.2em] mb-3 transition-colors duration-200"
              style={{ color: focused === 'notes' ? theme.primaryColor : '#6B6B6B' }}
            >
              Dodatne želje <span className="text-black/25 ml-1">(neobvezno)</span>
            </label>
            <div className="relative">
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-[1px] pointer-events-none"
                animate={{ width: focused === 'notes' ? '100%' : '0%' }}
                transition={{ duration: 0.35 }}
                style={{ backgroundColor: theme.primaryColor }}
              />
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                onFocus={() => setFocused('notes')}
                onBlur={() => setFocused(null)}
                rows={3}
                placeholder="Posebne želje ali napotki..."
                className="w-full bg-transparent border-0 pb-2.5 pt-0 px-0 text-[15px] outline-none resize-none text-[#1A1A1A] placeholder:text-black/20"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              />
            </div>
          </motion.div>

          {/* GDPR */}
          <motion.div variants={itemVariants} className="mt-8 flex items-start gap-3">
            <div
              className="relative w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  gdprSendMarketing: !p.gdprSendMarketing,
                }))
              }
            >
              <div
                className="w-4 h-4 border flex items-center justify-center transition-all duration-200"
                style={{
                  borderColor: formData.gdprSendMarketing
                    ? theme.primaryColor
                    : 'rgba(0,0,0,0.2)',
                  backgroundColor: formData.gdprSendMarketing
                    ? `${theme.primaryColor}12`
                    : 'transparent',
                }}
              >
                {formData.gdprSendMarketing && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path
                      d="M1 3L3 5L7 1"
                      stroke={theme.primaryColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <label
              className="text-[#6B6B6B] text-[12px] leading-relaxed cursor-pointer"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  gdprSendMarketing: !p.gdprSendMarketing,
                }))
              }
            >
              Želim prejemati novice in posebne ponudbe po e-pošti
            </label>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="mt-10">
            <motion.button
              type="submit"
              className="group relative px-8 py-3 overflow-hidden transition-all duration-300"
              style={{ border: `1px solid ${theme.primaryColor}` }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: theme.primaryColor }}
                initial={{ x: '-100%' }}
                whileHover={{ x: '0%' }}
                transition={{ duration: 0.3 }}
              />
              <span
                className="relative z-10 magazine-caps text-[10px] tracking-[0.2em] transition-colors duration-300"
                style={{ color: theme.primaryColor }}
              >
                <span className="group-hover:text-white transition-colors duration-300">
                  Nadaljuj na potrditev
                </span>
              </span>
            </motion.button>
          </motion.div>
        </form>

        {/* Summary sidebar */}
        <motion.div variants={itemVariants} className="lg:w-64 xl:w-72">
          <p className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B] mb-4">
            Vaša rezervacija
          </p>
          <div className="h-[1px] bg-black/10 mb-5" />

          <div className="space-y-4">
            {(selectedEmployee || anyPerson) && (
              <div>
                <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                  Specialist
                </p>
                <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                  {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
                </p>
              </div>
            )}

            {selectedService && (
              <>
                <div>
                  <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                    Storitev
                  </p>
                  <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                    {selectedService.naziv}
                  </p>
                  <p className="magazine-caps text-[8px] tracking-[0.16em] text-[#6B6B6B] mt-0.5">
                    {formatDuration(selectedService.trajanjeMin)}
                  </p>
                </div>
              </>
            )}

            {selectedDate && (
              <div>
                <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                  Datum
                </p>
                <p className="magazine-body text-[15px] text-[#1A1A1A]">
                  {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                </p>
              </div>
            )}

            {selectedTime && (
              <div>
                <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                  Ura
                </p>
                <p className="magazine-body text-[15px] text-[#1A1A1A] tabular-nums">
                  {selectedTime}
                </p>
              </div>
            )}
          </div>

          {selectedService && (
            <>
              <div className="h-[1px] bg-black/10 my-5" />
              <div className="flex justify-between items-baseline">
                <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                  Skupaj
                </p>
                <p
                  className="magazine-serif text-[1.5rem] font-light tabular-nums"
                  style={{ color: theme.primaryColor }}
                >
                  €{selectedService.cena}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
