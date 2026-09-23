'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import { formatBookingPrice } from '@/lib/pricing';
import { motion } from 'framer-motion'
import { Check, Clock, Sparkles } from 'lucide-react'
import type { AddOnOption } from '@/lib/promotionsApi'
import {
  type BookingVariantStyle,
  colorWithAlpha,
  getVariantAccent,
} from '@/components/shared/variantStyles'

interface AddOnModalProps {
  addOns: AddOnOption[]
  onSelect: (addOn: AddOnOption) => void
  onSkip: () => void
  language: 'sl' | 'en'
  variantStyle?: BookingVariantStyle
  accentColor?: string
}

type ModalTheme = {
  overlayStyle: CSSProperties
  panelStyle: CSSProperties
  showIcon: boolean
  iconWrapStyle: CSSProperties
  iconColor: string
  titleStyle: CSSProperties
  subtitleStyle: CSSProperties
  optionStyle: CSSProperties
  optionBackground: string
  optionSelectedBackground: string
  optionBorderColor: string
  optionHoverBorderColor: string
  optionSelectedBorderColor: string
  nameStyle: CSSProperties
  durationStyle: CSSProperties
  badgeStyle: CSSProperties
  originalPriceStyle: CSSProperties
  finalPriceStyle: CSSProperties
  selectPillStyle: CSSProperties
  selectPillSelectedStyle: CSSProperties
  primaryButtonStyle: CSSProperties
  disabledButtonStyle: CSSProperties
  skipStyle: CSSProperties
  checkRadius: CSSProperties['borderRadius']
  checkColor: string
  buttonTextColor: string
}

const TEXT = {
  sl: {
    title: 'Dodajte k rezervaciji',
    subtitle: 'Posebna ponudba samo za vas',
    add: 'Dodaj',
    skip: 'Ne hvala, nadaljuj brez',
    select: 'Izberi',
  },
  en: {
    title: 'Add to your booking',
    subtitle: 'Special offer just for you',
    add: 'Add',
    skip: 'No thanks, continue without',
    select: 'Select',
  },
}

