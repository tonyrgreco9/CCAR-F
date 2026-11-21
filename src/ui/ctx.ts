// Global app context: the store singleton and hash router helpers.
import { Store } from '../engine/store';
import { QUESTIONS } from '../content';
import { scheduleRender } from '@rt/index';

function storage() {
  try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch { return null; }
}

// `?now=` lets automated tests shift the clock (e.g. to simulate time passing while closed).
const offset = (() => { try { return Number(new URLSearchParams(location.search).get('clockOffsetMs') ?? 0) || 0; } catch { return 0; } })();
export const store = new Store({ kv: typeof window !== 'undefined' ? storage() : null, now: () => Date.now() + offset, bank: QUESTIONS });
store.subscribe(scheduleRender);
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === null || e.key === 'ccarf-prep') store.reload(); });
}

export interface Route { path: string[]; query: URLSearchParams }
export function currentRoute(): Route {
  const h = location.hash.replace(/^#/, '') || '/';
  const [p, q] = h.split('?');
  return { path: p.split('/').filter(Boolean), query: new URLSearchParams(q ?? '') };
}
export function go(to: string) {
  if (location.hash === '#' + to) { scheduleRender(); return; }
  location.hash = to;
}
export const lessonHref = (id: string, section?: string) => `#/lesson/${id}${section ? `?s=${section}` : ''}`;
export const practiceHref = (kind: string, value?: string) => `#/practice?${kind}${value ? `=${encodeURIComponent(value)}` : ''}`;

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
export const pct = (c: number, t: number) => (t ? Math.round((100 * c) / t) : 0);
export const LETTERS = 'ABCDEF';

// Read-only handle for automated browser checks (no secrets; same data as localStorage).
if (typeof window !== 'undefined') (window as any).__ccarf = store;
