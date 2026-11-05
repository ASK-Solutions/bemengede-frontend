import { useState } from 'react';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { Msg, PageHead, Select, Table, useCall, useLoad } from '../ui';

type C = { id: number; name_en: string; name_am: string | null; region: string | null; terminals: { id: number; name: string }[] };

export default function Cities() {
  const [cities, reload] = useLoad<C[]>('/admin/cities');
  const call = useCall();
  const [city, setCity] = useState({ name_en: '', name_am: '', region: '' });
  const [term, setTerm] = useState({ city_id: '', name: '' });
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const err = (e: unknown) => setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']);

  return (
    <>
      <PageHead title="Cities & terminals" sub="Shared by every operator. Names show to travellers in search." />
      <Msg text={msg[0]} kind={msg[1]} />
      <div className="split">
        <div className="main-col">
          <Table caption="Cities and terminals" head={['City', 'Amharic', 'Region', 'Terminals']} empty={cities?.length === 0}>
            {cities?.map((c) => <tr key={c.id}><td>{c.name_en}</td><td lang="am">{c.name_am ?? '—'}</td><td>{c.region ?? '—'}</td><td>{c.terminals.map((t) => t.name).join(', ') || '—'}</td></tr>)}
          </Table>
        </div>
        <div className="side-col stack">
          <section className="card stack" aria-labelledby="nc">
            <h2 id="nc" style={{ fontSize: 18 }}>Add city</h2>
            <Field label="Name (English)" value={city.name_en} onChange={(e) => setCity({ ...city, name_en: e.target.value })} />
            <Field label="Name (Amharic)" lang="am" value={city.name_am} onChange={(e) => setCity({ ...city, name_am: e.target.value })} />
            <Field label="Region" value={city.region} onChange={(e) => setCity({ ...city, region: e.target.value })} />
            <button className="btn btn-ghost" onClick={() => call('/admin/cities', 'POST', city).then(() => { setCity({ name_en: '', name_am: '', region: '' }); setMsg(['City added.', 'ok']); reload(); }).catch(err)}>Add city</button>
          </section>
          <section className="card stack" aria-labelledby="nt">
            <h2 id="nt" style={{ fontSize: 18 }}>Add terminal</h2>
            <Select label="City" value={term.city_id} onChange={(v) => setTerm({ ...term, city_id: v })} options={(cities ?? []).map((c) => [c.id, c.name_en])} />
            <Field label="Terminal name" value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} />
            <button className="btn btn-ghost" onClick={() => call('/admin/terminals', 'POST', { ...term, city_id: +term.city_id }).then(() => { setTerm({ city_id: '', name: '' }); setMsg(['Terminal added.', 'ok']); reload(); }).catch(err)}>Add terminal</button>
          </section>
        </div>
      </div>
    </>
  );
}
