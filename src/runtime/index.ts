/*
 * Minimal React-compatible UI runtime (offline build substitute for React).
 *
 * Supports: function components, hooks (useState, useReducer, useEffect, useLayoutEffect,
 * useRef, useMemo, useCallback), keyed children, fragments, refs, controlled inputs,
 * event props (onClick, onKeyDown, onInput, onChange…), style objects, and
 * dangerouslySetInnerHTML is intentionally NOT supported.
 *
 * Porting to React: replace imports of '@rt' with 'react' and set tsconfig jsxImportSource
 * to 'react'. Components use only APIs with identical React semantics. Rendering is
 * synchronous; any state update schedules one microtask re-render of the root.
 */

export type Key = string | number | null | undefined;
export type ComponentType<P = any> = (props: P) => Child;
export type Child = VNode | string | number | boolean | null | undefined | Child[];

export const Fragment = Symbol.for('rt.fragment');
const TEXT = Symbol.for('rt.text');

export interface VNode {
  type: string | ComponentType | typeof Fragment | typeof TEXT;
  props: any;
  key: Key;
  // internal
  _dom?: Node | null;
  _kids?: VNode[];
  _inst?: Instance;
}

interface Hook { value?: any; deps?: any[]; cleanup?: (() => void) | void; effect?: () => any; pending?: boolean; layout?: boolean }
interface Instance { hooks: Hook[]; vnode: VNode; unmounted?: boolean }

export function createElement(type: any, props: any, ...children: Child[]): VNode {
  const p = { ...(props || {}) };
  const key = p.key;
  delete p.key;
  if (children.length) p.children = children.length === 1 ? children[0] : children;
  return { type, props: p, key };
}
export const h = createElement;

// ---------------- hooks ----------------
let current: Instance | null = null;
let hookIndex = 0;
const effectQueue: Hook[] = [];
const layoutQueue: Hook[] = [];

function getHook(): Hook {
  if (!current) throw new Error('Hooks can only be called inside a component');
  const hooks = current.hooks;
  if (hookIndex >= hooks.length) hooks.push({});
  return hooks[hookIndex++];
}

const depsChanged = (a?: any[], b?: any[]) => !a || !b || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]));

export function useState<T>(init: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void] {
  const hook = getHook();
  if (!('value' in hook)) {
    const inst = current!;
    hook.value = [
      typeof init === 'function' ? (init as () => T)() : init,
      (v: any) => {
        const next = typeof v === 'function' ? v(hook.value[0]) : v;
        if (Object.is(next, hook.value[0]) || inst.unmounted) return;
        hook.value[0] = next;
        scheduleRender();
      },
    ];
  }
  return hook.value;
}

export function useReducer<S, A>(reducer: (s: S, a: A) => S, init: S): [S, (a: A) => void] {
  const [s, set] = useState(init);
  const hook = getHook();
  hook.value = reducer;
  const ref = hook;
  return [s, (a: A) => set((prev: S) => ref.value(prev, a))];
}

export function useRef<T>(init: T): { current: T } {
  const hook = getHook();
  if (!('value' in hook)) hook.value = { current: init };
  return hook.value;
}

export function useMemo<T>(fn: () => T, deps: any[]): T {
  const hook = getHook();
  if (!('value' in hook) || depsChanged(hook.deps, deps)) {
    hook.value = fn();
    hook.deps = deps;
  }
  return hook.value;
}

export function useCallback<T extends (...a: any[]) => any>(fn: T, deps: any[]): T {
  return useMemo(() => fn, deps);
}

function effectHook(fn: () => any, deps: any[] | undefined, layout: boolean) {
  const hook = getHook();
  if (!hook.deps || !deps || depsChanged(hook.deps, deps)) {
    hook.effect = fn;
    hook.deps = deps ?? undefined;
    hook.pending = true;
    hook.layout = layout;
    (layout ? layoutQueue : effectQueue).push(hook);
    if (!deps) hook.deps = undefined;
  }
}
export const useEffect = (fn: () => any, deps?: any[]) => effectHook(fn, deps, false);
export const useLayoutEffect = (fn: () => any, deps?: any[]) => effectHook(fn, deps, true);

function runEffects(queue: Hook[]) {
  const list = queue.splice(0);
  for (const h of list) {
    if (!h.pending) continue;
    h.pending = false;
    if (typeof h.cleanup === 'function') h.cleanup();
    h.cleanup = h.effect!();
  }
}

