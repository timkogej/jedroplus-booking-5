'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

interface MagazineInputProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MagazineInput({
  name,
  label,
  type = 'text',
  required = false,
  value,
  error,
  placeholder,
  onChange,
}: MagazineInputProps) {
  const { theme } = useBookingStore();
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <label
        className="block magazine-caps text-[9px] tracking-[0.2em] mb-2 transition-colors duration-200"
        style={{ color: focused ? theme.primaryColor : '#6B6B6B' }}
      >
        {label}
        {required && <span className="ml-1 text-black/25">*</span>}
      </label>

      <div className="relative">
        {/* Base underline */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ backgroundColor: error ? '#EF4444' : 'rgba(0,0,0,0.12)' }}
        />
        {/* Animated focus underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] pointer-events-none"
          animate={{ width: focused ? '100%' : '0%' }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: error ? '#EF4444' : theme.primaryColor }}
        />

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 pb-2.5 pt-0 px-0 text-[15px] outline-none text-[#1A1A1A] placeholder:text-black/20 transition-colors"
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
