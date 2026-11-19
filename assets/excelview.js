/* Page « Classeur Excel » : le classeur remis à la professeure, feuille par feuille, avec formules et calculs en direct */
const EXV = { sel: 'Synthèse', f: false };
const xlFind = (sheet, label, col = 1) => { const s = PM_XL.sheets.find(x => x.name === sheet), r = s.rows.find(r => r[0] && r[0].v === label); return r && r[col] ? r[col].v : undefined; };
function xlColor(sh, ci, e) { // zones P×G et OK/KO, comme les mises en forme conditionnelles du classeur
  const col = String.fromCharCode(65 + ci); if (e && typeof e.v === 'number' && sh.zones.includes(col)) return 'z-' + zone(e.v);
  if (e && sh.okko.includes(col) && (e.v === 'OK' || e.v === 'KO')) return e.v === 'OK' ? 'z-lo' : 'z-hi'; return '';
}
function xlSheetTable(sh) {
  const cover = {}, span = {}; sh.merges.forEach(m => { const [a, b] = m.split(':'), c1 = a.charCodeAt(0) - 65, r1 = +a.slice(1) - 1, c2 = b.charCodeAt(0) - 65, r2 = +b.slice(1) - 1; span[r1 + ',' + c1] = [c2 - c1 + 1, r2 - r1 + 1]; for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) cover[r + ',' + c] = 1; });
  const nc = Math.max(...sh.rows.map(r => r.length)); let h = `<table class="xl"><colgroup>${sh.widths.slice(0, nc).map(w => `<col style="width:${Math.max(54, Math.min(w * 7, 420))}px">`).join('')}</colgroup><tbody>`;
  sh.rows.forEach((row, ri) => { row.forEach((e, ci) => { if (!e || cover[ri + ',' + ci] || span[ri + ',' + ci] || typeof e.v !== 'string' || e.bg === '1F6B45') return; const wch = (sh.widths[ci] || 9) * 1.05; if (e.v.length <= wch) return; let k = 1; while (ci + k < nc && !row[ci + k] && !cover[ri + ',' + (ci + k)]) { cover[ri + ',' + (ci + k)] = 1; k++; } if (k > 1) span[ri + ',' + ci] = [k, 1]; }); });
  sh.rows.forEach((row, ri) => { if (row.every(c => !c)) { h += '<tr class="xl-gap"><td colspan="' + nc + '"></td></tr>'; return; } h += '<tr>';
    for (let ci = 0; ci < nc; ci++) { if (cover[ri + ',' + ci]) continue; const e = row[ci], sp = span[ri + ',' + ci]; if (!e) { h += '<td class="xl-e"></td>'; continue; }
      const hd = e.bg === '1F6B45', z = xlColor(sh, ci, e); let v = e.v; const pct = sh.name === 'Plan' && ci === 12 && ri >= 4 && typeof v === 'number' && ri < 15; if (pct) v = Math.round(v * 100) + ' %';
      const showF = EXV.f && e.f; const st = (!hd && !z && e.bg ? `background:#${e.bg};` : '') + (typeof v === 'number' || (e.f && !showF && v != null && String(v).length < 8) ? 'text-align:center;' : '');
      h += `<td class="${hd ? 'xl-h' : ''} ${z} ${e.f ? 'xl-f' : ''} ${e.b ? 'xl-b' : ''}" style="${st}" ${sp ? `colspan="${sp[0]}" rowspan="${sp[1]}"` : ''} ${e.f ? `title="${esc(e.f)}"` : ''}>${showF ? `<code>${esc(e.f)}</code>` : esc(v ?? '')}</td>`; }
    h += '</tr>'; });
  return h + '</tbody></table>';
}
function xlGlossary(sh) {
  const hdRow = sh.rows.findIndex((r, i) => i < 6 && r.filter(c => c && c.bg === '1F6B45').length >= 3), out = [];
  sh.rows.forEach((row, ri) => row.forEach((e, ci) => { if (e && e.f && out.length < 12 && !out.some(o => o.ci === ci) && ri > (hdRow < 0 ? 2 : hdRow)) out.push({ ci, ri, f: e.f, v: e.v, lab: hdRow >= 0 && sh.rows[hdRow][ci] ? sh.rows[hdRow][ci].v : (row[0] && row[0].v) || '' }); }));
  return out;
}
function xlLiveRegistre() {
  const rows = ranked();
  return `<div class="card" style="margin-bottom:14px"><div class="row"><h3 style="margin:0">Essayez le calcul du Registre</h3><span class="sp"></span><button class="btn" id="reset-ov">↺ Valeurs du classeur</button></div>
  <p class="small muted" style="margin:4px 0 10px">Modifiez P ou G (1 à 5) : Score, Priorité et Rang se recalculent comme dans le classeur, et tout le site suit. <code>Score = P×G</code> · <code>Priorité = SI(score ≥ 15 ; "Élevé" ; SI(score ≥ 6 ; "Modéré" ; "Faible"))</code> · <code>Clé = score×10000 + G×1000 + P×100 + (12 − ligne)</code> · <code>Rang = RANG(clé)</code>.</p>
  <div class="tw"><table><thead><tr><th>ID</th><th>Risque</th><th>P</th><th>G</th><th>Score</th><th>Priorité</th><th>Clé de tri</th><th>Rang</th></tr></thead><tbody>${rows.map(r => { const c = sc(r), li = D.risks.indexOf(r) + 2, key = c.s * 10000 + c.g * 1000 + c.p * 100 + (D.risks.length + 1 - li); return `<tr><td>${chip(r)}</td><td>${esc(r.titre)}</td><td><input type="number" min="1" max="5" value="${c.p}" data-xl="${r.id}:p" class="xl-in" aria-label="P de ${r.id}"></td><td><input type="number" min="1" max="5" value="${c.g}" data-xl="${r.id}:g" class="xl-in" aria-label="G de ${r.id}"></td><td class="score" style="color:var(--${zone(c.s)})">${c.s}</td><td>${tagZ(c.s)}</td><td class="small muted">${key}</td><td><b>${rankOf(r.id)}</b></td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function xlConsistency() {
  if (hasOv() || S.mode !== 'now') return '<p class="small muted">Comparaison suspendue : des notes sont modifiées ou une autre cotation est affichée. Revenez aux valeurs du classeur pour la relancer.</p>';
  const b = D.risks.map(r => ({ r, s: r.p * r.g })), hi = b.filter(x => x.s >= 15).length, avg = Math.round(b.reduce((t, x) => t + x.s, 0) / b.length * 10) / 10, top = [...b].sort((a, c) => c.s - a.s || c.r.g - a.r.g || c.r.p - a.r.p || a.r.id.localeCompare(c.r.id)).slice(0, 5).map(x => x.r.id).join(',');
  const pl = PM_XL.sheets.find(s => s.name === 'Plan'), levRow = pl.rows.find(r => r[0] && typeof r[0].v === 'string' && r[0].v.startsWith('Levier')), idx = pl.rows.indexOf(levRow), xlLev = pl.rows[idx + 1].slice(3, 3 + D.recos.length).map(e => e.v).join(','), jsLev = recoLeverage().map(x => x.d).join(',');
  const aft = planAll(), hiAfter = aft.filter(x => x.s >= 15).length, xlAfter = pl.rows.find(r => r[1] && r[1].v === 'Risques élevés (score ≥ 15)')[20].v;
  const xlTop = PM_XL.sheets.find(s => s.name === 'Synthèse').rows.filter(r => r[0] && typeof r[0].v === 'number' && r[1] && /^R\d\d$/.test(r[1].v)).map(r => r[1].v).join(',');
  const chk = [['Nombre de risques', xlFind('Synthèse', 'Risques au registre', 1), D.risks.length], ['Risques élevés', xlFind('Synthèse', 'Risques élevés (15–25)', 1), hi], ['Score P×G moyen', xlFind('Synthèse', 'Score P×G moyen', 1), avg], ['Top 5 du classement', xlTop, top], ['Levier des recommandations (REC1 à REC7)', xlLev, jsLev], ['Risques élevés après le plan complet', xlAfter, hiAfter]];
  return `<div class="tw"><table class="xl2"><thead><tr><th>Résultat</th><th>Classeur Excel</th><th>Site</th><th></th></tr></thead><tbody>${chk.map(([l, a, c]) => `<tr><td>${l}</td><td>${esc(a)}</td><td>${esc(c)}</td><td><b class="${String(a) === String(c) ? 'ok' : 'ko'}">${String(a) === String(c) ? '✔ identique' : '✘ écart'}</b></td></tr>`).join('')}</tbody></table></div>`;
}
V.excel = () => {
  const X = PM_XL, sh = X.sheets.find(s => s.name === EXV.sel) || X.sheets[1];
  const ctl = X.sheets.find(s => s.name === 'Contrôles'), ok = ctl.rows.filter(r => r[2] && r[2].v === 'OK').length - 1, nCtl = ctl.rows.filter(r => r[0] && typeof r[0].v === 'number').length;
  const gl = xlGlossary(sh);
  const live = { Registre: xlLiveRegistre(), Plan: `<div class="note" style="margin-bottom:14px">Le simulateur de plan fonctionne en direct dans <a href="#/recos">Recommandations</a> : mêmes formules (taux k, arrondi, levier), même résultat.</div>`, Synthèse: `<div class="note" style="margin-bottom:14px">Ces indicateurs sont affichés en direct sur le <a href="#/dash">tableau de bord</a>.</div>`, Cartographie: `<div class="note" style="margin-bottom:14px">La matrice est dessinée en direct dans <a href="#/carto">Cartographie P × G</a>, avec simulateur de notes.</div>` }[sh.name] || '';
  return hd('Classeur Excel (Livrable 2)', `Le classeur remis à la professeure, feuille par feuille : valeurs, formules et calculs`, `<a class="btn pri" href="downloads/${X.file}" download>⬇ Télécharger le classeur (.xlsx)</a>`) + `
  <div class="grid g4" style="margin-bottom:14px">
   <div class="card kpi"><div class="v">${X.sheets.length}</div><div class="l">feuilles</div><div class="n">${X.sheets.filter(s => /calcul/i.test(s.type)).length} avec formules de calcul</div></div>
   <div class="card kpi"><div class="v">${X.sheets.reduce((t, s) => t + s.rows.reduce((u, r) => u + r.filter(c => c && c.f).length, 0), 0)}</div><div class="l">formules</div><div class="n">recalculées et vérifiées</div></div>
   <div class="card kpi"><div class="v" style="color:var(--lo)">${ok}/${nCtl}</div><div class="l">contrôles de cohérence OK</div><div class="n">feuille Contrôles</div></div>
   <div class="card kpi"><div class="v">${X.sheets.reduce((t, s) => t + (s.charts || 0), 0)}</div><div class="l">graphiques</div><div class="n">dans la feuille Synthèse</div></div></div>
  <div class="note" style="margin-bottom:14px"><b>Comment lire ce classeur.</b> Cellules <span class="xl-key" style="background:#FFF4CC">jaunes</span> : saisie (P, G, cibles, activation du plan). Cellules <span class="xl-key" style="background:#E8F3EC">vertes</span> : formules. ${D.meta.regleCotation}</div>
  <div class="sheets" role="tablist" aria-label="Feuilles du classeur">${X.sheets.map(s => `<button role="tab" class="sheet-tab ${s.name === sh.name ? 'on' : ''}" aria-selected="${s.name === sh.name}" data-xs="${esc(s.name)}"><b>${esc(s.name)}</b><span>${esc(s.type)}</span></button>`).join('')}</div>
  <div class="card" style="margin:12px 0 14px"><div class="row"><h3 style="margin:0">Feuille « ${esc(sh.name)} »</h3><span class="tag" style="background:var(--surface2);color:var(--ink2);border-color:var(--line)">${esc(sh.type)}</span><span class="sp"></span>
   <div class="seg" role="group" aria-label="Affichage"><button data-xf="0" aria-pressed="${!EXV.f}">Valeurs</button><button data-xf="1" aria-pressed="${EXV.f}">Formules</button></div></div>
   <p class="small" style="margin:6px 0 0">${esc(sh.desc)}</p></div>
  ${live}
  <div class="xl-wrap"><div class="tw xlbox">${xlSheetTable(sh)}</div></div>
  ${gl.length ? `<div class="card" style="margin-top:14px"><h3>Calculs de cette feuille</h3><p class="small muted" style="margin:0 0 8px">Une formule par colonne calculée (la première ligne ; les suivantes sont identiques, ligne par ligne).</p><div class="tw"><table><thead><tr><th>Colonne</th><th>Formule</th><th>Exemple de résultat</th></tr></thead><tbody>${gl.map(g => `<tr><td>${esc(g.lab)}</td><td><code>${esc(g.f)}</code></td><td>${esc(g.v)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
  <div class="card" style="margin-top:14px"><h3>Le site et le classeur donnent les mêmes résultats</h3><p class="small muted" style="margin:0 0 8px">Chaque ligne compare une valeur calculée par Excel (recalculée par un tableur indépendant) à la valeur calculée par ce site.</p>${xlConsistency()}</div>`;
};
document.addEventListener('click', e => {
  const t = e.target; const xs = t.closest('[data-xs]'); if (xs) { EXV.sel = xs.dataset.xs; KEEP = true; return render(); }
  const xf = t.closest('[data-xf]'); if (xf) { EXV.f = xf.dataset.xf === '1'; KEEP = true; return render(); }
});
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.xl) { const [id, k] = t.dataset.xl.split(':'), r = R(id), o = S.ov[id] || { p: r.p, g: r.g }; o[k] = Math.max(1, Math.min(5, Math.round(+t.value || 1))); if (o.p === r.p && o.g === r.g) delete S.ov[id]; else S.ov[id] = o; KEEP = true; render(); } });