// ---------------- rendering ----------------
let rootVNode: VNode | null = null;
let rootDom: Element | null = null;
let rootFactory: (() => VNode) | null = null;
let scheduled = false;
let rendering = false;

export function scheduleRender() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    if (rootFactory && rootDom) doRender();
  });
}

export function render(factory: () => VNode, container: Element) {
  rootFactory = factory;
  rootDom = container;
  container.textContent = '';
  rootVNode = null;
  doRender();
}

/** Synchronously flush a pending render (used by tests). */
export function flush() {
  if (scheduled) { scheduled = false; doRender(); }
}

function doRender() {
  if (rendering) { scheduleRender(); return; }
  rendering = true;
  try {
    const next = normalize(rootFactory!());
    const kids = reconcileChildren(rootDom!, [next], rootVNode ? [rootVNode] : [], null);
    rootVNode = kids[0];
    placeChildren(rootDom!, kids);
  } finally {
    rendering = false;
  }
  runEffects(layoutQueue);
  if (effectQueue.length) setTimeout(() => runEffects(effectQueue), 0);
}

function normalize(c: Child): VNode {
  if (c == null || typeof c === 'boolean') return { type: TEXT, props: { v: '' }, key: null };
  if (typeof c === 'string' || typeof c === 'number') return { type: TEXT, props: { v: String(c) }, key: null };
  if (Array.isArray(c)) return { type: Fragment, props: { children: c }, key: null };
  return c;
}

function flattenChildren(children: any, out: VNode[] = []): VNode[] {
  if (Array.isArray(children)) for (const c of children) flattenChildren(c, out);
  else if (children == null || typeof children === 'boolean') { /* skip */ }
  else out.push(normalize(children));
  return out;
}

function sameKind(a: VNode, b: VNode) {
  return a.type === b.type && a.key === b.key;
}

/** Diff a list of new children against old ones; returns the committed new list. */
function reconcileChildren(parentDom: Node, newKids: VNode[], oldKids: VNode[], svg: boolean | null): VNode[] {
  const keyed = new Map<any, VNode>();
  const unkeyed: VNode[] = [];
  for (const o of oldKids) (o.key != null ? keyed.set(o.key, o) : unkeyed.push(o));
  const used = new Set<VNode>();
  const result: VNode[] = [];
  let ui = 0;
  for (const n of newKids) {
    let match: VNode | undefined;
    if (n.key != null) {
      const k = keyed.get(n.key);
      if (k && k.type === n.type) match = k;
    } else {
      // first unused unkeyed old child of same type, scanning forward
      for (let j = ui; j < unkeyed.length; j++) {
        if (!used.has(unkeyed[j]) && unkeyed[j].type === n.type) { match = unkeyed[j]; if (j === ui) ui++; break; }
      }
    }
    if (match) used.add(match);
    result.push(diff(parentDom, n, match ?? null, !!svg));
  }
  for (const o of oldKids) if (!used.has(o)) unmount(o, true);
  return result;
}

function domNodes(v: VNode, out: Node[] = []): Node[] {
  if (typeof v.type === 'string' || v.type === TEXT) { if (v._dom) out.push(v._dom); }
  else for (const k of v._kids ?? []) domNodes(k, out);
  return out;
}

function placeChildren(parent: Node, kids: VNode[]) {
  const nodes: Node[] = [];
  for (const k of kids) domNodes(k, nodes);
  let ref: Node | null = parent.firstChild;
  for (const n of nodes) {
    if (n === ref) { ref = ref.nextSibling; continue; }
    parent.insertBefore(n, ref);
  }
}

