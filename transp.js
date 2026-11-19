/* Transparence, simulateur de plan d'action, traçabilité interactive, recherche */
const TR = { sel: null };
const nrm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- Simulateur de plan d'action (page Recommandations) ---------- */
function planCard() {
  const recs = [...D.recos].sort((a, b) => a.prio - b.prio);
  const rk = rankedBy(r => { const b = S.ov[r.id] || { p: r.p, g: r.g }; return { p: b.p, g: b.g, s: b.p * b.g }; });
  const rows = rk.map(r => { const b = S.ov[r.id] || { p: r.p, g: r.g }, a = planPG(r), s0 = b.p * b.g, s1 = a.p * a.g; return { r, s0, s1, a }; });
  const hi = f => rows.filter(x => zone(f(x)) === 'hi').length, avg = f => (rows.reduce((t, x) => t + f(x), 0) / rows.length).toFixed(1);
  const act = S.plan.size;
  return `<div class="card" style="margin-bottom:14px" id="plan"><div class="row" style="margin-bottom:6px"><h3 style="margin:0">Simulateur de plan d'action</h3>${hyp('H12')}<span class="sp"></span>
  <button class="btn" data-preset="none">Aucune</button><button class="btn" data-preset="v1">Vague 1</button><button class="btn" data-preset="all">Toutes</button>
  <button class="btn pri" data-applyplan>Afficher ce plan sur tout le site</button></div>
  <p class="small muted" style="margin:0 0 10px">Cochez les recommandations lancées. Pour chaque risque, la cotation avance de sa valeur actuelle vers sa cible (hypothèse H12) en proportion des recommandations qui le couvrent. C'est une illustration qualitative, pas une prévision.</p>
  <div class="grid g2" style="margin-bottom:12px">${recs.map(rc => `<label class="plan-row"><input type="checkbox" data-plan="${rc.id}" id="pl-${rc.id}" ${S.plan.has(rc.id) ? 'checked' : ''}><span><b>${rc.id}</b> · priorité ${rc.prio} · ${esc(rc.titre)}<br><span class="small muted">${esc(A(rc.resp).nom)} · ${rc.vague} · couvre ${rc.risques.join(', ')}</span></span></label>`).join('')}</div>
  <div class="grid g3" style="margin-bottom:12px"><div class="card kpi"><div class="v">${act}/${recs.length}</div><div class="l">recommandations actives</div></div>
  <div class="card kpi"><div class="v">${hi(x => x.s0)} → <span style="color:var(--${hi(x => x.s1) < hi(x => x.s0) ? 'lo' : 'hi'})">${hi(x => x.s1)}</span></div><div class="l">risques élevés (avant → après)</div></div>
  <div class="card kpi"><div class="v">${avg(x => x.s0)} → ${avg(x => x.s1)}</div><div class="l">score P × G moyen (avant → après)</div></div></div>
  <div class="bars">${rows.map(x => `<div class="bar plan" data-risk="${x.r.id}" title="${esc(x.r.titre)}"><span class="t"><b>${x.r.id}</b> ${esc(x.r.titre)}</span><span class="tr"><span class="fl ghost" style="width:${x.s0 * 4}%"></span><span class="fl" style="width:${x.s1 * 4}%;background:var(--${zone(x.s1)})"></span></span><span class="score" style="color:var(--${zone(x.s1)})">${x.s0}→${x.s1}</span></div>`).join('')}</div>
  <p class="small muted" style="margin:8px 0 0">Barre claire : cotation actuelle. Barre colorée : cotation avec le plan choisi. ${rows.some(x => x.s1 >= 15) ? 'Un risque reste élevé : voir les limites de la recommandation concernée.' : ''}</p></div>`;
}

