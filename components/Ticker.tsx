const ITEMS = ['Pian', 'Canto', 'Chitară', 'Tobe', 'Solfegiu', 'Înregistrări în studio'];

export default function Ticker() {
  const row = (key: string) => (
    <div className="tick-row" key={key}>
      {ITEMS.map((it, i) => (
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
