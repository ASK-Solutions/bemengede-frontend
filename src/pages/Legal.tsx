import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';

type Doc = { version: string; effective: string; markdown: string };

export default function Legal({ doc }: { doc: 'privacy' | 'terms' | 'refund' | 'cookies' }) {
  const [d, setD] = useState<Doc | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { setD(null); api<Doc>(`/legal/${doc}`).then(setD).catch((e) => setErr(e.message)); }, [doc]);

  return (
    <article className="narrow legal">
      {err && <p className="alert alert-error">{err}</p>}
      {!d && !err && <h1>Loading…</h1>}
      {d && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="table-wrap"><table>{children}</table></div> }}>
          {d.markdown}
        </ReactMarkdown>
      )}
      {d && <p className="small muted">Version {d.version}</p>}
    </article>
  );
}
