import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import BusRoute from '../components/BusRoute';
import Field from '../components/Field';
import { api, ApiError, fieldError, type City, type Partner } from '../lib/api';
import { etb, todayInAddis } from '../lib/format';

const T = {
  en: {
    pill: 'Intercity buses across Ethiopia',
    a: 'Every bus. Every city.', b: 'One ticket.',
    lead: 'Compare bus companies, pick your seat on a live seat map, and pay with telebirr, Chapa or a bank transfer. Your ticket arrives on your phone.',
    where: 'Where to?', from: 'From', to: 'To', date: 'Date', pax: 'Passengers', find: 'Find buses',
  },
  am: {
    pill: 'በኢትዮጵያ ውስጥ የከተማ ለከተማ አውቶቡሶች',
    a: 'ሁሉም አውቶቡስ። ሁሉም ከተማ።', b: 'አንድ ትኬት።',
    lead: 'የአውቶቡስ ድርጅቶችን ያወዳድሩ፣ ወንበርዎን ይምረጡ፣ በቴሌብር፣ በቻፓ ወይም በባንክ ዝውውር ይክፈሉ። ትኬትዎ በስልክዎ ይደርሳል።',
    where: 'ወዴት?', from: 'ከ', to: 'ወደ', date: 'ቀን', pax: 'ተሳፋሪዎች', find: 'አውቶቡስ ፈልግ',
  },
};

// Approximate road facts used only to draw the route illustration.
const ROUTE_INFO: Record<string, { km: number; stops: [string, number][] }> = {
  Mekelle: { km: 780, stops: [['Dessie', 52], ['Woldia', 70]] },
  'Bahir Dar': { km: 565, stops: [['Debre Markos', 50]] },
  Hawassa: { km: 275, stops: [['Mojo', 25], ['Ziway', 55]] },
  Gondar: { km: 730, stops: [['Debre Markos', 36], ['Bahir Dar', 74]] },
  'Dire Dawa': { km: 515, stops: [['Adama', 20], ['Awash', 45]] },
  Jimma: { km: 350, stops: [['Weliso', 33]] },
};

export default function Landing() {
  const nav = useNavigate();
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const t = T[lang];
  const [cities, setCities] = useState<City[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const [date, setDate] = useState(todayInAddis(1));
  const [pax, setPax] = useState(1);
  const [step, setStep] = useState(0);

  useEffect(() => {
    api<City[]>('/cities').then((c) => {
      setCities(c);
      setFrom(c.find((x) => x.name_en === 'Addis Ababa')?.id ?? c[0]?.id ?? 0);
      setTo(c.find((x) => x.name_en === 'Mekelle')?.id ?? c[1]?.id ?? 0);
    }).catch(() => {});
    api<Partner[]>('/partners').then(setPartners).catch(() => {});
  }, []);

  const fromName = cities.find((c) => c.id === from)?.name_en ?? 'Addis Ababa';
  const toName = cities.find((c) => c.id === to)?.name_en ?? '';
  const info = ROUTE_INFO[toName];

  const search = (e: FormEvent) => {
    e.preventDefault();
    nav(`/search?from=${from}&to=${to}&date=${date}&passengers=${pax}`);
  };

  const steps = [
    ['Search', 'Pick where you’re going and when. Compare departures, the full price and seats left side by side.'],
    ['Choose your seat', 'Pick a window or aisle seat. It’s held for you while you pay, and the timer shows the real time left.'],
    ['Pay and go', 'Pay with telebirr, Chapa, or a bank transfer we check automatically. Your QR ticket arrives by SMS.'],
  ];

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', padding: '48px 24px 36px' }}>
          <div className="stack" style={{ flex: '1 1 460px', minWidth: 0, gap: 22 }} lang={lang}>
            <div className="row between">
              <span className="pill">{t.pill}</span>
              <div className="lang" role="group" aria-label="Language">
                <button aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
                <button aria-pressed={lang === 'am'} onClick={() => setLang('am')} lang="am">አማርኛ</button>
              </div>
            </div>
            <h1 id="hero-title">{t.a} <span>{t.b}</span></h1>
            <p className="lead">{t.lead}</p>
            <ul className="row" aria-label="Ways to pay" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['telebirr', 'Chapa', 'Bank transfer'].map((p) => (
                <li key={p} style={{ fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.35)' }}>{p}</li>
              ))}
            </ul>
          </div>

          <form className="search-card" style={{ flex: '1 1 380px', minWidth: 0 }} onSubmit={search} aria-labelledby="search-title" lang={lang}>
            <h2 id="search-title" style={{ fontSize: 24 }}>{t.where}</h2>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 1, minWidth: 140 }}>
                <label htmlFor="from">{t.from}</label>
                <select id="from" value={from} onChange={(e) => setFrom(+e.target.value)}>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-ghost" aria-label="Swap origin and destination" onClick={() => { setFrom(to); setTo(from); }}>⇄</button>
              <div className="field" style={{ flex: 1, minWidth: 140 }}>
                <label htmlFor="to">{t.to}</label>
                <select id="to" value={to} onChange={(e) => setTo(+e.target.value)}>
                  {cities.filter((c) => c.id !== from).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <Field label={t.date} type="date" value={date} min={todayInAddis()} onChange={(e) => setDate(e.target.value)} required style={{ minWidth: 160 }} />
              <div className="field" style={{ minWidth: 120 }}>
                <label htmlFor="pax">{t.pax}</label>
                <select id="pax" value={pax} onChange={(e) => setPax(+e.target.value)}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={!from || !to || from === to}>{t.find}</button>
            <p className="small muted">Prices shown include the service fee. Nothing is added at checkout.</p>
          </form>
        </div>
        {info && (
          <div className="wrap" style={{ paddingBottom: 48 }}>
            <div style={{ background: '#0D2F27', borderRadius: 22, padding: '20px 24px 28px' }}>
              <p className="row between small"><strong>{fromName} → {toName}</strong><span style={{ color: 'var(--mint)' }}>about {info.km} km by road</span></p>
              <BusRoute from={fromName} to={toName} stops={info.stops} />
            </div>
          </div>
        )}
      </section>

      {partners.length > 0 && (
        <section className="ticker" aria-label="Bus partners">
          <div className="ticker-track">
            {[...partners, ...partners].map((p, i) => <span key={i} aria-hidden={i >= partners.length}>{p.name} ·</span>)}
          </div>
        </section>
      )}

      <section className="section wrap" id="how" aria-labelledby="how-title">
        <h2 id="how-title" className="h2" style={{ maxWidth: 640, marginBottom: 32 }}>No queue at the ticket office. Three steps from your phone.</h2>
        <div className="grid-3">
          {steps.map(([title, text], i) => (
            <button key={title} className="step" aria-pressed={step === i} onClick={() => setStep(i)}>
              <span className="n" aria-hidden="true">0{i + 1}</span>
              <h3 style={{ fontSize: 24 }}>{title}</h3>
              <p className="muted">{text}</p>
            </button>
          ))}
        </div>
      </section>

      <Partners partners={partners} />
      <ForOperators />
      <Faq />
    </>
  );
}

