'use client';
import { useLocale } from '@/lib/i18n';

export default function Ticker() {
  const { t } = useLocale();
  const items = [...t.common.courses, t.common.studioRecording];

  const row = (key: string) => (
    <div className="tick-row" key={key}>
      {items.map((it, i) => (
        <span className="tick-item" key={i}>
          {it}
          <span className="tick-dot" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="tick-wrap" aria-hidden="true">
      <div className="tick-track">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}
