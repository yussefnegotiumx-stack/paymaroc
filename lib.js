/* Bibliothèque : état, calculs, composants graphiques (SVG/HTML sans dépendance) */
const D = window.PM;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const S = { mode: 'now', ov: {}, tr: false, plan: new Set(), cat: '' };
const A = id => D.actors.find(a => a.id === id);
const R = id => D.risks.find(r => r.id === id);
const ZL = { hi: 'Élevé', mid: 'Modéré', lo: 'Faible' };
const ZI = { hi: '▲', mid: '◆', lo: '●' };
const CK = D.cosoKeys;
function planPG(r) { const b0 = S.ov[r.id] || { p: r.p, g: r.g }, cv = recosOf(r.id); if (!cv.length) return b0; const k = cv.filter(x => S.plan.has(x.id)).length / cv.length; return { p: Math.round(b0.p + (r.target.p - b0.p) * k), g: Math.round(b0.g + (r.target.g - b0.g) * k) }; }
function sc(r) { const b = S.mode === 'target' ? r.target : S.mode === 'plan' ? planPG(r) : (S.ov[r.id] || { p: r.p, g: r.g }); return { p: b.p, g: b.g, s: b.p * b.g }; }
function base(r) { return { p: r.p, g: r.g, s: r.p * r.g }; }
const zone = s => s >= 15 ? 'hi' : s >= 6 ? 'mid' : 'lo';
function ranked() { return [...D.risks].sort((a, b) => { const x = sc(a), y = sc(b); return y.s - x.s || y.g - x.g || y.p - x.p || a.id.localeCompare(b.id); }); }
const rankOf = id => ranked().findIndex(r => r.id === id) + 1;
const recosOf = rid => D.recos.filter(x => x.risques.includes(rid));
const topN = n => ranked().slice(0, n);
const hasOv = () => Object.keys(S.ov).length > 0;
const tagZ = s => `<span class="tag z-${zone(s)}">${ZI[zone(s)]} ${ZL[zone(s)]}</span>`;
const chip = r => { const s = sc(r).s; return `<button class="chip z-${zone(s)}" data-risk="${r.id}" title="${esc(r.titre)} — P×G = ${s} — ${r.basis}">${r.id}${S.tr ? `<sup class="prov">${r.basis === 'Fait du cas' ? 'F' : 'I'}</sup>` : ''}</button>`; };
const hyp = t => `<span class="hyp" title="Information fictive ajoutée par le groupe">Hypothèse${t ? ' ' + t : ''}</span>`;
const basisTag = r => `<span class="tag ${r.basis === 'Fait du cas' ? 'fact' : 'infer'}">${r.basis}</span>`;
const actorChip = id => `<span class="tag" style="background:var(--surface2);color:var(--ink);border-color:var(--line)">${esc(A(id).nom)}</span>`;
const cosoName = k => CK[k];

