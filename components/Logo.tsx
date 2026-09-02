/**
 * Arry Studio mark — a hanging studio microphone whose head frames the
 * "ARRY" / "STUDIO" wordmark. Uses `currentColor`, so it inverts cleanly
 * between the dark site and the light CRM.
 */
export function LogoMark({ size = 40, withCord = true, style }: { size?: number; withCord?: boolean; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 120 168"
      width={size}
      height={size * (168 / 120)}
      style={{ display: 'block', overflow: 'visible', ...style }}
      role="img"
      aria-label="Arry Studio"
    >
      <g fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round">
        {withCord && <line x1="60" y1="-4" x2="60" y2="58" />}
        {/* mic head arch + bracket feet */}
        <path d="M31 116 L31 84 A29 29 0 0 1 89 84 L89 116" />
        <path d="M22 116 L31 116 M89 116 L98 116 M22 116 L22 108 M98 116 L98 108" />
      </g>
      <text
        x="60" y="99" textAnchor="middle"
        fontFamily="var(--font-anton), 'Arial Narrow', sans-serif"
        fontSize="30" letterSpacing="0.5" fill="currentColor"
      >
        ARRY
      </text>
      <text
        x="60" y="150" textAnchor="middle"
        fontFamily="var(--font-anton), 'Arial Narrow', sans-serif"
        fontSize="34" letterSpacing="0.5" fill="currentColor"
      >
        STUDIO
      </text>
    </svg>
  );
}

/** Horizontal lockup: compact mark + stacked wordmark. */
export function LogoLockup({ tone = 'currentColor', sub = 'Studio · Școală de Muzică', compact = false }: { tone?: string; sub?: string; compact?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: tone }}>
      <LogoMark size={compact ? 30 : 38} withCord={false} />
      <span style={{ textAlign: 'left', lineHeight: 1.1 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-anton), var(--font-inter), sans-serif', fontSize: compact ? 15 : 17, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Arry Studio
        </span>
        {sub && (
          <span style={{ display: 'block', fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', opacity: 0.55, marginTop: 3, fontFamily: 'var(--font-inter), sans-serif' }}>
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}