function Partners({ partners }: { partners: Partner[] }) {
  return (
    <section id="partners" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }} aria-labelledby="partners-title">
      <div className="wrap section stack" style={{ gap: 28 }}>
        <p className="small" style={{ fontWeight: 700, letterSpacing: '0.08em', color: 'var(--green)' }}>OUR BUS PARTNERS</p>
        <h2 id="partners-title" className="h2">
          {partners.length > 0 ? `${partners.length} bus ${partners.length === 1 ? 'company' : 'companies'}, one place to compare them.` : 'Our first bus partners are joining now.'}
        </h2>
        {partners.length > 0 ? (
          <ul className="grid-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {partners.map((p) => (
              <li key={p.slug} className="card row" style={{ gap: 14 }}>
                {p.logo_url
                  ? <img src={p.logo_url} alt={p.logo_alt} width={48} height={48} style={{ borderRadius: 12, objectFit: 'cover' }} />
                  : <span aria-hidden="true" className="logo" style={{ width: 48, height: 48, background: p.brand_color ?? 'var(--green)', color: '#fff', fontFamily: 'var(--body)', fontSize: 16 }}>{p.name.slice(0, 2).toUpperCase()}</span>}
                <span className="stack" style={{ gap: 2 }}>
                  <strong>{p.name}</strong>
                  <span className="small muted">
                    {p.rating !== null ? `★ ${p.rating} from ${p.review_count} verified trips` : 'New on Bemengede'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">We list a bus company here only after it has signed a partnership agreement with us.</p>
        )}
      </div>
    </section>
  );
}

