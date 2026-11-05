import { useEffect, useState } from 'react';
import { api, type Business } from './api';

let cache: Business | null = null;

export function useBusiness() {
  const [b, setB] = useState<Business | null>(cache);
  useEffect(() => {
    if (!cache) api<Business>('/business').then((x) => { cache = x; setB(x); }).catch(() => {});
  }, []);
  return b;
}
