/** The booking in progress, kept only for this tab (session storage). */
export type Draft = { tripId: number; seats: number[]; passengers: number };
const KEY = 'bm_booking';

export const saveDraft = (d: Draft) => sessionStorage.setItem(KEY, JSON.stringify(d));
export const readDraft = (): Draft | null => {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};
export const savePhone = (ref: string, phone: string) => sessionStorage.setItem(`bm_phone_${ref}`, phone);
export const readPhone = (ref: string) => sessionStorage.getItem(`bm_phone_${ref}`) ?? '';
