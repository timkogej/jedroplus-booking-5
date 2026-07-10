export type BookingVariantStyle =
  | 'classic'
  | 'elegant'
  | 'modern'
  | 'magazine'
  | 'casino'
  | 'seasonal'

export const DEFAULT_VARIANT_ACCENTS: Record<BookingVariantStyle, string> = {
  classic: '#F43F5E',
  elegant: '#B8860B',
  modern: '#6D5EF7',
  magazine: '#1A1A1A',
  casino: '#C9A84C',
  seasonal: '#3F7D4B',
}

export function getVariantAccent(
  variantStyle: BookingVariantStyle,
  accentColor?: string
) {
  return accentColor || DEFAULT_VARIANT_ACCENTS[variantStyle]
}

export function colorWithAlpha(color: string, alphaHex: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}${alphaHex}`
  }

  return color
}