function getModalTheme(variantStyle: BookingVariantStyle, accent: string): ModalTheme {
  switch (variantStyle) {
    case 'classic':
      return {
        overlayStyle: { backgroundColor: 'rgba(0,0,0,0.55)' },
        panelStyle: {
          borderRadius: '1rem',
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          fontFamily: 'var(--font-nunito-sans)',
        },
        showIcon: true,
        iconWrapStyle: {
          width: 38,
          height: 38,
          borderRadius: 999,
          backgroundColor: colorWithAlpha(accent, '14'),
          border: `1px solid ${colorWithAlpha(accent, '25')}`,
        },
        iconColor: accent,
        titleStyle: {
          color: '#111827',
          fontFamily: 'var(--font-nunito)',
          fontSize: '1.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
        },
        subtitleStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.9rem',
          fontWeight: 600,
        },
        optionStyle: {
          borderRadius: '1rem',
          fontFamily: 'var(--font-nunito-sans)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
        optionBackground: '#FFFFFF',
        optionSelectedBackground: colorWithAlpha(accent, '0D'),
        optionBorderColor: '#E5E7EB',
        optionHoverBorderColor: accent,
        optionSelectedBorderColor: accent,
        nameStyle: {
          color: '#111827',
          fontFamily: 'var(--font-nunito)',
          fontSize: '0.98rem',
          fontWeight: 700,
          lineHeight: 1.25,
        },
        durationStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.78rem',
          fontWeight: 600,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.68rem',
          fontWeight: 800,
        },
        originalPriceStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.78rem',
          fontWeight: 600,
        },
        finalPriceStyle: {
          color: accent,
          fontFamily: 'var(--font-nunito)',
          fontSize: '1.15rem',
          fontWeight: 800,
        },
        selectPillStyle: {
          borderRadius: 999,
          backgroundColor: '#F3F4F6',
          color: '#6B7280',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.72rem',
          fontWeight: 800,
        },
        selectPillSelectedStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
        },
        primaryButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: accent,
          color: '#FFFFFF',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.9rem',
          fontWeight: 800,
          boxShadow: `0 16px 30px ${colorWithAlpha(accent, '33')}`,
        },
        disabledButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: '#E5E7EB',
          color: '#9CA3AF',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.9rem',
          fontWeight: 800,
        },
        skipStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.88rem',
          fontWeight: 700,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
        buttonTextColor: '#FFFFFF',
      }
    case 'elegant':
      return {
        overlayStyle: { backgroundColor: 'rgba(17,17,17,0.48)' },
        panelStyle: {
          borderRadius: '0.75rem',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 18px 48px rgba(0,0,0,0.16)',
          fontFamily: 'var(--font-inter)',
        },
        showIcon: true,
        iconWrapStyle: {
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: colorWithAlpha(accent, '10'),
          border: `1px solid ${colorWithAlpha(accent, '26')}`,
        },
        iconColor: accent,
        titleStyle: {
          color: '#111111',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.65rem',
          fontWeight: 400,
          lineHeight: 1.15,
        },
        subtitleStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.86rem',
          fontWeight: 500,
        },
        optionStyle: {
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
        optionBackground: '#FFFFFF',
        optionSelectedBackground: colorWithAlpha(accent, '08'),
        optionBorderColor: '#E5E7EB',
        optionHoverBorderColor: accent,
        optionSelectedBorderColor: accent,
        nameStyle: {
          color: '#1F2937',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.96rem',
          fontWeight: 600,
          lineHeight: 1.3,
        },
        durationStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 500,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '10'),
          color: accent,
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.68rem',
          fontWeight: 700,
        },
        originalPriceStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: '#111111',
          fontFamily: 'var(--font-inter)',
          fontSize: '1.05rem',
          fontWeight: 600,
        },
        selectPillStyle: {
          borderRadius: 999,
          backgroundColor: '#F9FAFB',
          color: '#6B7280',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          fontWeight: 700,
        },
        selectPillSelectedStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
        },
        primaryButtonStyle: {
          borderRadius: '0.75rem',
          backgroundColor: accent,
          color: '#FFFFFF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 700,
          boxShadow: `0 14px 28px ${colorWithAlpha(accent, '26')}`,
        },
        disabledButtonStyle: {
          borderRadius: '0.75rem',
          backgroundColor: '#F3F4F6',
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 700,
        },
        skipStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.84rem',
          fontWeight: 600,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
        buttonTextColor: '#FFFFFF',
      }
    case 'magazine':
      return {
        overlayStyle: { backgroundColor: 'rgba(26,26,26,0.46)' },
        panelStyle: {
          borderRadius: 0,
          background: '#FAFAF8',
          border: '1px solid rgba(0,0,0,0.14)',
          boxShadow: '0 20px 55px rgba(0,0,0,0.18)',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
        },
        showIcon: false,
        iconWrapStyle: {},
        iconColor: accent,
        titleStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1.85rem',
          fontWeight: 400,
          lineHeight: 1.08,
        },
        subtitleStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: '0.95rem',
          fontStyle: 'italic',
          fontWeight: 400,
        },
        optionStyle: {
          borderRadius: 0,
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          boxShadow: 'none',
        },
        optionBackground: '#FFFFFF',
        optionSelectedBackground: colorWithAlpha(accent, '06'),
        optionBorderColor: 'rgba(0,0,0,0.12)',
        optionHoverBorderColor: accent,
        optionSelectedBorderColor: accent,
        nameStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1.05rem',
          fontWeight: 400,
          lineHeight: 1.25,
        },
        durationStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.58rem',
          fontWeight: 400,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        },
        badgeStyle: {
          backgroundColor: 'transparent',
          border: `1px solid ${colorWithAlpha(accent, '40')}`,
          color: accent,
          borderRadius: 0,
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.55rem',
          fontWeight: 400,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        },
        originalPriceStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: '0.78rem',
          fontWeight: 400,
          fontVariantNumeric: 'tabular-nums',
        },
        finalPriceStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1.4rem',
          fontWeight: 300,
          fontVariantNumeric: 'tabular-nums',
        },
        selectPillStyle: {
          borderRadius: 0,
          backgroundColor: 'transparent',
          border: '1px solid rgba(0,0,0,0.18)',
          color: '#6B6B6B',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.56rem',
          fontWeight: 400,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        },
        selectPillSelectedStyle: {
          borderColor: accent,
          color: accent,
        },
        primaryButtonStyle: {
          borderRadius: 0,
          backgroundColor: accent,
          color: '#FFFFFF',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 400,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        },
        disabledButtonStyle: {
          borderRadius: 0,
          backgroundColor: '#E5E5E0',
          color: '#9A9A92',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 400,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        },
        skipStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: '0.9rem',
          fontStyle: 'italic',
          fontWeight: 400,
        },
        checkRadius: 0,
        checkColor: '#FFFFFF',
        buttonTextColor: '#FFFFFF',
      }
    case 'casino':
      return {
        overlayStyle: { backgroundColor: 'rgba(6,15,8,0.76)' },
        panelStyle: {
          borderRadius: 10,
          background: 'rgba(10,40,20,0.97)',
          border: '1px solid rgba(201,168,76,0.35)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45), inset 0 0 30px rgba(201,168,76,0.04)',
          fontFamily: 'var(--font-cormorant)',
        },
        showIcon: true,
        iconWrapStyle: {
          width: 38,
          height: 38,
          borderRadius: 6,
          backgroundColor: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.35)',
        },
        iconColor: '#C9A84C',
        titleStyle: {
          color: '#F5EDD6',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.65rem',
          fontWeight: 700,
          lineHeight: 1.12,
        },
        subtitleStyle: {
          color: 'rgba(232,217,184,0.58)',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1rem',
          fontStyle: 'italic',
          fontWeight: 400,
        },
        optionStyle: {
          borderRadius: 8,
          fontFamily: 'var(--font-cormorant)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.24)',
        },
        optionBackground: 'rgba(13,59,30,0.72)',
        optionSelectedBackground: 'rgba(201,168,76,0.08)',
        optionBorderColor: 'rgba(201,168,76,0.22)',
        optionHoverBorderColor: 'rgba(201,168,76,0.55)',
        optionSelectedBorderColor: '#C9A84C',
        nameStyle: {
          color: '#F5EDD6',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1rem',
          fontWeight: 700,
          lineHeight: 1.2,
        },
        durationStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.58rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        },
        badgeStyle: {
          backgroundColor: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.35)',
          color: '#C9A84C',
          borderRadius: 3,
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.55rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        },
        originalPriceStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '0.85rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: '#E8C96D',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.12rem',
          fontWeight: 700,
        },
        selectPillStyle: {
          borderRadius: 4,
          backgroundColor: 'rgba(201,168,76,0.10)',
          border: '1px solid rgba(201,168,76,0.25)',
          color: '#A89060',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.58rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        },
        selectPillSelectedStyle: {
          backgroundColor: '#C9A84C',
          borderColor: '#C9A84C',
          color: '#060F08',
        },
        primaryButtonStyle: {
          background: 'linear-gradient(135deg, #A07830, #C9A84C, #E8C96D, #C9A84C)',
          color: '#060F08',
          clipPath: 'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          boxShadow: '0 14px 30px rgba(201,168,76,0.20)',
        },
        disabledButtonStyle: {
          background: 'rgba(201,168,76,0.10)',
          color: 'rgba(201,168,76,0.35)',
          clipPath: 'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        },
        skipStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '0.98rem',
          fontStyle: 'italic',
          fontWeight: 500,
        },
        checkRadius: 999,
        checkColor: '#060F08',
        buttonTextColor: '#060F08',
      }
    case 'seasonal':
      return {
        overlayStyle: { backgroundColor: 'rgba(0,0,0,0.52)' },
        panelStyle: {
          borderRadius: '1rem',
          background: '#FFFFFF',
          border: `1px solid ${colorWithAlpha(accent, '24')}`,
          boxShadow: '0 20px 55px rgba(0,0,0,0.18)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
        },
        showIcon: true,
        iconWrapStyle: {
          width: 38,
          height: 38,
          borderRadius: 999,
          backgroundColor: colorWithAlpha(accent, '12'),
          border: `1px solid ${colorWithAlpha(accent, '25')}`,
        },
        iconColor: accent,
        titleStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '1.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
        },
        subtitleStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 600,
        },
        optionStyle: {
          borderRadius: '1rem',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        },
        optionBackground: '#FFFFFF',
        optionSelectedBackground: colorWithAlpha(accent, '0C'),
        optionBorderColor: 'var(--b2)',
        optionHoverBorderColor: accent,
        optionSelectedBorderColor: accent,
        nameStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.98rem',
          fontWeight: 700,
          lineHeight: 1.25,
        },
        durationStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 600,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          color: accent,
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
          borderRadius: 999,
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.68rem',
          fontWeight: 800,
        },
        originalPriceStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '1.08rem',
          fontWeight: 800,
        },
        selectPillStyle: {
          borderRadius: 999,
          backgroundColor: 'var(--s1)',
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.72rem',
          fontWeight: 800,
        },
        selectPillSelectedStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
        },
        primaryButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: accent,
          color: '#FFFFFF',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 800,
          boxShadow: `0 16px 30px ${colorWithAlpha(accent, '28')}`,
        },
        disabledButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: 'var(--s1)',
          color: 'var(--t-disabled)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 800,
        },
        skipStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.86rem',
          fontWeight: 700,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
        buttonTextColor: '#FFFFFF',
      }
    case 'modern':
    default:
      return {
        overlayStyle: { backgroundColor: 'rgba(0,0,0,0.58)' },
        panelStyle: {
          borderRadius: '1rem',
          background: 'var(--s2, #FFFFFF)',
          border: '1px solid var(--b2, #E5E7EB)',
          boxShadow: '0 22px 60px rgba(0,0,0,0.20)',
          fontFamily: 'var(--font-inter)',
        },
        showIcon: true,
        iconWrapStyle: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colorWithAlpha(accent, '14'),
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
        },
        iconColor: accent,
        titleStyle: {
          color: 'var(--t-primary, #111827)',
          fontFamily: 'var(--font-clash)',
          fontSize: '1.6rem',
          fontWeight: 500,
          lineHeight: 1.12,
        },
        subtitleStyle: {
          color: 'var(--t-muted, #6B7280)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 600,
        },
        optionStyle: {
          borderRadius: '1rem',
          fontFamily: 'var(--font-inter)',
          boxShadow: 'none',
        },
        optionBackground: 'var(--s1, #FFFFFF)',
        optionSelectedBackground: colorWithAlpha(accent, '0D'),
        optionBorderColor: 'var(--b2, #E5E7EB)',
        optionHoverBorderColor: accent,
        optionSelectedBorderColor: accent,
        nameStyle: {
          color: 'var(--t-primary, #111827)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.96rem',
          fontWeight: 700,
          lineHeight: 1.25,
        },
        durationStyle: {
          color: 'var(--t-muted, #6B7280)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 600,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.68rem',
          fontWeight: 800,
        },
        originalPriceStyle: {
          color: 'var(--t-faint, #9CA3AF)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.76rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: 'var(--t-primary, #111827)',
          fontFamily: 'var(--font-clash)',
          fontSize: '1.08rem',
          fontWeight: 500,
        },
        selectPillStyle: {
          borderRadius: 999,
          backgroundColor: 'var(--s2, #F3F4F6)',
          color: 'var(--t-muted, #6B7280)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.72rem',
          fontWeight: 800,
        },
        selectPillSelectedStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
        },
        primaryButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: accent,
          color: '#FFFFFF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 800,
          boxShadow: `0 16px 30px ${colorWithAlpha(accent, '30')}`,
        },
        disabledButtonStyle: {
          borderRadius: '1rem',
          backgroundColor: 'var(--s1, #E5E7EB)',
          color: 'var(--t-disabled, #9CA3AF)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 800,
        },
        skipStyle: {
          color: 'var(--t-muted, #6B7280)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.86rem',
          fontWeight: 700,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
        buttonTextColor: '#FFFFFF',
      }
  }
}