/* Heatmap 5x5 */
function heatmap(filter) {
  let h = '<div class="hm"><div></div>';
  for (let p = 1; p <= 5; p++) h += `<div class="ax">P ${p}</div>`;
  for (let g = 5; g >= 1; g--) {
    h += `<div class="ax">G ${g}</div>`;
    for (let p = 1; p <= 5; p++) {
      const s = p * g, z = zone(s);
      const rs = D.risks.filter(r => { const c = sc(r); return c.p === p && c.g === g && (!filter || filter(r)); });
      h += `<div class="cell z-${z}" role="group" aria-label="Probabilité ${p}, gravité ${g}, score ${s}, ${ZL[z]}">${rs.map(chip).join('')}<span class="s">${s}</span></div>`;
    }
  }
  return h + `</div><div class="hm-title"><span>← Probabilité (P) →</span><span>Gravité (G) en lignes ↑</span></div>`;
}
/* Barres de classement */
function bars(list) {
  return `<div class="bars">` + list.map(r => { const c = sc(r), z = zone(c.s); return `<div class="bar" data-risk="${r.id}" title="${esc(r.titre)}"><span class="t"><b>${r.id}</b> ${esc(r.titre)}</span><span class="tr"><span class="fl" style="width:${c.s * 4}%;background:var(--${z})"></span></span><span class="score" style="color:var(--${z})">${c.s}</span></div>`; }).join('') + '</div>';
}
/* Donut par catégorie */
function donut() {
  const keys = Object.keys(D.cats), cols = { O: 'var(--accent)', F: 'var(--brand)', C: 'var(--mid)' };
  const cnt = keys.map(k => D.risks.filter(r => r.cat === k).length), tot = cnt.reduce((a, b) => a + b, 0);
  let off = 0; const R0 = 52, C = 2 * Math.PI * R0; let segs = '';
  keys.forEach((k, i) => { const len = cnt[i] / tot * C; segs += `<circle r="${R0}" cx="70" cy="70" fill="none" stroke="${cols[k]}" stroke-width="22" stroke-dasharray="${Math.max(len - 2, 0)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${D.cats[k]} : ${cnt[i]}</title></circle>`; off += len; });
  return `<div class="row" style="gap:18px"><svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Répartition des risques par catégorie">${segs}<text x="70" y="68" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">${tot}</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="var(--ink2)">risques</text></svg><div>${keys.map((k, i) => `<div class="row" style="gap:8px;margin:4px 0"><span style="width:12px;height:12px;border-radius:3px;background:${cols[k]};display:inline-block"></span><b>${cnt[i]}</b> ${D.cats[k]}</div>`).join('')}</div></div>`;
}
/* Radar COSO */
function radar(size = 300, showTarget = true) {
  const cx = size / 2, cy = size / 2 + 6, rad = size * .34, n = 5, keys = D.coso;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * rad * v / 4, cy + Math.sin(a) * rad * v / 4]; };
  let g = '';
  for (let l = 1; l <= 4; l++) g += `<polygon points="${keys.map((_, i) => pt(i, l).join(',')).join(' ')}" fill="none" stroke="var(--line)"/><text x="${cx + 3}" y="${cy - rad * l / 4 + 3}" font-size="8" fill="var(--muted)">${l}</text>`;
  keys.forEach((_, i) => { const [x, y] = pt(i, 4); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; });
  const poly = (f, col, dash) => `<polygon points="${keys.map((c, i) => pt(i, f(c)).join(',')).join(' ')}" fill="${col}" fill-opacity=".16" stroke="${col}" stroke-width="2.2" ${dash ? 'stroke-dasharray="6 4"' : ''}/>`;
  if (showTarget) g += poly(c => c.cible, 'var(--tgt)', true);
  g += poly(c => c.mat, 'var(--cur)');
  keys.forEach((c, i) => { const [x, y] = pt(i, c.mat); g += `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--cur)" stroke="var(--surface)" stroke-width="2"><title>${CK[c.k]} : maturité ${c.mat}/4 (cible ${c.cible})</title></circle>`; });
  const lab = ['Environnement\nde contrôle', 'Évaluation\ndes risques', 'Activités\nde contrôle', 'Information et\ncommunication', 'Pilotage et\nsurveillance'];
  keys.forEach((c, i) => { const [x, y] = pt(i, 5.15); const ls = lab[i].split('\n'); g += `<text text-anchor="middle" font-size="10.5" font-weight="600" fill="currentColor" x="${x}" y="${y - 2}">${ls.map((t, j) => `<tspan x="${x}" dy="${j ? 12 : 0}">${t}</tspan>`).join('')}</text>`; });
  return `<svg viewBox="-70 0 ${size + 140} ${size + 14}" role="img" aria-label="Radar de maturité des cinq composantes COSO" style="width:100%;max-width:${size + 140}px">${g}</svg>
  <div class="legend"><span><i style="border-color:var(--cur)"></i>Maturité actuelle</span>${showTarget ? '<span><i style="border-color:var(--tgt);border-top-style:dashed"></i>Cible (hypothèse)</span>' : ''}<span class="muted">1 informel · 2 partiel · 3 défini et appliqué · 4 piloté</span></div>`;
}
/* Schéma de gouvernance */
const GN = {
  DIR: [480, 48, 'Direction', 'arbitre croissance / risque'], COM: [480, 128, 'Comité Risques & Incidents', 'mensuel', 'new', 170],
  PRO: [118, 230, 'Produit / Commerce', ''], GATE: [265, 230, 'Gate go/no-go', '', 'new', 90], TEC: [420, 230, 'Tech / IT', ''], OPS: [610, 230, 'Opérations', ''],
  REGI: [745, 230, 'Registre unique', '', 'new', 96], SUP: [880, 230, 'Support', ''], CIN: [110, 400, 'Contrôle interne', ''],
  PRE: [420, 400, 'Prestataire tech', 'externe', 'ext'], BAN: [610, 400, 'Partenaire bancaire', 'externe', 'ext'], REG: [745, 400, 'Régulateur', 'externe', 'ext'], CLI: [880, 400, 'Clients', 'externe', 'ext']
};
const GE = {
  now: [['DIR', 'PRO', 'objectifs de croissance', '', null, [-70, 6]], ['PRO', 'TEC', 'pression de livraison', 'bad', null, [0, -4]], ['TEC', 'PRE', 'dépendance critique', 'bad'], ['CLI', 'SUP', 'signalements', ''],
  ['SUP', 'OPS', 'transmis sans criticité', 'bad dash', null, [0, -26]], ['TEC', 'OPS', 'rôles flous', 'bad dash', null, [0, 20]], ['CIN', 'DIR', 'remontée irrégulière', 'dash', [30, 190], [-8, 70]], ['OPS', 'BAN', 'rapprochement non formalisé', 'bad dash']],
  target: [['DIR', 'COM', 'appétence, arbitrage', 'good'], ['COM', 'PRO', '', 'good dash'], ['COM', 'TEC', '', 'good dash'], ['COM', 'OPS', '', 'good dash'], ['COM', 'SUP', '', 'good dash'], ['CIN', 'COM', 'suivi, secrétariat', 'good', [30, 200]],
  ['PRO', 'GATE', 'demande', 'good', null, [0, -34]], ['GATE', 'TEC', 'autorise', 'good'], ['CIN', 'GATE', 'avis risque', 'good dash'], ['CLI', 'SUP', 'signalements', ''], ['SUP', 'REGI', 'déclare', 'good', null, [4, -34]], ['REGI', 'OPS', 'classe C1–C4', 'good', null, [-6, -34]],
  ['CIN', 'REGI', 'propriétaire', 'good dash', [430, 345]], ['TEC', 'PRE', 'SLA, revue trimestrielle', 'good'], ['OPS', 'BAN', 'rapprochement quotidien', 'good'], ['REGI', 'REG', 'notification C1', 'good dash']]
};
function govSvg(mode) {
  const hw = n => (n[5] || 128) / 2, hh = 24;
  const ids = Object.keys(GN).filter(k => mode === 'target' || GN[k][4] !== 'new');
  const clip = (n, tx, ty) => { const [x, y] = n, w = hw(n), dx = tx - x, dy = ty - y; if (!dx && !dy) return [x, y]; const t = Math.min(dx ? w / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9); return [x + dx * t, y + dy * t]; };
  let e = '';
  GE[mode].forEach(([a, b, lab, cls, c, off]) => {
    const na = GN[a], nb = GN[b]; const ca = c || [nb[0], nb[1]], cb = c || [na[0], na[1]];
    const p0 = clip(na, ca[0], ca[1]), p1 = clip(nb, cb[0], cb[1]);
    const kind = cls.includes('bad') ? 'bad' : cls.includes('good') ? 'good' : 'n';
    const d = c ? `M${p0} Q${c} ${p1}` : `M${p0} L${p1}`;
    const mx = c ? .25 * p0[0] + .5 * c[0] + .25 * p1[0] : (p0[0] + p1[0]) / 2, my = c ? .25 * p0[1] + .5 * c[1] + .25 * p1[1] : (p0[1] + p1[1]) / 2;
    e += `<path class="edge ${cls}" d="${d}" marker-end="url(#ar-${kind})"/>`;
    if (lab) e += `<text class="elab ${kind}" x="${mx + (off ? off[0] : 0)}" y="${my + (off ? off[1] : 0) - 4}">${lab}</text>`;
  });
  const nodes = ids.map(k => { const [x, y, t, s, f, w] = GN[k]; const ww = w || 128; return `<g class="node ${f || ''}"><rect x="${x - ww / 2}" y="${y - hh}" width="${ww}" height="${hh * 2}" rx="9"/><text x="${x}" y="${y + (s ? -2 : 4)}">${t}</text>${s ? `<text class="s" x="${x}" y="${y + 13}">${s}</text>` : ''}</g>`; }).join('');
  const mk = (id, col) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${col}"/></marker>`;
  return `<svg class="dia" viewBox="0 0 960 460" role="img" aria-label="Schéma de gouvernance ${mode === 'now' ? 'actuelle' : 'cible'}"><defs>${mk('n', 'var(--ink2)')}${mk('bad', 'var(--hi)')}${mk('good', 'var(--brand)')}</defs>${e}${nodes}</svg>`;
}
/* Carte acteurs–risques */
function actorMap(hl) {
  const W = 960, rowA = 38, rowR = 34, top0 = 30, H = top0 + Math.max(D.actors.length * rowA, D.risks.length * rowR) + 10;
  const ay = i => top0 + i * rowA + rowA / 2, ry = i => top0 + i * rowR + rowR / 2;
  const rk = ranked();
  let lines = '';
  D.risks.forEach(r => {
    const j = rk.findIndex(x => x.id === r.id);
    const add = (aid, kind) => { const i = D.actors.findIndex(a => a.id === aid); const on = !hl || hl === aid || hl === r.id; const st = { own: 'stroke-width:3;', src: 'stroke-width:1.6;stroke-dasharray:6 4;', imp: 'stroke-width:1.6;stroke-dasharray:1 4;stroke-linecap:round;' }[kind]; const col = kind === 'own' ? 'var(--brand)' : kind === 'src' ? 'var(--hi)' : 'var(--accent)'; lines += `<path d="M300 ${ay(i)} C 480 ${ay(i)}, 480 ${ry(j)}, 660 ${ry(j)}" fill="none" stroke="${col}" style="${st}" opacity="${on ? (hl ? 1 : .55) : .06}"/>`; };
    r.sources.forEach(a => add(a, 'src')); r.impacted.forEach(a => add(a, 'imp')); add(r.owner, 'own');
  });
  const as = D.actors.map((a, i) => `<g class="amap" data-hl="${a.id}" style="cursor:pointer"><rect x="20" y="${ay(i) - 15}" width="280" height="30" rx="8" fill="${a.type === 'int' ? 'var(--surface2)' : 'var(--surface)'}" stroke="var(--line)" ${a.type === 'ext' ? 'stroke-dasharray="4 3"' : ''}/><text x="34" y="${ay(i) + 4}" font-size="12.5" font-weight="600" fill="currentColor">${esc(a.nom)}</text><text x="288" y="${ay(i) + 4}" font-size="10" text-anchor="end" fill="var(--muted)">${a.type === 'int' ? 'interne' : 'externe'}</text></g>`).join('');
  const rs = rk.map((r, j) => { const c = sc(r), z = zone(c.s); return `<g class="amap" data-hl="${r.id}" style="cursor:pointer"><rect x="660" y="${ry(j) - 14}" width="280" height="28" rx="8" fill="var(--${z}-bg)" stroke="var(--${z})" stroke-opacity=".5"/><text x="672" y="${ry(j) + 4}" font-size="12" font-weight="700" fill="var(--${z})">${r.id}</text><text x="702" y="${ry(j) + 4}" font-size="11" fill="currentColor">${esc(r.titre.length > 31 ? r.titre.slice(0, 30) + '…' : r.titre)}</text><text x="930" y="${ry(j) + 4}" font-size="11" font-weight="700" text-anchor="end" fill="var(--${z})">${c.s}</text></g>`; }).join('');
  return `<svg class="dia" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte acteurs–risques"><text x="20" y="18" font-size="11" font-weight="700" fill="var(--muted)">ACTEURS</text><text x="660" y="18" font-size="11" font-weight="700" fill="var(--muted)">RISQUES (classés par score)</text>${lines}${as}${rs}</svg>
  <div class="legend"><span><i style="border-color:var(--brand)"></i>Pilote du risque</span><span><i style="border-color:var(--hi);border-top-style:dashed"></i>Contribue à la cause</span><span><i style="border-color:var(--accent);border-top-style:dotted"></i>Subit l'impact</span><span class="muted">Cliquer un acteur ou un risque pour isoler ses liens.</span></div>`;
}
/* RACI */
function raciTable(withConstat) {
  const rc = v => v ? `<span class="rc rc-${v.replace('/', '')}">${v}</span>` : '<span class="muted">·</span>';
  return `<div class="tw"><table class="raci"><thead><tr><th>Activité / décision</th>${D.raci.cols.map(c => `<th class="c">${esc(A(c).nom.replace('Prestataire technologique', 'Prestataire').replace('Produit / Commerce', 'Produit / Com.'))}</th>`).join('')}${withConstat ? '<th>Constat actuel</th>' : ''}</tr></thead><tbody>${D.raci.rows.map(r => `<tr><td>${esc(r.act)}</td>${r.v.map(v => `<td class="c">${rc(v)}</td>`).join('')}${withConstat ? `<td class="small muted">${esc(r.constat)}</td>` : ''}</tr>`).join('')}</tbody></table></div>
  <p class="small muted" style="margin-top:6px">R réalise · A approuve (un seul par ligne) · C consulté · I informé. Le prestataire n'est que consulté ou exécutant, jamais décideur.</p>`;
}
/* Chaîne Risque → COSO → Action → Responsable → KPI */
function chainFor(rc, rid) {
  const r = rid ? R(rid) : null;
  return `<div class="chain"><div class="st"><b>Risque identifié</b>${r ? `${chip(r)} ${esc(r.titre)}` : rc.risques.map(x => chip(R(x))).join(' ')}</div><div class="st"><b>Lacune COSO</b>${CK[rc.coso]} — ${esc(r ? r.lacune : D.coso.find(c => c.k === rc.coso).lacune)}</div><div class="st"><b>Action proposée</b>${esc(rc.titre)}</div><div class="st"><b>Responsable</b>${esc(A(rc.resp).nom)}<br><span class="small muted">validé par ${esc(A(rc.valide).nom)}</span></div><div class="st"><b>Indicateur (KPI)</b>${esc(rc.kpi)}</div></div>`;
}
const toCSV = rows => rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
function download(name, text, type = 'text/csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' })); a.download = name; a.click(); }