/* ---------- Page Transparence ---------- */
function traceSets(sel) {
  if (!sel) return null;
  const rs = new Set();
  if (sel[0] === 'i') D.risks.filter(r => r.indices.includes(+sel.slice(1))).forEach(r => rs.add(r.id));
  else if (sel[0] === 'R') rs.add(sel);
  else if (sel.startsWith('REC')) D.recos.find(x => x.id === sel).risques.forEach(x => rs.add(x));
  else if (sel.startsWith('c:')) D.risks.filter(r => r.coso === sel.slice(2)).forEach(r => rs.add(r.id));
  const is = new Set(), recs = new Set();
  rs.forEach(id => { R(id).indices.forEach(i => is.add('i' + i)); recosOf(id).forEach(x => recs.add(x.id)); });
  if (sel[0] === 'i') { is.clear(); is.add(sel); }
  if (sel.startsWith('REC')) { recs.clear(); recs.add(sel); }
  return { rs, is, recs };
}
function traceSvg() {
  const rk = ranked(), recs = [...D.recos].sort((a, b) => a.prio - b.prio), L = traceSets(TR.sel);
  const H = rk.length * 40 + 20, X = [14, 352, 690], W = [290, 300, 256];
  const yi = i => 40 + i * ((H - 80) / (D.indices.length - 1)), yr = j => 30 + j * 40, yc = m => 50 + m * ((H - 100) / (recs.length - 1));
  const lit = (kind, id) => !L || (kind === 'i' ? L.is.has(id) : kind === 'r' ? L.rs.has(id) : L.recs.has(id));
  let e = '';
  rk.forEach((r, j) => { r.indices.forEach(i => { const on = lit('i', 'i' + i) && lit('r', r.id); e += `<path d="M${X[0] + W[0]} ${yi(i - 1)} C ${X[0] + W[0] + 30} ${yi(i - 1)}, ${X[1] - 30} ${yr(j)}, ${X[1]} ${yr(j)}" fill="none" stroke="${on && L ? 'var(--brand)' : 'var(--ink2)'}" stroke-width="${on && L ? 2.4 : 1.2}" opacity="${L ? (on ? 1 : .07) : .3}"/>`; }); });
  recs.forEach((rc, m) => rc.risques.forEach(id => { const j = rk.findIndex(x => x.id === id), on = lit('r', id) && lit('c', rc.id); e += `<path d="M${X[1] + W[1]} ${yr(j)} C ${X[1] + W[1] + 30} ${yr(j)}, ${X[2] - 30} ${yc(m)}, ${X[2]} ${yc(m)}" fill="none" stroke="${on && L ? 'var(--brand)' : 'var(--ink2)'}" stroke-width="${on && L ? 2.4 : 1.2}" opacity="${L ? (on ? 1 : .07) : .3}"/>`; }));
  const node = (id, kind, x, y, w, h, lines, cls, sub) => `<g class="tn ${TR.sel === id ? 'sel' : ''}" data-tn="${id}" style="cursor:pointer;opacity:${lit(kind, id) ? 1 : .22}" tabindex="0" role="button" aria-label="${esc(lines.join(' '))}"><rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="8" class="${cls}"/>${lines.map((t, k) => `<text x="${x + 10}" y="${y + (k - (lines.length - 1) / 2) * 13 + 4}" font-size="11" ${k === 0 && sub ? 'font-weight="700"' : ''} fill="currentColor">${esc(t)}</text>`).join('')}</g>`;
  const wrap = (t, n) => { const w = t.split(' '), out = ['']; w.forEach(x => { if ((out[out.length - 1] + ' ' + x).length > n) out.push(x); else out[out.length - 1] += ' ' + x; }); return out.map(s => s.trim()).slice(0, 2); };
  const ns = D.indices.map((it, i) => node('i' + it.id, 'i', X[0], yi(i), W[0], 44, wrap(`${it.id}. ${it.txt}`, 44), 'n-i')).join('') +
    rk.map((r, j) => { const c = sc(r); return node(r.id, 'r', X[1], yr(j), W[1], 32, [`${r.id}  ${r.titre.length > 38 ? r.titre.slice(0, 37) + '…' : r.titre}  · ${c.s}`], 'n-r z-' + zone(c.s), true); }).join('') +
    recs.map((rc, m) => node(rc.id, 'c', X[2], yc(m), W[2], 44, [`${rc.id} · priorité ${rc.prio}`, rc.titre.length > 38 ? rc.titre.slice(0, 37) + '…' : rc.titre], 'n-c', true)).join('');
  const hd = (t, x) => `<text x="${x}" y="12" font-size="10.5" font-weight="700" fill="var(--muted)" letter-spacing=".08em">${t}</text>`;
  return `<svg class="dia" viewBox="0 0 960 ${H + 10}" role="group" aria-label="Chaîne de traçabilité interactive">${hd('INDICES DU CAS', X[0])}${hd('RISQUES (score)', X[1])}${hd('RECOMMANDATIONS', X[2])}<g transform="translate(0,6)">${e}${ns}</g></svg>`;
}
function traceDetail() {
  const s = TR.sel; if (!s) return '<p class="muted small">Cliquez un indice, un risque, une recommandation ou une lacune COSO pour voir toute la chaîne qui y mène.</p>';
  if (s[0] === 'i') { const i = D.indices[+s.slice(1) - 1]; return `<b>Indice ${i.id}.</b> ${esc(i.txt)}<br><span class="small muted">Fait fourni par le livret ; il alimente ${D.risks.filter(r => r.indices.includes(i.id)).length} risques.</span>`; }
  if (s[0] === 'R') { const r = R(s); return `<div class="row"><b>${chip(r)} ${esc(r.titre)}</b>${basisTag(r)}${tagZ(sc(r).s)}</div><p class="small" style="margin:6px 0 0"><b>Lacune COSO (${CK[r.coso]}) :</b> ${esc(r.lacune)}<br><b>Contrôle :</b> ${esc(r.controle)}</p>`; }
  if (s.startsWith('REC')) { const rc = D.recos.find(x => x.id === s); return `<b>${rc.id} — ${esc(rc.titre)}</b>${chainFor(rc)}`; }
  const c = D.coso.find(x => x.k === s.slice(2)); return `<b>${CK[c.k]}</b> (maturité ${c.mat}/4) — ${esc(c.lacune)}<ul class="small" style="margin:6px 0 0">${c.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul>`;
}
V.transparence = () => {
  const U = hypUsage(), hist = Object.keys(S.ov);
  const bRank = rankedBy(r => ({ p: r.p, g: r.g, s: r.p * r.g })).map(r => r.id), cRank = ranked().map(r => r.id);
  return hd('Transparence', 'D\'où vient chaque chiffre : faits, inférences, hypothèses, calcul et données brutes', `<button class="btn" id="tr-toggle2" aria-pressed="${S.tr}">${S.tr ? 'Mode transparence activé' : 'Activer le mode transparence'}</button>`) + `
  <div class="grid g3" style="margin-bottom:14px">
   <div class="card"><h3><span class="tag fact">Fait du cas</span></h3><p class="small">Information fournie par le livret. ${D.risks.filter(r => r.basis === 'Fait du cas').length} risques s'appuient sur un indice direct. La cotation de P cite l'indice.</p></div>
   <div class="card"><h3><span class="tag infer">Inférence</span></h3><p class="small">Aucun indice direct : le risque est déduit des lacunes observées. ${D.risks.filter(r => r.basis !== 'Fait du cas').length} risques, avec une probabilité cotée prudemment.</p></div>
   <div class="card"><h3>${hyp()}</h3><p class="small">Information ajoutée par le groupe (volumes, délais, effectifs). ${D.hypotheses.length} hypothèses, toutes listées ci-dessous avec leur usage.</p></div></div>
  <div class="card" style="margin-bottom:14px"><h3>Traçabilité interactive : de l'indice à la recommandation</h3>
   <div class="row" style="margin-bottom:8px"><b class="small">Lacune COSO</b>${Object.keys(CK).map(k => `<button class="btn" data-cs="c:${k}" aria-pressed="${TR.sel === 'c:' + k}">${CK[k]}</button>`).join('')}${TR.sel ? '<button class="btn" data-cs="">Effacer</button>' : ''}</div>
   <div class="tw" style="padding:6px">${traceSvg()}</div><div class="note" style="margin-top:10px" id="trace-detail">${traceDetail()}</div></div>
  <div class="card" style="margin-bottom:14px"><h3>Hypothèses et où elles servent</h3><div class="tw"><table><thead><tr><th>N°</th><th>Hypothèse</th><th>Utilisée dans</th></tr></thead><tbody>${D.hypotheses.map(h => { const u = U[h.id], n = u.risks.length + u.recos.length + u.coso.length + u.actors.length; return `<tr id="h-${h.id}"><td>${hyp(h.id)}</td><td>${esc(h.txt)}</td><td>${n ? [...u.risks.map(id => chip(R(id))), ...u.recos.map(x => `<a href="#recos" class="tag">${x}</a>`), ...u.coso.map(k => `<a href="#coso" class="tag">${CK[k]}</a>`), ...u.actors.map(a => `<a href="#acteurs" class="tag">${esc(A(a).nom)}</a>`)].join(' ') : '<span class="muted small">Contexte du cadrage uniquement : aucune cotation n\'en dépend.</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>
  <div class="grid g2" style="margin-bottom:14px">
   <div class="card"><h3>Journal des modifications</h3>${hist.length ? `<div class="tw"><table><thead><tr><th>Risque</th><th>P</th><th>G</th><th>Score</th><th>Rang</th></tr></thead><tbody>${hist.map(id => { const r = R(id), o = S.ov[id]; return `<tr><td>${chip(r)}</td><td>${r.p} → <b>${o.p}</b></td><td>${r.g} → <b>${o.g}</b></td><td>${r.p * r.g} → <b>${o.p * o.g}</b></td><td>${bRank.indexOf(id) + 1} → <b>${cRank.indexOf(id) + 1}</b></td></tr>`; }).join('')}</tbody></table></div><button class="btn" id="reset-ov" style="margin-top:8px">↺ Annuler toutes les modifications</button>` : '<p class="small muted">Aucune note modifiée : tous les chiffres affichés sont ceux du registre. Modifiez P ou G dans « Cartographie » : chaque changement apparaît ici.</p>'}</div>
   <div class="card"><h3>Ce que le site ne fait pas</h3><ul class="small"><li>P × G classe : ce n'est ni une probabilité statistique ni une perte attendue.</li><li>Aucune méthode quantitative hors des séances 1–7 et 1–4 (voir « Contrôle qualité »).</li><li>Les cotations cibles, la maturité COSO et les délais sont des hypothèses du groupe (H11, H12).</li><li>Les incidents du tableau de suivi sont des exemples fictifs (H13).</li><li>Le simulateur de plan illustre un ordre de grandeur qualitatif, il ne prédit rien.</li></ul></div></div>
  <div class="card"><h3>Données brutes</h3><p class="small muted">Chaque chiffre du site est lu dans <code>data/paymaroc.json</code>. Choisissez un risque pour voir son enregistrement exact.</p><label class="f">Risque<select id="raw-sel">${D.risks.map(r => `<option value="${r.id}">${r.id} — ${esc(r.titre)}</option>`).join('')}</select></label><pre id="raw-out" class="raw">${esc(JSON.stringify(D.risks[0], null, 1))}</pre></div>`;
};

/* ---------- Recherche (Ctrl+K ou /) ---------- */
function searchIndex() {
  const out = [];
  NAV.filter(n => n[0] !== 'grp').forEach(n => out.push({ t: 'Page', l: n[2], s: '', go: () => { location.hash = '#' + n[0]; } }));
  D.risks.forEach(r => out.push({ t: 'Risque', l: `${r.id} ${r.titre}`, s: r.cause + ' ' + r.evenement, go: () => drawer(r.id) }));
  D.recos.forEach(r => out.push({ t: 'Reco', l: `${r.id} ${r.titre}`, s: r.action + ' ' + r.kpi, go: () => { location.hash = '#recos'; } }));
  D.actors.forEach(a => out.push({ t: 'Acteur', l: a.nom, s: a.role + ' ' + a.objectif, go: () => { location.hash = '#acteurs'; } }));
  D.coso.forEach(c => out.push({ t: 'COSO', l: CK[c.k], s: c.lacune + ' ' + c.obs.join(' '), go: () => { location.hash = '#coso'; } }));
  D.hypotheses.forEach(h => out.push({ t: 'Hypothèse', l: h.id, s: h.txt, go: () => { location.hash = '#transparence'; } }));
  D.indices.forEach(i => out.push({ t: 'Indice', l: `Indice ${i.id}`, s: i.txt, go: () => { TR.sel = 'i' + i.id; location.hash = '#transparence'; if (cur === 'transparence') render(); } }));
  D.jury.forEach(j => out.push({ t: 'Jury', l: j.q, s: j.r, go: () => { location.hash = '#soutenance'; } }));
  return out;
}
let PAL = { idx: null, res: [], sel: 0 };
function palRender() {
  const q = nrm($('#pal-q').value).split(/\s+/).filter(Boolean);
  PAL.res = PAL.idx.filter(e => { const h = nrm(e.l + ' ' + e.s); return q.every(t => h.includes(t)); }).slice(0, 12); PAL.sel = Math.min(PAL.sel, Math.max(PAL.res.length - 1, 0));
  $('#pal-list').innerHTML = PAL.res.length ? PAL.res.map((e, i) => `<li role="option" aria-selected="${i === PAL.sel}" class="${i === PAL.sel ? 'on' : ''}" data-pi="${i}"><span class="tag" style="background:var(--surface2);color:var(--ink2);border-color:var(--line)">${e.t}</span> <b>${esc(e.l.length > 70 ? e.l.slice(0, 69) + '…' : e.l)}</b>${e.s && q.length ? `<div class="small muted">${esc(e.s.slice(0, 110))}…</div>` : ''}</li>`).join('') : '<li class="muted small">Aucun résultat.</li>';
}
function palOpen() { PAL.idx = PAL.idx || searchIndex(); $('#pal').classList.add('on'); $('#pal-q').value = ''; PAL.sel = 0; palRender(); $('#pal-q').focus(); }
function palClose() { $('#pal').classList.remove('on'); }
function palGo(i) { const e = PAL.res[i]; if (!e) return; palClose(); e.go(); }
function initTransp() {
  document.body.insertAdjacentHTML('beforeend', `<div class="pal-bg" id="pal" role="dialog" aria-label="Recherche"><div class="pal"><input type="text" id="pal-q" placeholder="Rechercher un risque, une recommandation, une hypothèse, un acteur…" autocomplete="off" aria-label="Recherche"><ul id="pal-list" role="listbox"></ul><div class="small muted" style="padding:6px 12px">↑ ↓ pour choisir · Entrée pour ouvrir · Échap pour fermer</div></div></div>`);
}
document.addEventListener('click', e => {
  const t = e.target;
  const tn = t.closest('[data-tn]'); if (tn) { TR.sel = TR.sel === tn.dataset.tn ? null : tn.dataset.tn; KEEP = true; return render(); }
  const cs = t.closest('[data-cs]'); if (cs) { TR.sel = cs.dataset.cs && TR.sel !== cs.dataset.cs ? cs.dataset.cs : null; KEEP = true; return render(); }
  const ct = t.closest('[data-cat]'); if (ct) { S.cat = ct.dataset.cat; KEEP = true; return render(); }
  const pr = t.closest('[data-preset]'); if (pr) { const k = pr.dataset.preset; S.plan = new Set(k === 'all' ? D.recos.map(r => r.id) : k === 'v1' ? D.recos.filter(r => r.vague.startsWith('Vague 1')).map(r => r.id) : []); KEEP = true; return render(); }
  if (t.closest('[data-applyplan]')) { S.mode = 'plan'; return render(); }
  if (t.id === 'm-plan') { if (!S.plan.size) S.plan = new Set(D.recos.map(r => r.id)); S.mode = 'plan'; return render(); }
  if (t.id === 'tr-toggle' || t.id === 'tr-toggle2') { S.tr = !S.tr; KEEP = true; return render(); }
  if (t.closest('#srch')) return palOpen();
  if (t.id === 'pal') return palClose();
  const pi = t.closest('[data-pi]'); if (pi) return palGo(+pi.dataset.pi);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.plan) { t.checked ? S.plan.add(t.dataset.plan) : S.plan.delete(t.dataset.plan); KEEP = true; render(); }
  if (t.id === 'raw-sel') $('#raw-out').textContent = JSON.stringify(R(t.value), null, 1);
});
document.addEventListener('input', e => { if (e.target.id === 'pal-q') { PAL.sel = 0; palRender(); } });
document.addEventListener('keydown', e => {
  const open = $('#pal') && $('#pal').classList.contains('on');
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !open && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { e.preventDefault(); return palOpen(); }
  if (open) {
    if (e.key === 'Escape') { palClose(); e.stopPropagation(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); PAL.sel = Math.min(PAL.sel + 1, PAL.res.length - 1); palRender(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); PAL.sel = Math.max(PAL.sel - 1, 0); palRender(); }
    else if (e.key === 'Enter') { e.preventDefault(); palGo(PAL.sel); }
  } else if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-tn]')) { e.preventDefault(); e.target.closest('[data-tn]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }
}, true);
