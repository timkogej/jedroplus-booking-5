'use client';

/**
 * The company logo in a booking page header, with the name as the fallback.
 *
 * Owners often only have a logo with a solid white background. On the dark
 * designs that would be a bright rectangle, so there we put the logo on a
 * white rounded chip — it then reads as a deliberate badge instead of a
 * mistake. The settings page warns them about it as well.
 */
export default function CompanyLogo({
  name,
  logoUrl,
  variant = 'light',
  maxHeight = 40,
  className = '',
  nameClassName = '',
  nameStyle,
}: {
  name: string;
  logoUrl?: string | null;
  variant?: 'light' | 'dark';
  maxHeight?: number;
  className?: string;
  nameClassName?: string;
  nameStyle?: React.CSSProperties;
}) {
  if (!logoUrl) {
    return (
      <span className={nameClassName} style={nameStyle}>
        {name}
      </span>
    );
  }

  const chip =
    variant === 'dark'
      ? { background: '#FFFFFF', padding: '6px 10px', borderRadius: 10 }
      : undefined;

  return (
    <span className={`inline-flex items-center ${className}`} style={chip}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={name}
        style={{ maxHeight, maxWidth: 200, objectFit: 'contain' }}
      />
    </span>
  );
}
