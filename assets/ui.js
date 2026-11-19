/* Interface : fil conducteur, compromis interactif, enseignements automatiques, levier des recommandations, animations, aide clavier */

/* ---------- Levier des recommandations (même calcul que la feuille Plan du classeur) ---------- */
function recoLeverage() {
  return D.recos.map(rc => {
    let d = 0; rc.risques.forEach(id => { const r = R(id), cv = recosOf(id).length, b = S.ov[id] || { p: r.p, g: r.g };
      const p = Math.round(b.p + (r.target.p - b.p) / cv), g = Math.round(b.g + (r.target.g - b.g) / cv); d += b.p * b.g - p * g; });
    return { rc, d };
  });
}
function planAll() { const keep = S.plan, mode = S.mode; S.plan = new Set(D.recos.map(r => r.id)); S.mode = 'plan'; const out = D.risks.map(r => ({ r, ...sc(r) })); S.plan = keep; S.mode = mode; return out; }

/* ---------- Fil conducteur : indices → risques → lacunes → recommandations → suivi ---------- */
const THREAD = [
  { k: 'idx', l: 'Indices du cas', n: () => D.indices.length, p: ['cadrage'], h: 'cadrage' },
  { k: 'risk', l: 'Risques', n: () => D.risks.length, p: ['registre', 'carto', 'acteurs', 'transparence'], h: 'registre' },
  { k: 'coso', l: 'Lacunes COSO', n: () => D.coso.length, p: ['coso', 'gouv'], h: 'coso' },
  { k: 'reco', l: 'Recommandations', n: () => D.recos.length, p: ['recos', 'excel'], h: 'recos' },
  { k: 'kpi', l: 'Suivi (KPI)', n: () => D.recos.length, p: ['incidents'], h: 'incidents' }
];
function thread(page) {
  if (['rapport', 'note', 'soutenance', 'qualite', 'grille', 'entrainement'].includes(page)) return '';
  return `<nav class="thread" aria-label="Fil conducteur du raisonnement">${THREAD.map((t, i) => `<a href="#/${t.h}" class="${t.p.includes(page) ? 'on' : ''}" ${t.p.includes(page) ? 'aria-current="step"' : ''}><b>${t.n()}</b><span>${t.l}</span></a>${i < THREAD.length - 1 ? '<i class="ar">→</i>' : ''}`).join('')}</nav>`;
}

