import { Fragment, type VNode } from './index';
export { Fragment };
export function jsx(type: any, props: any, key?: any): VNode {
  const p = props ? { ...props } : {};
  if (key === undefined && p.key !== undefined) key = p.key;
  delete p.key;
  return { type, props: p, key: key ?? null };
}
export const jsxs = jsx;
export namespace JSX {
  export type Element = VNode;
  export interface IntrinsicElements { [tag: string]: any }
  export interface ElementChildrenAttribute { children: {} }
  export interface IntrinsicAttributes { key?: string | number | null }
}