/* ---- Transparence : provenance, calcul, usage des hypothèses ---- */
const hrefs = o => [...new Set(JSON.stringify(o).match(/H\d\d/g) || [])].sort();
function hypUsage() {
  const m = {}; D.hypotheses.forEach(h => m[h.id] = { risks: [], recos: [], coso: [], actors: [] });
  D.risks.forEach(r => hrefs(r).forEach(h => m[h] && m[h].risks.push(r.id)));
  D.recos.forEach(r => hrefs(r).forEach(h => m[h] && m[h].recos.push(r.id)));
  D.coso.forEach(c => hrefs(c).forEach(h => m[h] && m[h].coso.push(c.k)));
  D.actors.forEach(a => hrefs(a).forEach(h => m[h] && m[h].actors.push(a.id)));
  return m;
}
function gauge(s) {
  const p = v => (v - 1) / 24 * 100;
  return `<div class="gauge" role="img" aria-label="Score ${s} sur 25 : ${ZL[zone(s)]}"><span class="gz lo" style="left:0;width:${p(6)}%"></span><span class="gz mid" style="left:${p(6)}%;width:${p(15) - p(6)}%"></span><span class="gz hi" style="left:${p(15)}%;right:0"></span><i style="left:${p(s)}%"></i></div><div class="gl"><span style="left:0">1</span><span style="left:${p(6)}%">6</span><span style="left:${p(15)}%">15</span><span style="right:0">25</span></div>`;
}
function rankedBy(f) { return [...D.risks].sort((a, b) => { const x = f(a), y = f(b); return y.s - x.s || y.g - x.g || y.p - x.p || a.id.localeCompare(b.id); }); }