/* ---------- Compromis rapidité / appétence au risque / contrôles ---------- */
const TRI = { a: .36, b: .27, c: .37 };
const TV = { a: [200, 36], b: [34, 312], c: [366, 312] };            // sommets : vitesse, appétence au risque, contrôles
const triPt = w => [w.a * TV.a[0] + w.b * TV.b[0] + w.c * TV.c[0], w.a * TV.a[1] + w.b * TV.b[1] + w.c * TV.c[1]];
const scW = s => { const t = s.rap + s.risque + s.ctrl; return { a: s.rap / t, b: s.risque / t, c: s.ctrl / t }; };
const TRI_MSG = {
  A: 'Vous poussez la vitesse et acceptez le risque : c\'est la situation actuelle de PayMaroc. Rapidité maximale, mais incidents mal traités, mises en production sans filtre et contrôles fragiles.',
  B: 'Vous privilégiez les contrôles : le risque baisse, mais les lancements se figent. Inadapté à une fintech en croissance.',
  C: 'Équilibre recommandé : voie rapide pour les changements mineurs, gate complète pour tout ce qui touche au paiement, incidents classés et suivis.'
};
function triNearest() { let best = null; D.scenarios.forEach(s => { const w = scW(s), d = Math.hypot(w.a - TRI.a, w.b - TRI.b, w.c - TRI.c); if (!best || d < best.d) best = { s, d }; }); return best.s; }
function triOut() {
  const s = triNearest(), pct = v => Math.round(v * 100);
  return `<div class="tri-out"><div class="row" style="gap:6px"><span class="tag" style="background:var(--surface2);color:var(--ink);border-color:var(--line)">Vitesse ${pct(TRI.a)} %</span><span class="tag" style="background:var(--surface2);color:var(--ink);border-color:var(--line)">Appétence au risque ${pct(TRI.b)} %</span><span class="tag" style="background:var(--surface2);color:var(--ink);border-color:var(--line)">Contrôles ${pct(TRI.c)} %</span></div>
  <p style="margin:8px 0 2px"><b>Le plus proche : ${s.id === 'C' ? '★ ' : ''}${esc(s.nom)}</b></p><p class="small" style="margin:0">${TRI_MSG[s.id]}</p></div>`;
}
function triangle() {
  const [x, y] = triPt(TRI);
  const pts = D.scenarios.map(s => { const [px, py] = triPt(scW(s)); return `<g><circle cx="${px}" cy="${py}" r="${s.id === 'C' ? 9 : 7}" fill="${s.id === 'C' ? 'var(--brand)' : 'var(--ink2)'}" stroke="var(--surface)" stroke-width="2"/><text x="${px + 12}" y="${py + 4}" font-size="12" font-weight="700" fill="currentColor">${s.id}</text><title>${esc(s.nom)}</title></g>`; }).join('');
  const grid = [.25, .5, .75].map(k => `<path d="M${TV.a[0] * k + TV.b[0] * (1 - k)} ${TV.a[1] * k + TV.b[1] * (1 - k)} L${TV.a[0] * k + TV.c[0] * (1 - k)} ${TV.a[1] * k + TV.c[1] * (1 - k)}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join('');
  return `<svg id="tri" viewBox="0 0 400 350" role="application" tabindex="0" aria-label="Curseur de compromis entre vitesse, appétence au risque et contrôles. Flèches pour déplacer." style="width:100%;max-width:440px;touch-action:none;cursor:crosshair">
   <path d="M${TV.a} L${TV.b} L${TV.c}Z" fill="var(--brand-tint)" stroke="var(--brand)" stroke-width="1.5"/>${grid}
   <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">Vitesse commerciale</text>
   <text x="34" y="334" font-size="12" font-weight="700" fill="currentColor">Appétence au risque</text><text x="366" y="334" text-anchor="end" font-size="12" font-weight="700" fill="currentColor">Solidité des contrôles</text>${pts}
   <g id="tri-cur"><circle cx="${x}" cy="${y}" r="13" fill="none" stroke="var(--hi)" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="4" fill="var(--hi)"/></g></svg>
   <div id="tri-txt">${triOut()}</div><p class="small muted" style="margin:6px 0 0">Glissez le repère rouge (ou utilisez les flèches). A, B, C : les trois scénarios notés par le groupe ${hyp('H12')}.</p>`;
}
function triSet(px, py) {
  const [ax, ay] = TV.a, [bx, by] = TV.b, [cx, cy] = TV.c, d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  let a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d, b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d, c = 1 - a - b;
  a = Math.max(a, 0); b = Math.max(b, 0); c = Math.max(c, 0); const t = a + b + c; TRI.a = a / t; TRI.b = b / t; TRI.c = c / t;
  const [x, y] = triPt(TRI), cur = $('#tri-cur'); if (cur) cur.innerHTML = `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="var(--hi)" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="4" fill="var(--hi)"/>`; const o = $('#tri-txt'); if (o) o.innerHTML = triOut();
}
let _triDrag = false;
document.addEventListener('pointerdown', e => { const s = e.target.closest && e.target.closest('#tri'); if (!s) return; _triDrag = true; s.setPointerCapture && s.setPointerCapture(e.pointerId); triMove(e); });
document.addEventListener('pointermove', e => { if (_triDrag) triMove(e); });
document.addEventListener('pointerup', () => { _triDrag = false; });
function triMove(e) { const s = $('#tri'); if (!s) return; const r = s.getBoundingClientRect(); triSet((e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 350); }
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'tri' && e.key.startsWith('Arrow')) { e.preventDefault(); const [x, y] = triPt(TRI), k = 8; triSet(x + (e.key === 'ArrowRight' ? k : e.key === 'ArrowLeft' ? -k : 0), y + (e.key === 'ArrowDown' ? k : e.key === 'ArrowUp' ? -k : 0)); } });

/* ---------- Enseignements automatiques (calculés sur les données) ---------- */
function insights() {
  const rk = ranked(), hi = rk.filter(r => zone(sc(r).s) === 'hi'), byC = {};
  hi.forEach(r => (byC[r.coso] = byC[r.coso] || []).push(r.id));
  const lev = recoLeverage().sort((a, b) => b.d - a.d), after = planAll(), still = after.filter(x => x.s >= 15);
  const inf = D.risks.filter(r => r.basis !== 'Fait du cas').length;
  const li = [];
  li.push(`<b>${hi.length} risques élevés sur ${rk.length}</b>, issus de ${Object.keys(byC).length} lacunes COSO : ${Object.entries(byC).map(([k, ids]) => `${CK[k]} (${ids.join(', ')})`).join(' ; ')}.`);
  li.push(`<b>Action à plus fort levier : ${lev[0].rc.id}</b> (${esc(lev[0].rc.titre.toLowerCase())}), avec ${lev[0].d} points de score cumulés ; puis ${lev[1].rc.id} (${lev[1].d}) et ${lev[2].rc.id} (${lev[2].d}).`);
  li.push(still.length ? `<b>Après le plan complet, ${still.length} risque${still.length > 1 ? 's' : ''} reste${still.length > 1 ? 'nt' : ''} élevé${still.length > 1 ? 's' : ''} :</b> ${still.map(x => `${x.r.id} (${x.s})`).join(', ')}. C'est la limite du plan.` : '<b>Après le plan complet, plus aucun risque élevé.</b>');
  li.push(`<b>${inf} risques sont des inférences</b> (aucun indice direct) : leur probabilité est cotée prudemment et signalée.`);
  return li;
}
function heroBlock() {
  const lev = recoLeverage().sort((a, b) => b.d - a.d), mx = lev[0].d || 1;
  return `<div class="hero card"><div class="hero-l"><div class="kick">La question</div><h2 class="hero-q">${esc(D.meta.problematique)}</h2>
   <div class="sec" style="margin-top:14px">Ce qu'il faut retenir</div><ul class="ins">${insights().map(x => `<li>${x}</li>`).join('')}</ul>
   <div class="sec">Où agir en premier <span class="muted" style="text-transform:none;letter-spacing:0">(levier, ${hyp('H12')})</span></div>
   <div class="bars">${lev.map(x => `<a class="bar lev" href="#/recos" title="${esc(x.rc.titre)}"><span class="t"><b>${x.rc.id}</b> ${esc(x.rc.titre)}</span><span class="tr"><span class="fl" style="width:${x.d / mx * 100}%;background:var(--brand)"></span></span><span class="score">${x.d}</span></a>`).join('')}</div></div>
   <div class="hero-r"><div class="sec" style="margin-top:0">Le compromis à arbitrer</div>${triangle()}</div></div>`;
}

/* ---------- Surbrillance croisée, animations, aide clavier ---------- */
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[data-risk]'); if (!el || el.closest('.drawer')) return;
  const id = el.dataset.risk; document.body.classList.add('hlon'); $$('[data-risk="' + id + '"]').forEach(x => x.classList.add('hl'));
});
document.addEventListener('mouseout', e => { const el = e.target.closest && e.target.closest('[data-risk]'); if (!el) return; document.body.classList.remove('hlon'); $$('.hl').forEach(x => x.classList.remove('hl')); });
function postRender(first) {
  if (!first || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('#view .hm .cell').forEach((c, i) => c.style.setProperty('--i', i));
  $$('#view .kpi .v').forEach(el => { const m = el.textContent.trim().match(/^(\d+(?:\.\d+)?)(.*)$/); if (!m) return; const to = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, tail = m[2], t0 = performance.now();
    const step = t => { const k = Math.min((t - t0) / 650, 1), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = v.toFixed(dec) + tail; if (k < 1) requestAnimationFrame(step); }; el.textContent = (0).toFixed(dec) + tail; requestAnimationFrame(step); });
}
const HELP = [['Ctrl K  ou  /', 'Rechercher dans tout le site'], ['?', 'Afficher cette aide'], ['Échap', 'Fermer un panneau, la recherche ou la présentation'], ['← →  (présentation)', 'Changer de diapositive'], ['Espace · 1 · 2 · 3  (entraînement)', 'Révéler la réponse · À revoir · Hésitant · Je savais'], ['Flèches  (compromis)', 'Déplacer le repère du compromis']];
document.addEventListener('keydown', e => {
  if (e.key === '?' && !/INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName)) { e.preventDefault(); let h = $('#help'); if (!h) { document.body.insertAdjacentHTML('beforeend', `<div class="pal-bg" id="help" role="dialog" aria-label="Aide clavier"><div class="pal" style="padding:18px 20px"><h3>Raccourcis clavier</h3><table>${HELP.map(([k, v]) => `<tr><td style="white-space:nowrap"><kbd>${k}</kbd></td><td>${v}</td></tr>`).join('')}</table><p class="small muted" style="margin:10px 0 0">Échap pour fermer.</p></div></div>`); h = $('#help'); h.addEventListener('click', ev => { if (ev.target === h) h.classList.remove('on'); }); }
    h.classList.toggle('on'); }
  else if (e.key === 'Escape' && $('#help') && $('#help').classList.contains('on')) $('#help').classList.remove('on');
}, true);
