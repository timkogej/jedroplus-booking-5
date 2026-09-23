'use client'
import { formatBookingPrice } from '@/lib/pricing';

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Tag, Clock } from 'lucide-react'
import {
  type BookingVariantStyle,
  colorWithAlpha,
  getVariantAccent,
} from '@/components/shared/variantStyles'

interface Props {
  type: 'popust' | 'happy_hour'
  naziv: string
  badgeLabel: string
  originalCena: number
  finalCena: number
  size?: 'sm' | 'md'
  variantStyle?: BookingVariantStyle
  accentColor?: string
  priceClassName?: string
  priceStyle?: CSSProperties
  originalPriceStyle?: CSSProperties
  align?: 'start' | 'end'
}

type BadgeStyleConfig = {
  badgeStyle: CSSProperties
  finalPriceStyle: CSSProperties
  originalPriceStyle: CSSProperties
  showIcon: boolean
}

function getBadgeStyles(
  variantStyle: BookingVariantStyle,
  accent: string,
  size: 'sm' | 'md'
): BadgeStyleConfig {
  const isSmall = size === 'sm'

  switch (variantStyle) {
    case 'classic':
      return {
        badgeStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
          borderRadius: 999,
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: isSmall ? '0.58rem' : '0.68rem',
          fontWeight: 700,
        },
        finalPriceStyle: {
          color: accent,
          fontFamily: 'var(--font-nunito)',
          fontSize: isSmall ? '1.125rem' : '1.25rem',
          fontWeight: 700,
        },
        originalPriceStyle: {
          color: '#D1D5DB',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: isSmall ? '0.75rem' : '0.8rem',
          fontWeight: 500,
        },
        showIcon: true,
      }
    case 'elegant':
      return {
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          border: `1px solid ${colorWithAlpha(accent, '30')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: isSmall ? '0.58rem' : '0.66rem',
          fontWeight: 600,
        },
        finalPriceStyle: {
          color: '#111111',
          fontFamily: 'var(--font-inter)',
          fontSize: isSmall ? '1rem' : '1.08rem',
          fontWeight: 600,
        },
        originalPriceStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: isSmall ? '0.72rem' : '0.78rem',
          fontWeight: 500,
        },
        showIcon: true,
      }
    case 'magazine':
      return {
        badgeStyle: {
          backgroundColor: 'transparent',
          border: `1px solid ${colorWithAlpha(accent, '40')}`,
          color: accent,
          borderRadius: 0,
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: isSmall ? '0.48rem' : '0.55rem',
          fontWeight: 400,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        },
        finalPriceStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: isSmall ? '1.4rem' : '1.5rem',
          fontWeight: 300,
          fontVariantNumeric: 'tabular-nums',
        },
        originalPriceStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: isSmall ? '0.75rem' : '0.82rem',
          fontWeight: 400,
          fontVariantNumeric: 'tabular-nums',
        },
        showIcon: false,
      }
    case 'casino':
      return {
        badgeStyle: {
          backgroundColor: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.35)',
          color: '#C9A84C',
          borderRadius: 3,
          fontFamily: 'var(--font-oswald)',
          fontSize: isSmall ? '0.48rem' : '0.55rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        },
        finalPriceStyle: {
          color: '#E8C96D',
          fontFamily: 'var(--font-playfair)',
          fontSize: isSmall ? '1.05rem' : '1.15rem',
          fontWeight: 700,
        },
        originalPriceStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-cormorant)',
          fontSize: isSmall ? '0.82rem' : '0.9rem',
          fontWeight: 500,
        },
        showIcon: false,
      }
    case 'seasonal':
      return {
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          border: `1px solid ${colorWithAlpha(accent, '30')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: isSmall ? '0.58rem' : '0.66rem',
          fontWeight: 700,
        },
        finalPriceStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: isSmall ? '1.05rem' : '1.15rem',
          fontWeight: 700,
        },
        originalPriceStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: isSmall ? '0.72rem' : '0.78rem',
          fontWeight: 500,
        },
        showIcon: true,
      }
    case 'modern':
    default:
      return {
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          border: `1px solid ${colorWithAlpha(accent, '30')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: isSmall ? '0.58rem' : '0.66rem',
          fontWeight: 700,
        },
        finalPriceStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-clash)',
          fontSize: isSmall ? '1.05rem' : '1.15rem',
          fontWeight: 500,
        },
        originalPriceStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-inter)',
          fontSize: isSmall ? '0.72rem' : '0.78rem',
          fontWeight: 500,
        },
        showIcon: true,
      }
  }
}

export function PromotionBadge({
  type,
  naziv,
  badgeLabel,
  originalCena,
  finalCena,
  size = 'md',
  variantStyle = 'modern',
  accentColor,
  priceClassName,
  priceStyle,
  originalPriceStyle,
  align = 'end',
}: Props) {
  const isHH = type === 'happy_hour'
  const Icon = isHH ? Clock : Tag
  const accent = getVariantAccent(variantStyle, accentColor)
  const styles = getBadgeStyles(variantStyle, accent, size)
  const alignClass = align === 'start' ? 'items-start text-left' : 'items-end text-right'

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`inline-flex flex-col gap-1 ${alignClass}`}
    >
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 leading-none"
        style={{
          ...styles.badgeStyle,
        }}
      >
        {styles.showIcon && <Icon size={size === 'sm' ? 9 : 10} />}
        <span>{naziv}</span>
        <span className="opacity-90">{badgeLabel}</span>
      </div>

      <div className={`flex items-baseline gap-1.5 ${align === 'start' ? 'justify-start' : 'justify-end'}`}>
        <span
          className="line-through"
          style={{
            ...styles.originalPriceStyle,
            ...originalPriceStyle,
          }}
        >
          {formatBookingPrice(originalCena)}
        </span>
        <span
          className={priceClassName}
          style={{
            lineHeight: 1,
            ...styles.finalPriceStyle,
            ...priceStyle,
          }}
        >
          {formatBookingPrice(finalCena)}
        </span>
      </div>
    </motion.div>
  )
}
