import type { ElementType, ReactNode } from 'react';

interface PageBannerProps {
  icon: ElementType;
  title: string;
  subtitle: ReactNode;
  /** Hex accent color (e.g. '#E08A3C') — every section keeps its own identity via this, on the same dark base. */
  accent: string;
  right?: ReactNode;
}

/**
 * Shared dark/gradient page banner (same treatment as the Dashboard) — every
 * CRM section uses the same near-black gradient base and only varies the
 * accent color, so the whole app reads as one consistent, compact design
 * instead of each page picking its own bright color.
 */
export default function PageBanner({ icon: Icon, title, subtitle, accent, right }: PageBannerProps) {
  return (
    <div className="relative overflow-hidden px-8 py-6 shadow-lg" style={{
      background: 'linear-gradient(135deg, #0f0820 0%, #1a0d38 55%, #0d1a2e 100%)',
      borderBottom: `1px solid ${accent}2e`,
    }}>
      <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ background: `${accent}14` }} />
      <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s', background: `${accent}19` }} />
      <div className="relative flex items-center gap-4 flex-wrap">
        <div className="p-3 rounded-2xl backdrop-blur-sm flex-shrink-0" style={{ background: `${accent}26`, border: `1px solid ${accent}4d` }}>
          <Icon className="w-7 h-7" style={{ color: accent }} />
        </div>
        <div className="min-w-48">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: `${accent}b3` }}>{subtitle}</p>
        </div>
        {right && <div className="ml-auto hidden sm:flex gap-3">{right}</div>}
      </div>
    </div>
  );
}
