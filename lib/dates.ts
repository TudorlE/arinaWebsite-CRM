/** Calendar date (YYYY-MM-DD) of a Date in the *local* timezone.
 *  `d.toISOString().split('T')[0]` is UTC — for a local-midnight Date in
 *  Moldova (UTC+2/+3) that is the PREVIOUS day, which shifted every register
 *  cell by one day. */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today's date in Moldova, independent of the server's (UTC) timezone. */
export function todayChisinau(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Chisinau', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** {month 1-12, year} right now in Moldova. */
export function currentPeriodChisinau(): { month: number; year: number } {
  const [y, m] = todayChisinau().split('-');
  return { month: Number(m), year: Number(y) };
}

/** Last day (YYYY-MM-DD) of a month. */
export function monthEnd(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
}
