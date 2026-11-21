// Small markdown renderer for authored content (no HTML injection; builds VNodes).
import type { Child } from '@rt/index';

function inline(text: string, keyBase = ''): Child[] {
  const out: Child[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${keyBase}-${i++}`;
    if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('**')) out.push(<strong key={k}>{inline(t.slice(2, -2), k)}</strong>);
    else if (t.startsWith('*')) out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>);
    else {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!;
      const href = mm[2];
      const ext = /^https?:/.test(href);
      out.push(<a key={k} href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{mm[1]}</a>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{inline(text ?? '')}</>;
}

export function Md({ text, className }: { text: string; className?: string }) {
  const lines = (text ?? '').replace(/\r/g, '').split('\n');
  const blocks: Child[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++} class="code" data-lang={fence[1] || undefined}><code>{buf.join('\n')}</code></pre>);
      continue;
    }
    const hd = /^(#{2,4})\s+(.*)$/.exec(line);
    if (hd) { const Tag = (hd[1].length <= 3 ? 'h4' : 'h5') as any; blocks.push(<Tag key={k++}>{inline(hd[2])}</Tag>); i++; continue; }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
        let it = lines[i].replace(/^\s*[-*] /, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*] /.test(lines[i])) it += ' ' + lines[i++].trim();
        items.push(it);
      }
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)] /.test(lines[i])) {
        let it = lines[i].replace(/^\s*\d+[.)] /, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+[.)] /.test(lines[i])) it += ' ' + lines[i++].trim();
        items.push(it);
      }
      blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={k++} class="callout">{inline(buf.join(' '))}</blockquote>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{2,4}\s|\s*[-*] |\s*\d+[.)] |>)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(<p key={k++}>{inline(buf.join(' '))}</p>);
  }
  return <div class={`md ${className ?? ''}`}>{blocks}</div>;
}
