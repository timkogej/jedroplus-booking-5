'use client';

import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * A service or staff photo that fills its box. The parent sets the size and
 * shape (rounded, circle, card) on `className`; the photo covers it.
 *
 * - Without a photo, or when it fails to load, `fallback` (initials, the
 *   design's own symbol) is shown, so lists keep the same layout either way.
 * - The fallback stays underneath while the photo loads and the photo fades
 *   in over it, so nothing jumps.
 * - Lazy by default: photos further down the list load when they get close.
 */
export default function Photo({
  src,
  alt = '',
  fallback,
  className = '',
  style,
  imgClassName = '',
  imgStyle,
  eager = false,
}: {
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  imgClassName?: string;
  imgStyle?: CSSProperties;
  /** Load at once (the photo at the top of a step, the ticket). */
  eager?: boolean;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = Boolean(src) && failedSrc !== src;
  const loaded = usable && loadedSrc === src;

  // A cached image can finish before React attaches onLoad.
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && src && img.complete && img.naturalWidth > 0) setLoadedSrc(src);
    },
    [src]
  );

  return (
    <span className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative '}block overflow-hidden ${className}`} style={style}>
      {fallback != null && (
        <span
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
          style={{ opacity: loaded ? 0 : 1 }}
          aria-hidden={usable ? true : undefined}
        >
          {fallback}
        </span>
      )}
      {usable && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src!}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setLoadedSrc(src!)}
          onError={() => setFailedSrc(src!)}
          className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
          style={{
            opacity: loaded ? 1 : 0,
            // Only while loading, so a hover zoom from imgClassName still works.
            transform: loaded ? undefined : 'scale(1.04)',
            transition: 'opacity 0.5s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            ...imgStyle,
          }}
        />
      )}
    </span>
  );
}

/** True when the list has at least one photo; designs use it to pick a layout. */
export function anyPhoto(items: { slika_url?: string | null }[]): boolean {
  return items.some((i) => Boolean(i.slika_url));
}
