/** Amounts arrive in santim. Always show the full ETB amount with two decimals only when needed. */
export const etb = (santim: number) =>
  'ETB ' + (santim / 100).toLocaleString('en-US', { minimumFractionDigits: santim % 100 ? 2 : 0, maximumFractionDigits: 2 });

const TZ = 'Africa/Addis_Ababa';
export const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
export const duration = (mins: number) => `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}`;
export const todayInAddis = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
};