function diff(parentDom: Node, n: VNode, o: VNode | null, svg: boolean): VNode {
  if (o && !sameKind(n, o)) { unmount(o, true); o = null; }
  const v: VNode = { type: n.type, props: n.props, key: n.key };

  if (n.type === TEXT) {
    if (o?._dom) {
      if ((o._dom as Text).data !== n.props.v) (o._dom as Text).data = n.props.v;
      v._dom = o._dom;
    } else v._dom = document.createTextNode(n.props.v);
    return v;
  }

  if (n.type === Fragment) {
    v._kids = reconcileChildren(parentDom, flattenChildren(n.props.children), o?._kids ?? [], svg);
    return v;
  }

  if (typeof n.type === 'function') {
    const inst: Instance = o?._inst ?? { hooks: [], vnode: v };
    inst.vnode = v;
    v._inst = inst;
    const prev = current, prevIdx = hookIndex;
    current = inst; hookIndex = 0;
    let out: Child;
    try { out = (n.type as ComponentType)(n.props); }
    finally { current = prev; hookIndex = prevIdx; }
    v._kids = reconcileChildren(parentDom, flattenChildren(out), o?._kids ?? [], svg);
    return v;
  }

  // host element
  const tag = n.type as string;
  const isSvg = svg || tag === 'svg';
  let dom = o?._dom as Element | undefined;
  if (!dom) dom = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  v._dom = dom;
  setProps(dom as HTMLElement, n.props, o?.props ?? {}, isSvg);
  const kids = reconcileChildren(dom, flattenChildren(n.props.children), o?._kids ?? [], isSvg && tag !== 'foreignObject');
  v._kids = kids;
  placeChildren(dom, kids);
  // trailing stale nodes (should not happen, defensive)
  const expected = new Set<Node>(); for (const k of kids) domNodes(k).forEach((x) => expected.add(x));
  for (let c = dom.firstChild; c; ) { const nx = c.nextSibling; if (!expected.has(c)) dom.removeChild(c); c = nx; }
  // controlled value after children (for <select>)
  if ('value' in n.props && (dom as any).value !== String(n.props.value ?? '')) (dom as any).value = n.props.value ?? '';
  const ref = n.props.ref;
  if (ref && ref !== o?.props?.ref) { if (typeof ref === 'function') ref(dom); else ref.current = dom; }
  return v;
}

const PROP_ALIASES: Record<string, string> = { className: 'class', htmlFor: 'for' };

function setProps(dom: HTMLElement, props: any, old: any, svg: boolean) {
  for (const k in old) if (!(k in props) && k !== 'children') setProp(dom, k, undefined, old[k], svg);
  for (const k in props) if (k !== 'children' && props[k] !== old[k]) setProp(dom, k, props[k], old[k], svg);
}

function setProp(dom: any, name: string, value: any, oldValue: any, svg: boolean) {
  if (name === 'key' || name === 'ref') return;
  if (name.startsWith('on') && name.length > 2) {
    let ev = name.slice(2).toLowerCase();
    if (ev === 'doubleclick') ev = 'dblclick';
    if (ev === 'change' && (dom.tagName === 'INPUT' && dom.type !== 'checkbox' && dom.type !== 'radio' || dom.tagName === 'TEXTAREA')) ev = 'input';
    dom._l ??= {};
    if (!dom._l[ev]) dom.addEventListener(ev, (e: Event) => dom._l[ev]?.(e));
    dom._l[ev] = value;
    return;
  }
  if (name === 'style') {
    if (typeof value === 'string' || value == null) { dom.style.cssText = value ?? ''; return; }
    if (typeof oldValue === 'string') dom.style.cssText = '';
    for (const k in oldValue ?? {}) if (!(k in value)) dom.style[k] = '';
    for (const k in value) { if (k.startsWith('--')) dom.style.setProperty(k, value[k]); else dom.style[k] = value[k]; }
    return;
  }
  if (name === 'value' || name === 'checked' || name === 'selected') {
    if (dom[name] !== value) dom[name] = name === 'value' ? (value ?? '') : !!value;
    return;
  }
  const attr = PROP_ALIASES[name] ?? name;
  if (value == null || value === false && !attr.startsWith('aria-') && !attr.startsWith('data-')) dom.removeAttribute(attr);
  else dom.setAttribute(attr, value === true ? '' : String(value));
}

function unmount(v: VNode, removeDom: boolean) {
  if (v._inst) {
    v._inst.unmounted = true;
    for (const hk of v._inst.hooks) if (typeof hk.cleanup === 'function') { hk.cleanup(); hk.cleanup = undefined; hk.pending = false; }
  }
  if (typeof v.type === 'string' && v.props?.ref) { const r = v.props.ref; if (typeof r === 'function') r(null); else r.current = null; }
  for (const k of v._kids ?? []) unmount(k, removeDom && typeof v.type !== 'string');
  if (removeDom && v._dom && v._dom.parentNode) v._dom.parentNode.removeChild(v._dom);
}
