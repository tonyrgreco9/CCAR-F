import { LINK_GROUPS, LINKS_CHECKED_ON } from '../content/links';

export function LinksPage() {
  return (
    <div class="page links-page">
      <h2>Links</h2>
      <p class="muted">Official exam resources first, then free courses, documentation, and third-party study guides, practice exams and videos. Compiled {LINKS_CHECKED_ON}. Third-party resources are unofficial and not endorsed; check their claims against the official exam guide.</p>
      <nav class="toc" aria-label="Link groups">
        {LINK_GROUPS.map((g) => <a key={g.id} href={`#/links?g=${g.id}`} onClick={(e: Event) => { e.preventDefault(); document.getElementById(`lg-${g.id}`)?.scrollIntoView({ block: 'start' }); }}>{g.title}</a>)}
      </nav>
      {LINK_GROUPS.map((g) => (
        <section class="card" id={`lg-${g.id}`} key={g.id}>
          <h3>{g.title} <span class="muted small">({g.links.length})</span></h3>
          <p class="small muted">{g.intro}</p>
          <ul class="link-list">
            {g.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                {g.id === 'official' ? <span class="tag ok">Official</span> : g.id === 'guides' || g.id === 'practice' || g.id === 'videos' ? <span class="tag">Unofficial</span> : null}
                {l.note ? <span class="small block muted">{l.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p class="small muted">Not listed on purpose: re-uploads of the exam guide on document-sharing sites, and sites selling "real exam questions" — sharing exam content breaks the exam's confidentiality agreement (guide §14).</p>
    </div>
  );
}
