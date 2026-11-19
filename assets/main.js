const NAV = [['grp', 'Pilotage'], ['dash', '◧', 'Tableau de bord'], ['grp', 'Analyse'], ['cadrage', '◎', 'Cadrage et hypothèses'], ['registre', '☰', 'Registre des risques'], ['carto', '▦', 'Cartographie P × G'], ['acteurs', '⚇', 'Acteurs et conflits'], ['gouv', '⛓', 'Gouvernance et RACI'], ['coso', '⬠', 'Diagnostic COSO'], ['incidents', '⚑', 'Incidents'], ['recos', '✔', 'Recommandations'], ['grp', 'Méthode'], ['transparence', '◌', 'Transparence'], ['entrainement', '✎', 'Entraînement'], ['grp', 'Livrables'], ['rapport', '❡', 'Rapport (L1)'], ['note', '✉', 'Note de décision (L4)'], ['soutenance', '▶', 'Soutenance (L5)'], ['grille', '☑', 'Grille de notation'], ['qualite', '✓', 'Contrôle qualité']];
const TITLES = { dash: 'Tableau de bord', cadrage: 'Cadrage', registre: 'Registre', carto: 'Cartographie', acteurs: 'Acteurs', gouv: 'Gouvernance', coso: 'COSO', incidents: 'Incidents', recos: 'Recommandations', rapport: 'Rapport', note: 'Note de décision', soutenance: 'Soutenance', qualite: 'Qualité', transparence: 'Transparence', entrainement: 'Entraînement', grille: 'Grille de notation' };
let cur = 'dash', KEEP = false;
function shell() {
  $('#app').innerHTML = `<aside class="side" id="side"><div class="brand"><div class="logo">PM</div><div><b>PayMaroc</b><small>Maîtrise des risques · G5 · 5GF</small></div></div>
  <nav class="nav" id="nav">${NAV.map(n => n[0] === 'grp' ? `<div class="grp">${n[1]}</div>` : `<a href="#/${n[0]}" data-n="${n[0]}"><span class="ic">${n[1]}</span>${n[2]}</a>`).join('')}</nav>
  <div><div class="grp" style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:4px 8px">Cotation affichée</div><div class="seg" style="margin:4px 8px;display:flex"><button id="m-now" style="flex:1">Actuelle</button><button id="m-tgt" style="flex:1">Cible</button><button id="m-plan" style="flex:1">Plan</button></div><div id="ovflag" class="small" style="margin:6px 8px;color:var(--mid)"></div><div class="row" style="margin:6px 8px"><button class="btn" id="tr-toggle" aria-pressed="false" title="Affiche la provenance de chaque chiffre">◌ Transparence</button><button class="btn" id="theme">◐ Thème</button></div><div style="margin:6px 8px"><button class="btn" id="srch" style="width:100%;text-align:left">⌕ Rechercher <span class="muted small" style="float:right">Ctrl K</span></button></div></div>
  <div class="foot">${D.meta.ecole} · ${D.meta.professeur}<br>Cas fictif — hypothèses signalées.<br>P × G : règle pédagogique.</div></aside>
  <main class="main" id="view" tabindex="-1"></main>`;
}
function render() {
  const keepMode = S.mode, doc = ['rapport', 'note'].includes(cur);
  if (doc) S.mode = 'now';
  let h;
  if (cur === 'rapport') h = `<div class="pbtn"><button class="btn pri" data-print="report">🖨 Imprimer / PDF</button><a class="btn" href="downloads/Livrable1_Rapport_PayMaroc_G5.docx" download>⬇ Word (.docx)</a><button class="btn" id="pages">Estimer les pages</button><span id="pg" class="small muted" style="align-self:center"></span></div>${REPORT()}`;
  else if (cur === 'note') h = `<div class="pbtn"><button class="btn pri" data-print="note">🖨 Imprimer / PDF (1 page A4)</button><a class="btn" href="downloads/Livrable4_Note_de_decision_PayMaroc_G5.docx" download>⬇ Word (.docx)</a></div>${NOTE()}`;
  else h = V[cur]();
  $('#view').innerHTML = h; S.mode = keepMode;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.n === cur));
  $('#m-now').setAttribute('aria-pressed', S.mode === 'now'); $('#m-tgt').setAttribute('aria-pressed', S.mode === 'target'); $('#m-plan').setAttribute('aria-pressed', S.mode === 'plan'); $('#tr-toggle').setAttribute('aria-pressed', S.tr);
  $('#ovflag').textContent = hasOv() ? '⚠ Notes modifiées par simulation' : '';
  document.title = `${TITLES[cur]} — PayMaroc · Maîtrise des risques (G5)`;
  if (cur === 'incidents') simUpdate();
  if (cur === 'gouv') { const ok = D.raci.rows.every(r => r.v.filter(x => x.startsWith('A')).length === 1); $('#raci-check').innerHTML = `<b class="${ok ? 'ok' : 'ko'}">${ok ? '✔' : '✘'}</b> Contrôle : un seul « A » par activité (${D.raci.rows.length} lignes).`; }
  $('#side').classList.remove('open'); if (!KEEP) window.scrollTo(0, 0); KEEP = false;
}
function route() { const h = (location.hash || '#/dash').replace('#/', ''); cur = V[h] || ['rapport', 'note'].includes(h) ? h : 'dash'; render(); }
function calcBlock(r, c) {
  const rk = ranked(), i = rankOf(r.id) - 1, same = rk.filter(x => x.id !== r.id && sc(x).s === c.s), o = S.ov[r.id], hs = hrefs(r);
  const mode = S.mode === 'target' ? 'cotation cible (hypothèse H12)' : S.mode === 'plan' ? 'cotation avec le plan choisi' : o ? 'note modifiée par simulation' : 'cotation du registre';
  return `<div class="calc"><div class="eq"><span>P</span><b>${c.p}</b><span>×</span><span>G</span><b>${c.g}</b><span>=</span><b class="res-n" style="color:var(--${zone(c.s)})">${c.s}</b></div>${gauge(c.s)}
  <p class="small" style="margin:10px 0 4px">Zone <b>${ZL[zone(c.s)]}</b> (${zone(c.s) === 'hi' ? '15 à 25' : zone(c.s) === 'mid' ? '6 à 12' : '1 à 5'}). Source affichée : ${mode}.</p>
  <p class="small" style="margin:0 0 4px"><b>Rang ${i + 1}/${rk.length}.</b> ${same.length ? `Ex æquo avec ${same.map(x => x.id).join(', ')} : départage par gravité, puis probabilité, puis identifiant.` : 'Score unique, aucun départage nécessaire.'}${rk[i - 1] ? ` Au-dessus : ${rk[i - 1].id} (${sc(rk[i - 1]).s}).` : ''}${rk[i + 1] ? ` En dessous : ${rk[i + 1].id} (${sc(rk[i + 1]).s}).` : ''}</p>
  <p class="small" style="margin:0 0 4px"><b>Sources :</b> ${basisTag(r)} · indices ${r.indices.join(', ')}${hs.length ? ' · ' + hs.map(h => `<a href="#transparence" data-gohyp>${hyp(h)}</a>`).join(' ') : ''}</p>
  ${o ? `<p class="small" style="margin:0 0 4px;color:var(--mid)">Note modifiée : P ${r.p} → ${o.p}, G ${r.g} → ${o.g}. <button class="btn" data-resetrisk="${r.id}">Rétablir</button></p>` : ''}
  <p class="small muted" style="margin:6px 0 0">${D.meta.regleCotation}</p></div>`;
}
function drawer(id) {
  const r = R(id), c = sc(r), b = base(r);
  $('#drawer').innerHTML = `<button class="btn x" data-close>✕</button><div class="row"><span class="chip z-${zone(c.s)}" style="cursor:default">${r.id}</span><h2 style="margin:0">${esc(r.titre)}</h2></div>
  <div class="row" style="margin:8px 0">${tagZ(c.s)} <span class="tag" style="background:var(--surface2)">${D.cats[r.cat]}</span> ${basisTag(r)} <b>P ${c.p} × G ${c.g} = ${c.s}</b> <span class="muted small">rang ${rankOf(r.id)}/${D.risks.length}</span></div>
  <div class="sec">Cause → événement → conséquences</div><div class="cev"><div><h5>Cause</h5>${esc(r.cause)}</div><div><h5>Événement de risque</h5>${esc(r.evenement)}</div><div><h5>Conséquences</h5><b>Financière</b> : ${esc(r.cons.fin)}<br><b>Opérationnelle</b> : ${esc(r.cons.op)}<br><b>Réputationnelle</b> : ${esc(r.cons.rep)}</div></div>
  <div class="sec">Justification de la cotation</div><p><b>P = ${b.p}</b> — ${esc(r.justP)}<br><b>G = ${b.g}</b> — ${esc(r.justG)}</p><p class="small muted">Indices du cas : ${r.indices.map(i => `<b>${i}</b> ${esc(D.indices[i - 1].txt)}`).join(' · ')}</p>
  <div class="sec">Comment ce score est calculé</div>${calcBlock(r, c)}
  <div class="sec">Lacune COSO et contrôle</div><p><span class="tag z-mid">${CK[r.coso]}</span> ${esc(r.lacune)}</p><p><b>Mesure de contrôle :</b> ${esc(r.controle)}</p>
  <div class="sec">Acteurs</div><p><b>Pilote :</b> ${actorChip(r.owner)}<br><b>Contribuent :</b> ${r.sources.map(actorChip).join(' ')}<br><b>Impactés :</b> ${r.impacted.map(actorChip).join(' ')}</p>
  <div class="sec">Recommandations</div>${recosOf(r.id).map(rc => `<div style="margin:8px 0"><b>${rc.id} — ${esc(rc.titre)}</b>${chainFor(rc, r.id)}</div>`).join('')}
  <p class="small muted">Cible après actions ${hyp('H12')} : ${r.target.p} × ${r.target.g} = ${r.target.p * r.target.g}</p>`;
  $('#dbg').classList.add('on'); $('#drawer').scrollTop = 0;
}
const closeDrawer = () => $('#dbg').classList.remove('on');
function simVals() { const v = {}; $$('[data-dim]').forEach(s => v[s.dataset.dim] = +s.value); return v; }
function simCrit() { const m = Math.max(0, ...Object.values(simVals())); return ['C4', 'C3', 'C2', 'C1'][m]; }
function simUpdate() { const c = simCrit(), n = D.grille.niveaux.find(x => x.c === c); const res = $('#sim-res'); if (!res) return; res.innerHTML = `<div class="small muted">Criticité retenue</div><div class="big" style="color:var(--${critZ(c)})">${c} — ${n.nom}</div><p style="margin:4px 0"><b>${n.delai}</b></p><p class="small" style="margin:0">${n.escalade}<br>Informer : ${n.qui.map(x => A(x).nom).join(', ')}</p>`; const nc = $('#n-crit'); if (nc) nc.textContent = c; }
/* Présentation */
let dk = { i: 0, t0: null, iv: null };
function deckShow(i) {
  dk.i = Math.max(0, Math.min(SLIDES.length - 1, i)); const s = SLIDES[dk.i];
  $('#stage').innerHTML = `<div class="slide">${s.h()}<div class="sn">${dk.i + 1} / ${SLIDES.length} · ${s.who}</div></div>`;
  $('#dnotes').textContent = `Notes (${s.who}, ~${s.sec} s) : ${s.notes}`; $('#dpos').textContent = `${dk.i + 1}/${SLIDES.length} — ${s.t}`;
}
function deckOpen() { const m = S.mode; S.mode = 'now'; $('#deck').classList.add('on'); deckShow(0); dk.m = m; }
function deckClose() { $('#deck').classList.remove('on'); S.mode = dk.m || S.mode; clearInterval(dk.iv); dk.iv = null; dk.t0 = null; $('#dtimer').textContent = '12:00'; }
function deckTimer() { if (dk.iv) { clearInterval(dk.iv); dk.iv = null; $('#dtoggle').textContent = '⏱ Chrono'; return; } dk.t0 = Date.now(); $('#dtoggle').textContent = '⏸ Pause'; dk.iv = setInterval(() => { const left = 720 - Math.floor((Date.now() - dk.t0) / 1000); const a = Math.abs(left); $('#dtimer').textContent = (left < 0 ? '-' : '') + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0'); $('#dtimer').style.color = left < 60 ? '#ff8f80' : ''; }, 500); }

document.addEventListener('click', e => {
  const t = e.target;
  const rk = t.closest('[data-risk]'); if (rk && !t.closest('[data-close]')) { if (!t.closest('select')) drawer(rk.dataset.risk); return; }
  if (t.closest('[data-close]') || t.id === 'dbg') return closeDrawer();
  const f = t.closest('[data-f]'); if (f) { const [k, v] = f.dataset.f.split(':'); if (k === 'cat') V._cat = v; else V._z = v; return render(); }
  const gv = t.closest('[data-gv]'); if (gv) { V._gv = gv.dataset.gv; return render(); }
  const am = t.closest('.amap'); if (am) { V._hl = V._hl === am.dataset.hl ? null : am.dataset.hl; return render(); }
  const pr = t.closest('[data-print]'); if (pr) { document.body.classList.toggle('print-note', pr.dataset.print === 'note'); return window.print(); }
  if (t.id === 'm-now' || t.id === 'm-tgt') { S.mode = t.id === 'm-now' ? 'now' : 'target'; return render(); }
  if (t.id === 'theme') { const r = document.documentElement, d = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); r.dataset.theme = d === 'dark' ? 'light' : 'dark'; return render(); }
  if (t.id === 'reset-ov') { S.ov = {}; return render(); }
  const rr = t.closest('[data-resetrisk]'); if (rr) { delete S.ov[rr.dataset.resetrisk]; drawer(rr.dataset.resetrisk); return render(); }
  if (t.closest('[data-gohyp]')) { closeDrawer(); return; }
  if (t.id === 'csv-reg') return download('registre_risques_paymaroc.csv', toCSV([['Rang', 'ID', 'Catégorie', 'Risque', 'Cause', 'Événement', 'Conséq. financière', 'Conséq. opérationnelle', 'Conséq. réputationnelle', 'P', 'G', 'P×G', 'Niveau', 'Nature', 'COSO', 'Contrôle', 'Pilote'], ...ranked().map(r => [rankOf(r.id), r.id, D.cats[r.cat], r.titre, r.cause, r.evenement, r.cons.fin, r.cons.op, r.cons.rep, sc(r).p, sc(r).g, sc(r).s, ZL[zone(sc(r).s)], r.basis, CK[r.coso], r.controle, A(r.owner).nom])]));
  if (t.id === 'csv-raci') return download('raci_paymaroc.csv', toCSV([['Activité', ...D.raci.cols.map(c => A(c).nom), 'Constat actuel'], ...D.raci.rows.map(r => [r.act, ...r.v, r.constat])]));
  if (t.id === 'csv-inc') return download('suivi_incidents_paymaroc.csv', toCSV([['ID', 'Date', 'Source', 'Description', 'Service', 'Criticité', 'Risque', 'Responsable', 'Statut', 'PEC (min)', 'Cause racine', 'Action', 'Échéance'], ...INC.map(i => [i.id, i.date, i.source, i.desc, i.service, i.crit, i.risque, A(i.resp).nom, i.statut, i.pec, i.cause, i.action, i.ech])]));
  if (t.id === 'csv-rec') return download('recommandations_paymaroc.csv', toCSV([['Priorité', 'ID', 'Risques', 'Lacune COSO', 'Action', 'Responsable', 'Validation', 'KPI', 'Bénéfice', 'Faisabilité', 'Limites', 'Calendrier'], ...D.recos.map(r => [r.prio, r.id, r.risques.join(', '), CK[r.coso], r.action, A(r.resp).nom, A(r.valide).nom, r.kpi, r.benefice, r.faisabilite, r.limites, r.vague])]));
  if (t.id === 'inc-reset') { INC = JSON.parse(JSON.stringify(D.incidents)); incSave(INC); return render(); }
  if (t.id === 'n-add') { const d = $('#n-desc').value.trim(); if (!d) { $('#n-desc').focus(); return; } const n = INC.length + 1, dt = new Date(), ech = new Date(dt.getTime() + 7 * 864e5); INC.push({ id: 'INC-' + String(n).padStart(3, '0'), date: dt.toISOString().slice(0, 16).replace('T', ' '), source: $('#n-src').value, desc: d, service: $('#n-svc').value || '—', crit: simCrit(), risque: $('#n-risk').value, resp: $('#n-resp').value, statut: 'Ouvert', pec: 0, cause: 'À analyser', action: 'À définir', ech: ech.toISOString().slice(0, 10) }); incSave(INC); return render(); }
  if (t.id === 'pages') { const w = $('#report').offsetWidth, h = $('#report').scrollHeight; $('#pg').textContent = 'Estimation grossière : utiliser « Imprimer / PDF » pour le décompte exact (A4).'; return; }
  if (t.id === 'open-deck') return deckOpen();
  if (t.id === 'dclose') return deckClose(); if (t.id === 'dprev') return deckShow(dk.i - 1); if (t.id === 'dnext') return deckShow(dk.i + 1); if (t.id === 'dtoggle') return deckTimer();
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.sl) { const [id, k] = t.dataset.sl.split(':'), r = R(id); const o = S.ov[id] || { p: r.p, g: r.g }; o[k] = +t.value; if (o.p === r.p && o.g === r.g) delete S.ov[id]; else S.ov[id] = o; const c = sc(r); t.parentNode.firstChild.nodeValue = `${k.toUpperCase()} = ${t.value}`; const row = t.closest('.slrow'); const sp = row.lastElementChild; sp.textContent = c.s; sp.style.color = `var(--${zone(c.s)})`; row.firstElementChild.innerHTML = chip(r); $('#hm-wrap').innerHTML = heatmap(); $('#top4').innerHTML = topN(4).map(x => `${chip(x)} ${esc(x.titre)} (${sc(x).s})`).join('<br>'); $('#ovflag').textContent = hasOv() ? '⚠ Notes modifiées par simulation' : ''; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.dim) simUpdate();
  if (t.dataset.st) { INC[+t.dataset.st].statut = t.value; incSave(INC); render(); }
});
document.addEventListener('keydown', e => {
  if ($('#deck').classList.contains('on')) { if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); deckShow(dk.i + 1); } if (['ArrowLeft', 'PageUp'].includes(e.key)) deckShow(dk.i - 1); if (e.key === 'Escape') deckClose(); }
  else if (e.key === 'Escape') closeDrawer();
});
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('beforeend', `<div class="drawer-bg" id="dbg"><aside class="drawer" id="drawer" onclick="event.stopPropagation()"></aside></div>
  <div class="deck" id="deck"><div class="bar2"><b id="dpos"></b><span class="sp" style="flex:1"></span><span id="dtimer" style="font-variant-numeric:tabular-nums;font-weight:700">12:00</span><button class="btn" id="dtoggle">⏱ Chrono</button><button class="btn" id="dprev">←</button><button class="btn" id="dnext">→</button><button class="btn" id="dclose">✕ Quitter</button></div><div class="stage" id="stage"></div><div class="notes" id="dnotes"></div></div>`);
  shell(); initTransp();
  $('#view').insertAdjacentHTML('beforebegin', '');
  route();
});
