'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, Check } from 'lucide-react'
import { usePromotionsStore } from '@/store/promotionsStore'
import type { AddOnOption } from '@/lib/promotionsApi'
import {
  type BookingVariantStyle,
  colorWithAlpha,
  getVariantAccent,
} from '@/components/shared/variantStyles'

interface Props {
  addOns: AddOnOption[]
  isLoading: boolean
  primaryColor?: string
  variantStyle?: BookingVariantStyle
}

type SelectorTheme = {
  loadingStyle: CSSProperties
  iconWrapStyle: CSSProperties
  headingStyle: CSSProperties
  hintStyle: CSSProperties
  itemStyle: CSSProperties
  itemBackground: string
  itemSelectedBackground: string
  itemBorderColor: string
  itemSelectedBorderColor: string
  nameStyle: CSSProperties
  badgeStyle: CSSProperties
  durationStyle: CSSProperties
  originalPriceStyle: CSSProperties
  finalPriceStyle: CSSProperties
  checkRadius: CSSProperties['borderRadius']
  checkColor: string
}

function getSelectorTheme(
  variantStyle: BookingVariantStyle,
  accent: string
): SelectorTheme {
  switch (variantStyle) {
    case 'classic':
      return {
        loadingStyle: {
          borderRadius: '1rem',
          borderColor: '#E5E7EB',
          fontFamily: 'var(--font-nunito-sans)',
        },
        iconWrapStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          color: accent,
          borderRadius: 999,
        },
        headingStyle: {
          color: '#374151',
          fontFamily: 'var(--font-nunito)',
          fontSize: '0.9rem',
          fontWeight: 800,
        },
        hintStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.75rem',
        },
        itemStyle: {
          borderRadius: '0.875rem',
          fontFamily: 'var(--font-nunito-sans)',
        },
        itemBackground: '#FFFFFF',
        itemSelectedBackground: colorWithAlpha(accent, '08'),
        itemBorderColor: '#E5E7EB',
        itemSelectedBorderColor: accent,
        nameStyle: {
          color: '#111827',
          fontFamily: 'var(--font-nunito)',
          fontSize: '0.9rem',
          fontWeight: 700,
        },
        badgeStyle: {
          backgroundColor: accent,
          color: '#FFFFFF',
          borderRadius: 999,
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.68rem',
          fontWeight: 800,
        },
        durationStyle: {
          color: '#6B7280',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.75rem',
          fontWeight: 600,
        },
        originalPriceStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: accent,
          fontFamily: 'var(--font-nunito)',
          fontSize: '1.05rem',
          fontWeight: 800,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
      }
    case 'elegant':
      return {
        loadingStyle: {
          borderRadius: '0.75rem',
          borderColor: '#E5E7EB',
          fontFamily: 'var(--font-inter)',
        },
        iconWrapStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          color: accent,
          borderRadius: 999,
        },
        headingStyle: {
          color: '#1F2937',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 600,
        },
        hintStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.75rem',
        },
        itemStyle: {
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter)',
        },
        itemBackground: '#FFFFFF',
        itemSelectedBackground: colorWithAlpha(accent, '06'),
        itemBorderColor: '#E5E7EB',
        itemSelectedBorderColor: accent,
        nameStyle: {
          color: '#1F2937',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 600,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          border: `1px solid ${colorWithAlpha(accent, '30')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          fontWeight: 700,
        },
        durationStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 500,
        },
        originalPriceStyle: {
          color: '#9CA3AF',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: '#111111',
          fontFamily: 'var(--font-inter)',
          fontSize: '1rem',
          fontWeight: 600,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
      }
    case 'magazine':
      return {
        loadingStyle: {
          borderRadius: 0,
          borderColor: 'rgba(0,0,0,0.16)',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
        },
        iconWrapStyle: {
          backgroundColor: 'transparent',
          color: accent,
          border: `1px solid ${colorWithAlpha(accent, '40')}`,
          borderRadius: 0,
        },
        headingStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.72rem',
          fontWeight: 400,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        },
        hintStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: '0.78rem',
          fontStyle: 'italic',
        },
        itemStyle: {
          borderRadius: 0,
          fontFamily: 'var(--font-source-serif), Georgia, serif',
        },
        itemBackground: '#FFFFFF',
        itemSelectedBackground: colorWithAlpha(accent, '06'),
        itemBorderColor: 'rgba(0,0,0,0.14)',
        itemSelectedBorderColor: accent,
        nameStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1rem',
          fontWeight: 400,
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
        durationStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '0.58rem',
          fontWeight: 400,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        },
        originalPriceStyle: {
          color: '#6B6B6B',
          fontFamily: 'var(--font-source-serif), Georgia, serif',
          fontSize: '0.78rem',
          fontWeight: 400,
        },
        finalPriceStyle: {
          color: '#1A1A1A',
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '1.25rem',
          fontWeight: 300,
        },
        checkRadius: 0,
        checkColor: '#FFFFFF',
      }
    case 'casino':
      return {
        loadingStyle: {
          borderRadius: 8,
          borderColor: 'rgba(201,168,76,0.25)',
          background: 'rgba(10,40,20,0.45)',
          fontFamily: 'var(--font-cormorant)',
        },
        iconWrapStyle: {
          backgroundColor: 'rgba(201,168,76,0.12)',
          color: '#C9A84C',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 4,
        },
        headingStyle: {
          color: '#C9A84C',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.62rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        },
        hintStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '0.9rem',
          fontStyle: 'italic',
        },
        itemStyle: {
          borderRadius: 8,
          fontFamily: 'var(--font-cormorant)',
        },
        itemBackground: 'rgba(13,59,30,0.62)',
        itemSelectedBackground: 'rgba(201,168,76,0.08)',
        itemBorderColor: 'rgba(201,168,76,0.22)',
        itemSelectedBorderColor: '#C9A84C',
        nameStyle: {
          color: '#F5EDD6',
          fontFamily: 'var(--font-playfair)',
          fontSize: '0.96rem',
          fontWeight: 700,
        },
        badgeStyle: {
          backgroundColor: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.35)',
          color: '#C9A84C',
          borderRadius: 3,
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.5rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        },
        durationStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-oswald)',
          fontSize: '0.56rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
        originalPriceStyle: {
          color: '#A89060',
          fontFamily: 'var(--font-cormorant)',
          fontSize: '0.82rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: '#E8C96D',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.05rem',
          fontWeight: 700,
        },
        checkRadius: 999,
        checkColor: '#060F08',
      }
    case 'seasonal':
      return {
        loadingStyle: {
          borderRadius: '1rem',
          borderColor: 'var(--b2)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
        },
        iconWrapStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          color: accent,
          borderRadius: 999,
        },
        headingStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 800,
        },
        hintStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.75rem',
        },
        itemStyle: {
          borderRadius: '0.875rem',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
        },
        itemBackground: '#FFFFFF',
        itemSelectedBackground: colorWithAlpha(accent, '08'),
        itemBorderColor: 'var(--b2)',
        itemSelectedBorderColor: accent,
        nameStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 700,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.66rem',
          fontWeight: 800,
        },
        durationStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 600,
        },
        originalPriceStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-quicksand), var(--font-inter)',
          fontSize: '1rem',
          fontWeight: 800,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
      }
    case 'modern':
    default:
      return {
        loadingStyle: {
          borderRadius: '1rem',
          borderColor: 'var(--b2, #E5E7EB)',
          fontFamily: 'var(--font-inter)',
        },
        iconWrapStyle: {
          backgroundColor: colorWithAlpha(accent, '14'),
          color: accent,
          borderRadius: 10,
        },
        headingStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.88rem',
          fontWeight: 800,
        },
        hintStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.75rem',
        },
        itemStyle: {
          borderRadius: '0.875rem',
          fontFamily: 'var(--font-inter)',
        },
        itemBackground: 'var(--s1, #FFFFFF)',
        itemSelectedBackground: colorWithAlpha(accent, '08'),
        itemBorderColor: 'var(--b2, #E5E7EB)',
        itemSelectedBorderColor: accent,
        nameStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 700,
        },
        badgeStyle: {
          backgroundColor: colorWithAlpha(accent, '12'),
          border: `1px solid ${colorWithAlpha(accent, '28')}`,
          color: accent,
          borderRadius: 999,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.66rem',
          fontWeight: 800,
        },
        durationStyle: {
          color: 'var(--t-muted)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 600,
        },
        originalPriceStyle: {
          color: 'var(--t-faint)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.74rem',
          fontWeight: 500,
        },
        finalPriceStyle: {
          color: 'var(--t-primary)',
          fontFamily: 'var(--font-clash)',
          fontSize: '1rem',
          fontWeight: 500,
        },
        checkRadius: 999,
        checkColor: '#FFFFFF',
      }
  }
}

export function AddOnSelector({
  addOns,
  isLoading,
  primaryColor = '#6D5EF7',
  variantStyle = 'modern',
}: Props) {
  const { selectedAddOn, selectAddOn } = usePromotionsStore()
  const accent =
    variantStyle === 'casino'
      ? getVariantAccent(variantStyle)
      : getVariantAccent(variantStyle, primaryColor)
  const theme = getSelectorTheme(variantStyle, accent)

  if (isLoading) {
    return (
      <div className="border border-dashed p-4" style={theme.loadingStyle}>
        <div className="animate-pulse flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!addOns.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={theme.iconWrapStyle}
        >
          <Plus size={12} />
        </div>
        <p style={theme.headingStyle}>
          Dodaj storitev
        </p>
        <span style={theme.hintStyle}>(izberite 1)</span>
      </div>

      <div className="space-y-2">
        {addOns.map((addOn) => {
          const isSelected = selectedAddOn?.id === addOn.id
          const hasDiscount = addOn.finalCena < addOn.originalCena
          return (
            <motion.button
              key={addOn.id}
              onClick={() => selectAddOn(isSelected ? null : addOn)}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left border-2 p-3 transition-all duration-200"
              style={{
                ...theme.itemStyle,
                borderColor: isSelected
                  ? theme.itemSelectedBorderColor
                  : theme.itemBorderColor,
                background: isSelected
                  ? theme.itemSelectedBackground
                  : theme.itemBackground,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate" style={theme.nameStyle}>
                      {addOn.naziv}
                    </p>
                    {addOn.badgeLabel && (
                      <span
                        className="shrink-0 px-1.5 py-0.5 leading-none"
                        style={theme.badgeStyle}
                      >
                        {addOn.badgeLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1" style={theme.durationStyle}>
                      <Clock size={11} />
                      <span>{addOn.trajanjeMin} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasDiscount && (
                        <span className="line-through" style={theme.originalPriceStyle}>
                          €{addOn.originalCena.toFixed(2)}
                        </span>
                      )}
                      <span style={theme.finalPriceStyle}>
                        €{addOn.finalCena.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="ml-3 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderRadius: theme.checkRadius,
                    borderColor: isSelected ? accent : theme.itemBorderColor,
                    backgroundColor: isSelected ? accent : 'transparent',
                  }}
                >
                  {isSelected && <Check size={11} color={theme.checkColor} strokeWidth={3} />}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