function ForOperators() {
  const [buses, setBuses] = useState(30);
  const [trips, setTrips] = useState(6);
  const [share, setShare] = useState(30);
  const [fare, setFare] = useState(1500);
  const [occupancy, setOccupancy] = useState(80);
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_phone: '', contact_email: '', accept_privacy: false });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState<unknown>(null);

  const tickets = useMemo(() => Math.round(buses * trips * 4.3 * 51 * (occupancy / 100) * (share / 100)), [buses, trips, share, occupancy]);
  const sales = tickets * fare * 100;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending'); setErr(null);
    try {
      await api('/partner-applications', { method: 'POST', body: { ...form, fleet_size: buses } });
      setState('sent');
    } catch (x) { setErr(x); setState('idle'); }
  };

  const slider = (id: string, label: string, value: number, set: (n: number) => void, min: number, max: number, stepN: number, unit = '') => (
    <div className="field">
      <label htmlFor={id} className="row between"><span>{label}</span><output htmlFor={id}>{value.toLocaleString('en-US')}{unit}</output></label>
      <input id={id} type="range" min={min} max={max} step={stepN} value={value} onChange={(e) => set(+e.target.value)} />
    </div>
  );

  return (
    <section id="operators" className="dark" aria-labelledby="ops-title">
      <div className="wrap section" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
        <div className="stack" style={{ flex: '1 1 420px', minWidth: 0, gap: 20 }}>
          <p className="small" style={{ fontWeight: 700, letterSpacing: '0.08em', color: 'var(--yellow)' }}>FOR BUS COMPANIES</p>
          <h2 id="ops-title" className="h2">Your buses. Your brand. Sell seats around the clock.</h2>
          <p className="muted">Every partner gets its own portal to run the business, not just a listing.</p>
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 12 }}>
            {[
              ['Your own portal', 'Your logo and colours, plus a booking widget for your own website.'],
              ['Trips, fleet and fares', 'Recurring schedules, seat layouts, driver licence reminders and promo codes.'],
              ['Counter sales and QR boarding', 'Sell at the terminal, scan tickets at the gate, print manifests.'],
              ['Payments you can trust', 'Chapa split payouts, telebirr, and bank transfers checked with verify.et before a seat is confirmed.'],
              ['Clear reports', 'Occupancy, revenue by route and channel, cancellations. Export any time.'],
            ].map(([a, b]) => (
              <li key={a} style={{ borderBottom: '1px solid #2C3F38', paddingBottom: 12 }}><strong>{a}</strong><br /><span className="muted small">{b}</span></li>
            ))}
          </ul>
        </div>

        <div className="card stack" style={{ flex: '1 1 400px', minWidth: 0, color: 'var(--ink)' }}>
          <h3 style={{ fontSize: 24 }}>Estimate your online sales</h3>
          {slider('c-buses', 'Buses in your fleet', buses, setBuses, 1, 150, 1)}
          {slider('c-trips', 'Trips per bus each week', trips, setTrips, 1, 14, 1)}
          {slider('c-occ', 'Average seats filled', occupancy, setOccupancy, 30, 100, 5, '%')}
          {slider('c-share', 'Share of those sold online', share, setShare, 5, 80, 5, '%')}
          {slider('c-fare', 'Average fare (ETB)', fare, setFare, 200, 4000, 50)}
          <div className="row" aria-live="polite">
            <div className="card" style={{ flex: 1, background: 'var(--ground)', padding: 14 }}><span className="small muted">Online tickets / month</span><br /><strong className="total">{tickets.toLocaleString('en-US')}</strong></div>
            <div className="card" style={{ flex: 1, background: 'var(--warn-bg)', padding: 14 }}><span className="small" style={{ color: 'var(--warn-ink)' }}>Online sales / month</span><br /><strong className="total">{etb(sales)}</strong></div>
          </div>
          <p className="small muted">This is an illustration based on the numbers you set (51-seat buses, 4.3 weeks a month), not a promise of sales. Commission is agreed with each partner before signing.</p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', width: '100%' }} />
          {state === 'sent' ? (
            <div className="alert alert-ok" role="status">Thank you. Our partner team will contact you within two working days.</div>
          ) : (
            <form className="stack" onSubmit={submit} aria-labelledby="apply-title" noValidate>
              <h3 id="apply-title" style={{ fontSize: 20 }}>Apply to become a partner</h3>
              <Field label="Company name" autoComplete="organization" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} error={fieldError(err, 'company_name')} />
              <Field label="Your name" autoComplete="name" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} error={fieldError(err, 'contact_name')} />
              <Field label="Phone" type="tel" autoComplete="tel" inputMode="tel" required value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} error={fieldError(err, 'contact_phone')} />
              <Field label="Email (optional)" type="email" autoComplete="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} error={fieldError(err, 'contact_email')} />
              <label className="check">
                <input type="checkbox" checked={form.accept_privacy} onChange={(e) => setForm({ ...form, accept_privacy: e.target.checked })} aria-invalid={!!fieldError(err, 'accept_privacy')} />
                <span>I agree that Bemengede may use these details to contact me about partnering, as described in the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span>
              </label>
              {fieldError(err, 'accept_privacy') && <span className="error" role="alert">{fieldError(err, 'accept_privacy')}</span>}
              {err instanceof ApiError && !Object.keys(err.errors).length && <p className="error" role="alert">{err.message}</p>}
              <button className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send application'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    ['Do I need an account to book?', 'No. Book with your phone number and we send your ticket by SMS. An account only keeps your trip history in one place.'],
    ['Is the price I see the price I pay?', 'Yes. The price in search results already includes our service fee. Child and student discounts are shown before you pay.'],
    ['How do I pay by bank transfer?', 'Send the exact amount to the bus company’s account shown at checkout, then type the transaction reference. We check it with verify.et. If something doesn’t match, the bus company reviews it.'],
    ['Can I cancel?', 'Yes, according to the bus company’s cancellation rules, which are shown before you pay. You see the exact refund before you confirm.'],
    ['Can children travel?', 'Yes. An adult books and adds the child as a passenger at the child fare. You must be 18 or older to book.'],
  ];
  return (
    <section className="section narrow" aria-labelledby="faq-title" style={{ paddingTop: 72 }}>
      <h2 id="faq-title" className="h2" style={{ marginBottom: 24 }}>Questions</h2>
      <div className="stack" style={{ gap: 8 }}>
        {qs.map(([q, a]) => (
          <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
    </section>
  );
}
