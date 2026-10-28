// src/app/[slug]/opengraph-image.tsx
//
// Picture shown when a salon shares its booking link on Instagram, WhatsApp,
// Facebook or Viber: the salon's name and logo on its brand colour. Applies to
// /{slug} and every design under it.

import { ImageResponse } from 'next/og';
import { getBranding } from '@/lib/branding.server';
import { ensureReadable } from '@/lib/color';

export const alt = 'Spletna rezervacija termina';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const FALLBACK_COLOR = '#6D5EF7';

/** Brand colour from the booking init webhook; the default when it fails. */
async function brandColor(slug: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_N8N_BOOKING_URL;
  if (!url) return FALLBACK_COLOR;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init', companySlug: slug }),
      next: { revalidate: 3600 },
    });
    const data = (await res.json()) as { theme?: { primaryColor?: string } };
    const color = data?.theme?.primaryColor;
    return color && /^#[0-9a-f]{6}$/i.test(color) ? color : FALLBACK_COLOR;
  } catch {
    return FALLBACK_COLOR;
  }
}

/** The logo as a data URL (PNG or JPEG only), or null. */
async function logoDataUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl, { next: { revalidate: 3600 } });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/image\/(png|jpe?g)/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 1_500_000) return null;
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const [branding, color] = await Promise.all([getBranding(params.slug), brandColor(params.slug)]);
  const logo = await logoDataUrl(branding.logoUrl);
  const background = ensureReadable(color);
  const name = branding.name ?? 'Spletna rezervacija';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background,
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logo ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                borderRadius: 24,
                padding: 20,
                height: 140,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" style={{ maxHeight: 100, maxWidth: 360, objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 34, opacity: 0.85, letterSpacing: 2 }}>
              SPLETNA REZERVACIJA
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: name.length > 28 ? 64 : 84, fontWeight: 700, lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ display: 'flex', fontSize: 40, marginTop: 24, opacity: 0.92 }}>
            Rezervirajte termin na spletu
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 26, opacity: 0.8 }}>booking.jedroplus.com</div>
      </div>
    ),
    size,
  );
}
