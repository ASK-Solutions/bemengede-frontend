export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: Record<string, string[]> = {}) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client': 'web',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message ?? 'Something went wrong. Please try again.', res.status, data.errors ?? {});
  }
  return data as T;
}

/** First validation message for a field, for showing next to the input. */
export const fieldError = (e: unknown, field: string): string | undefined =>
  e instanceof ApiError ? e.errors[field]?.[0] : undefined;

export type Trip = {
  id: number;
  operator: { name: string; slug: string; brand_color: string | null; free_cancel_hours: number; late_cancel_fee_percent: number };
  origin: { city: string; terminal: string };
  destination: { city: string; terminal: string };
  departure_at: string;
  arrival_at: string;
  duration_minutes: number;
  bus_class: string;
  amenities: string[];
  seats_left: number;
  fare: number;
  service_fee_per_seat: number;
  price_per_seat: number;
  layout?: { rows: number; columns: number; aisle_after: number; blocked: number[] };
  seat_count?: number;
  unavailable_seats?: number[];
};

export type Booking = {
  reference: string;
  status: 'pending_payment' | 'awaiting_verification' | 'confirmed' | 'checked_in' | 'cancelled' | 'expired' | 'refunded';
  trip: Trip;
  contact_phone_masked: string | null;
  passengers: { full_name: string; seat_number: number; fare_category: string; fare: number; qr: string | null; checked_in: boolean }[];
  price: { subtotal: number; discount: number; service_fee: number; total: number; currency: string };
  expires_at: string | null;
  refund_amount: number | null;
  payment: { provider: string; status: string; tx_ref: string; checkout_url: string | null } | null;
  transfer_accounts: { bank: string; account_name: string; account_number: string }[];
};

export type City = { id: number; name_en: string; name_am: string | null };
export type Partner = { name: string; slug: string; brand_color: string | null; logo_url: string | null; logo_alt: string; rating: number | null; review_count: number };
export type Business = { trade_name: string; legal_name: string; tin: string; trade_license_no: string; address: string; email: string; privacy_email: string; phone: string; support_hours: string };