function formatPrice(value: number) {
  return formatBookingPrice(value)
}

export function AddOnModal({
  addOns,
  onSelect,
  onSkip,
  language,
  variantStyle = 'modern',
  accentColor,
}: AddOnModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const accent = getVariantAccent(variantStyle, accentColor)
  const theme = getModalTheme(variantStyle, accent)
  const selectedAddOn = useMemo(
    () => addOns.find((addOn) => addOn.id === selectedId) ?? null,
    [addOns, selectedId]
  )
  const copy = TEXT[language]

  if (!addOns.length) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-black/55 px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-modal="true"
      role="dialog"
      style={theme.overlayStyle}
    >
      <motion.div
        className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6"
        style={theme.panelStyle}
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        <div className="mb-5 text-center">
          {theme.showIcon && (
            <div
              className="mx-auto mb-3 flex items-center justify-center"
              style={theme.iconWrapStyle}
              aria-hidden="true"
            >
              <Sparkles size={18} color={theme.iconColor} strokeWidth={2.2} />
            </div>
          )}
          <h2 style={theme.titleStyle}>
            {copy.title}
          </h2>
          <p className="mt-1" style={theme.subtitleStyle}>
            {copy.subtitle}
          </p>
        </div>

        <div className="space-y-3">
          {addOns.map((addOn) => {
            const isSelected = selectedId === addOn.id
            const hasDiscount = addOn.finalCena < addOn.originalCena

            return (
              <motion.button
                key={addOn.id}
                type="button"
                onClick={() => setSelectedId(addOn.id)}
                whileTap={{ scale: 0.985 }}
                className="relative w-full border-2 p-4 text-left transition-all duration-200"
                style={{
                  ...theme.optionStyle,
                  borderColor: isSelected
                    ? theme.optionSelectedBorderColor
                    : theme.optionBorderColor,
                  background: isSelected
                    ? theme.optionSelectedBackground
                    : theme.optionBackground,
                }}
                onMouseEnter={(event) => {
                  if (!isSelected) {
                    event.currentTarget.style.borderColor = theme.optionHoverBorderColor
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isSelected) {
                    event.currentTarget.style.borderColor = theme.optionBorderColor
                  }
                }}
              >
                {addOn.badgeLabel && (
                  <span
                    className="absolute right-3 top-3 px-2 py-1 leading-none"
                    style={theme.badgeStyle}
                  >
                    {addOn.badgeLabel}
                  </span>
                )}

                <div className="flex items-start gap-3 pr-14">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                    style={{
                      borderRadius: theme.checkRadius,
                      borderColor: isSelected ? accent : theme.optionBorderColor,
                      backgroundColor: isSelected ? accent : 'transparent',
                    }}
                  >
                    {isSelected && <Check size={14} color={theme.checkColor} strokeWidth={3} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 style={theme.nameStyle}>
                      {addOn.naziv}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1" style={theme.durationStyle}>
                        <Clock size={13} />
                        {addOn.trajanjeMin} min
                      </span>
                      <span className="inline-flex items-baseline gap-2">
                        {hasDiscount && (
                          <span className="line-through" style={theme.originalPriceStyle}>
                            {formatPrice(addOn.originalCena)}
                          </span>
                        )}
                        <span
                          style={{
                            lineHeight: 1,
                            ...theme.finalPriceStyle,
                          }}
                        >
                          {formatPrice(addOn.finalCena)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className="mt-3 inline-flex px-3 py-1.5 transition-colors"
                  style={{
                    ...theme.selectPillStyle,
                    ...(isSelected ? theme.selectPillSelectedStyle : {}),
                  }}
                >
                  {copy.select}
                </span>
              </motion.button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={!selectedAddOn}
          onClick={() => selectedAddOn && onSelect(selectedAddOn)}
          className="mt-5 w-full px-5 py-3.5 transition-all disabled:cursor-not-allowed"
          style={selectedAddOn ? theme.primaryButtonStyle : theme.disabledButtonStyle}
        >
          {copy.add}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="mt-4 w-full text-center transition-colors"
          style={theme.skipStyle}
        >
          {copy.skip}
        </button>
      </motion.div>
    </motion.div>
  )
}
