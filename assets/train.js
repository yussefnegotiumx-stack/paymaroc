/* Grille de notation (couverture du dossier) et mode entraînement (fiches + jury simulé) */
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const MEMBERS = D.meta.membres;
const TRN = { m: 0, mode: 'cards', cat: 'Toutes', weak: false, cur: null, rev: false, jury: null };

/* ---------- Fiches générées à partir des données ---------- */
let _deck = null;
function buildDeck() {
  if (_deck) return _deck; const d = [];
  const cev = r => `<div class="cev"><div><h5>Cause</h5>${esc(r.cause)}</div><div><h5>Événement</h5>${esc(r.evenement)}</div><div><h5>Conséquences</h5><b>Fin.</b> ${esc(r.cons.fin)}<br><b>Op.</b> ${esc(r.cons.op)}<br><b>Rép.</b> ${esc(r.cons.rep)}</div></div>`;
  D.risks.forEach(r => {
    d.push({ id: 'cot-' + r.id, cat: 'Cotation', q: `Défendez la cotation de ${r.id} : ${r.titre}.`, a: `<p><b>P = ${r.p}</b> : ${esc(r.justP)}</p><p><b>G = ${r.g}</b> : ${esc(r.justG)}</p><p>Score ${r.p * r.g} (${ZL[zone(r.p * r.g)]}). Nature : ${r.basis}. Indices du cas : ${r.indices.join(', ')}.</p>` });
    d.push({ id: 'chn-' + r.id, cat: 'Risques', q: `Quelle est la chaîne cause → événement → conséquences de ${r.id} (${r.titre}) ?`, a: cev(r) });
    const rcs = recosOf(r.id);
    d.push({ id: 'rec-' + r.id, cat: 'Recommandations', q: `Pour ${r.id} : quelle lacune COSO, quel contrôle, quelle recommandation et quel responsable ?`, a: `<p><b>Lacune (${CK[r.coso]}) :</b> ${esc(r.lacune)}</p><p><b>Contrôle :</b> ${esc(r.controle)}</p><p><b>Recommandation(s) :</b> ${rcs.map(x => `${x.id} ${esc(x.titre)} (${esc(A(x.resp).nom)}, KPI : ${esc(x.kpi)})`).join(' ; ')}</p>` });
  });
  D.coso.forEach(c => d.push({ id: 'cos-' + c.k, cat: 'COSO', q: `Que montre le diagnostic de « ${CK[c.k]} » (maturité, observations, lacune) ?`, a: `<p><b>Maturité ${c.mat}/4</b> (cible ${c.cible}). ${esc(c.q)}</p><ul>${c.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul><p><b>Lacune :</b> ${esc(c.lacune)}</p>` }));
  D.conflits.forEach(k => d.push({ id: 'cf-' + k.id, cat: 'Gouvernance', q: `Quel conflit d'objectifs oppose ${k.entre.map(x => A(x).nom).join(' et ')} ?`, a: `<p>${esc(k.txt)}</p><p>Risques concernés : ${k.risques.join(', ')}.</p>` }));
  D.raci.rows.forEach((r, i) => { const col = D.raci.cols, ap = col.filter((c, j) => r.v[j].startsWith('A')).map(c => A(c).nom), re = col.filter((c, j) => r.v[j].includes('R')).map(c => A(c).nom); d.push({ id: 'rac-' + i, cat: 'Gouvernance', q: `Dans le RACI, qui approuve et qui réalise : « ${r.act} » ?`, a: `<p><b>Approuve (A) :</b> ${ap.join(', ')}<br><b>Réalise (R) :</b> ${re.join(', ')}</p><p class="small muted">Constat actuel : ${esc(r.constat)}</p>` }); });
  d.push({ id: 'met-pg', cat: 'Méthode', q: 'Que signifie P × G, et que ne signifie-t-il pas ?', a: `<p>${esc(D.meta.regleCotation)}</p><p>Seuils : ${esc(D.meta.bareme)}.</p>` });
  d.push({ id: 'met-tie', cat: 'Méthode', q: 'Comment départagez-vous deux risques au même score ?', a: `<p>${esc(D.meta.departage)}</p><p>Exemple : R01 (4 × 5) précède R04 (5 × 4) car sa gravité est plus élevée.</p>` });
  d.push({ id: 'met-fait', cat: 'Méthode', q: 'Quelle différence entre fait du cas, inférence et hypothèse ?', a: `<p><b>Fait du cas :</b> fourni par le livret (${D.risks.filter(r => r.basis === 'Fait du cas').length} risques s'y appuient).<br><b>Inférence :</b> risque déduit des lacunes, sans indice direct (${D.risks.filter(r => r.basis !== 'Fait du cas').length} risques, probabilité prudente).<br><b>Hypothèse :</b> information ajoutée par le groupe (${D.hypotheses.length} au total, repérées H01 à H13).</p>` });
  d.push({ id: 'met-hp', cat: 'Méthode', q: 'Quelles techniques sont hors périmètre, et pourquoi ?', a: `<p>${esc(D.meta.horsPerimetre)}</p><p>Le contrôle continu porte uniquement sur les séances 1 à 7 de contrôle interne et 1 à 4 de gestion des risques financiers.</p>` });
  d.push({ id: 'met-ar', cat: 'Méthode', q: 'Quelles sont les trois décisions à faire prendre à la Direction ?', a: `<ol>${W3().map(w => { const rc = D.recos.find(r => r.id === w.rc); return `<li><b>${esc(w.t)}</b> : ${rc.id} ${esc(rc.titre)} (${esc(A(rc.resp).nom)})</li>`; }).join('')}</ol>` });
  d.push({ id: 'met-cp', cat: 'Méthode', q: 'Quel est le compromis entre rapidité commerciale, risque acceptable et solidité des contrôles ?', a: `<p>${D.scenarios.map(s => `<b>${esc(s.nom)}</b> : rapidité ${s.rap}/5, risque ${s.risque}/5, contrôles ${s.ctrl}/5.`).join('<br>')}</p><p>Recommandé : le scénario C, avec une gate de mise en production à deux voies (rapide pour les changements mineurs, complète pour le paiement).</p>` });
  d.push({ id: 'met-cr', cat: 'Méthode', q: 'Comment la criticité d\'un incident est-elle déterminée, et que se passe-t-il pour un C1 ?', a: `<p>La criticité est le niveau le plus élevé parmi quatre dimensions : ${D.grille.dims.map(x => x.nom.toLowerCase()).join(', ')}. Maximum, pas somme.</p><p><b>C1 :</b> ${esc(D.grille.niveaux[0].delai)} ; ${esc(D.grille.niveaux[0].escalade)}.</p>` });
  D.jury.forEach((j, i) => d.push({ id: 'jur-' + i, cat: 'Jury', q: j.q, a: `<p>${esc(j.r)}</p>` }));
  return _deck = d;
}
const trKey = m => 'pm_train_' + m;
const trState = m => LS.get(trKey(m), {});
const isAcq = e => e && e.b >= 2;
function trStats(m, deck = buildDeck()) { const st = trState(m); const by = {}; deck.forEach(c => { const o = by[c.cat] = by[c.cat] || { n: 0, acq: 0, rev: 0 }; o.n++; const e = st[c.id]; if (isAcq(e)) o.acq++; else if (e) o.rev++; }); const n = deck.length, acq = deck.filter(c => isAcq(st[c.id])).length; return { by, n, acq, pct: Math.round(acq / n * 100), seen: Object.keys(st).length }; }
function trPick() {
  const st = trState(MEMBERS[TRN.m]); let pool = buildDeck().filter(c => (TRN.cat === 'Toutes' || c.cat === TRN.cat) && (!TRN.weak || (st[c.id] && !isAcq(st[c.id]))));
  if (!pool.length) return null; if (pool.length > 1 && TRN.cur) pool = pool.filter(c => c.id !== TRN.cur.id);
  const w = c => { const e = st[c.id]; return !e ? 3 : e.b === 0 ? 4 : e.b === 1 ? 2 : e.b === 2 ? 1 : .3; };
  let t = pool.reduce((a, c) => a + w(c), 0) * Math.random(); for (const c of pool) { t -= w(c); if (t <= 0) return c; } return pool[0];
}
function trRate(level) {
  const c = TRN.cur; if (!c) return; const m = MEMBERS[TRN.m], st = trState(m), e = st[c.id] || { b: 0, n: 0 };
  e.n++; e.b = level === 'oui' ? Math.min(e.b + 1, 3) : level === 'moyen' ? 1 : 0; st[c.id] = e; LS.set(trKey(m), st);
  if (TRN.jury && !TRN.jury.done) { TRN.jury.log.push({ id: c.id, q: c.q, level }); }
}

/* ---------- Page Entraînement ---------- */
function fmtT(s) { s = Math.max(0, s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
V.entrainement = () => {
  const deck = buildDeck(), cats = ['Toutes', ...[...new Set(deck.map(c => c.cat))]];
  const me = MEMBERS.map((m, i) => ({ m, s: trStats(m, deck) })), cur = me[TRN.m];
  const head = hd('Entraînement', 'Chaque membre doit pouvoir défendre l\'ensemble du dossier : fiches de révision et jury simulé', `<div class="seg" role="group" aria-label="Membre">${MEMBERS.map((m, i) => `<button data-tm="${i}" aria-pressed="${TRN.m === i}">${esc(m)}</button>`).join('')}</div><div class="seg" role="group" aria-label="Mode"><button data-tmode="cards" aria-pressed="${TRN.mode === 'cards'}">Fiches</button><button data-tmode="jury" aria-pressed="${TRN.mode === 'jury'}">Jury simulé</button></div>`);
  const prog = `<div class="grid g2" style="margin-bottom:14px">${me.map((x, i) => `<div class="card"><div class="row"><b>${esc(x.m)}</b><span class="sp"></span><span class="score" style="color:var(--${x.s.pct >= 70 ? 'lo' : x.s.pct >= 35 ? 'mid' : 'hi'})">${x.s.pct} %</span></div><div class="pg"><i style="width:${x.s.pct}%"></i></div><p class="small muted" style="margin:6px 0 0">${x.s.acq} fiches acquises sur ${x.s.n} · ${x.s.seen} vues</p></div>`).join('')}</div>`;
  if (TRN.mode === 'jury') return head + prog + juryView();
  const c = TRN.cur && (TRN.cat === 'Toutes' || TRN.cur.cat === TRN.cat) ? TRN.cur : (TRN.cur = trPick());
  const st = trState(MEMBERS[TRN.m]);
  return head + prog + `<div class="card" style="margin-bottom:14px"><div class="row"><b class="small">Thème</b>${cats.map(k => `<button class="btn" data-tcat="${k}" aria-pressed="${TRN.cat === k}">${k}</button>`).join('')}<span class="sp"></span><label class="small"><input type="checkbox" id="t-weak" data-tweak ${TRN.weak ? 'checked' : ''}> Seulement à revoir</label></div>
  <div class="row small muted" style="margin-top:8px">${Object.entries(cur.s.by).map(([k, v]) => `<span>${k} ${v.acq}/${v.n}</span>`).join(' · ')}</div></div>
  ${c ? `<div class="fc" aria-live="polite"><div class="small muted">${c.cat} · ${st[c.id] ? (isAcq(st[c.id]) ? 'acquise' : 'à revoir') : 'nouvelle'}</div><div class="q">${esc(c.q)}</div>
  ${TRN.rev ? `<div class="a">${c.a}</div><div class="row" style="margin-top:14px"><span class="small muted">Votre réponse était…</span><button class="btn" data-rate="non">✘ À revoir <kbd>1</kbd></button><button class="btn" data-rate="moyen">~ Hésitant <kbd>2</kbd></button><button class="btn pri" data-rate="oui">✔ Je savais <kbd>3</kbd></button></div>` : `<div class="row" style="margin-top:14px"><button class="btn pri" data-reveal>Voir la réponse <kbd>Espace</kbd></button><button class="btn" data-skip>Passer</button></div><p class="small muted">Répondez à voix haute avant de révéler, comme devant le jury.</p>`}</div>` : `<div class="card"><p>${TRN.weak ? 'Aucune fiche à revoir pour ce thème : bravo, ou changez de thème.' : 'Aucune fiche.'}</p></div>`}
  <p class="small muted" style="margin-top:10px">Progression enregistrée dans ce navigateur, séparément pour chaque membre. Les fiches viennent des mêmes données que le registre, le rapport et la présentation. <button class="btn" data-treset>↺ Réinitialiser ${esc(MEMBERS[TRN.m])}</button></p>`;
};
function juryView() {
  const J = TRN.jury;
  if (!J) return `<div class="card"><h3>Jury simulé : 8 minutes de questions</h3><p>Des questions tirées au hasard (jury, cotations, COSO, gouvernance, méthode). Répondez à voix haute, puis révélez la réponse et évaluez-vous. À la fin, vous obtenez la liste des points à revoir.</p><button class="btn pri" data-jstart>▶ Démarrer pour ${esc(MEMBERS[TRN.m])}</button></div>`;
  if (J.done) { const n = J.log.length, ok = J.log.filter(x => x.level === 'oui').length, rev = J.log.filter(x => x.level !== 'oui'); return `<div class="card"><h3>Bilan de la session</h3><p><b>${ok}/${n}</b> questions maîtrisées${n ? ` (${Math.round(ok / n * 100)} %)` : ''}.</p>${rev.length ? `<p class="small"><b>À revoir :</b></p><ul class="small">${rev.map(x => `<li>${esc(x.q)}</li>`).join('')}</ul>` : '<p>Aucune question à revoir.</p>'}<button class="btn pri" data-jstart>Nouvelle session</button> <button class="btn" data-tmode="cards">Retour aux fiches</button></div>`; }
  const c = J.q; return `<div class="card"><div class="row"><b>Question ${J.log.length + (J.rated ? 0 : 1)}</b><span class="sp"></span><span class="score" id="jt" style="font-size:1.4rem">${fmtT(J.dur - Math.floor((Date.now() - J.t0) / 1000))}</span><button class="btn" data-jend>Terminer</button></div></div>
  <div class="fc"><div class="small muted">${c.cat}</div><div class="q">${esc(c.q)}</div>${TRN.rev ? `<div class="a">${c.a}</div><div class="row" style="margin-top:14px"><button class="btn" data-rate="non">✘ À revoir <kbd>1</kbd></button><button class="btn" data-rate="moyen">~ Hésitant <kbd>2</kbd></button><button class="btn pri" data-rate="oui">✔ Je savais <kbd>3</kbd></button></div>` : `<div class="row" style="margin-top:14px"><button class="btn pri" data-reveal>Voir la réponse <kbd>Espace</kbd></button></div>`}</div>`;
}
function jStart() { const pool = buildDeck().filter(c => ['Jury', 'Cotation', 'COSO', 'Gouvernance', 'Méthode'].includes(c.cat)); TRN.jury = { t0: Date.now(), dur: 480, log: [], pool: pool.sort(() => Math.random() - .5), i: 0, done: false }; TRN.jury.q = TRN.jury.pool[0]; TRN.cur = TRN.jury.q; TRN.rev = false; clearInterval(TRN.iv); TRN.iv = setInterval(() => { const el = $('#jt'); if (!el || !TRN.jury || TRN.jury.done) return clearInterval(TRN.iv); const left = TRN.jury.dur - Math.floor((Date.now() - TRN.jury.t0) / 1000); el.textContent = fmtT(left); if (left <= 0) { TRN.jury.done = true; clearInterval(TRN.iv); render(); } }, 500); }

/* ---------- Page Grille de notation ---------- */
function CRIT() {
  const R_ = D.risks, all = (...a) => a.every(Boolean);
  return [
    { id: 'notions', n: 'Maîtrise des notions', pts: 3, obs: 'Précision des concepts étudiés ; intégration des deux matières.', ou: [['cadrage', 'Cadrage'], ['coso', 'COSO'], ['transparence', 'Transparence']],
      auto: [['Règle P × G rappelée comme règle pédagogique', /pédagogique/.test(D.meta.regleCotation)], ['Chaque recommandation relie un risque (gestion des risques) à une lacune COSO (contrôle interne)', D.recos.every(r => r.risques.length && r.coso)], ['Barème qualitatif, seuils et règle de départage explicites', all(D.meta.bareme, D.meta.departage)]] },
    { id: 'typo', n: 'Identification et typologie', pts: 3, obs: 'Pertinence des huit risques, causes et conséquences.', ou: [['registre', 'Registre'], ['cadrage', 'Cadrage']],
      auto: [[`${R_.length} risques au registre (minimum 8)`, R_.length >= 8], ['Cause, événement et trois conséquences distincts pour chaque risque', R_.every(r => r.cause && r.evenement && r.cause !== r.evenement && r.cons.fin && r.cons.op && r.cons.rep)], ['Les trois catégories (opérationnel, financier, conformité) sont représentées', new Set(R_.map(r => r.cat)).size === 3], ['Les six indices du cas sont tous exploités', D.indices.every(i => R_.some(r => r.indices.includes(i.id)))]] },
    { id: 'carto', n: 'Cartographie et priorités', pts: 3, obs: 'Cotation justifiée, classement cohérent, présentation lisible.', ou: [['carto', 'Cartographie'], ['dash', 'Tableau de bord']],
      auto: [['Chaque note de P et de G est justifiée', R_.every(r => r.justP && r.justG)], ['Chaque risque cote ses indices ; les inférences sont signalées', R_.every(r => r.indices.length && r.basis)], ['Classement avec règle de départage explicite (score, gravité, probabilité, identifiant)', !!D.meta.departage && /gravité/.test(D.meta.departage)]] },
    { id: 'coso', n: 'Contrôle interne : COSO / AMMC', pts: 4, obs: 'Diagnostic appliqué au cas ; usage sectoriel correct de l\'AMMC.', ou: [['coso', 'COSO']], note: 'Le cadre AMMC est réservé au sujet 02 : non applicable ici et volontairement non utilisé.',
      auto: [['Cinq composantes COSO documentées', D.coso.length === 5], ['Au moins trois observations concrètes par composante', D.coso.every(c => c.obs.length >= 3)], ['Chaque composante lue sous l\'angle alerte · information · suivi', D.coso.every(c => c.alerte && c.info && c.suivi)]] },
    { id: 'gouv', n: 'Gouvernance et parties prenantes', pts: 3, obs: 'Rôles, responsabilités, conflits d\'objectifs et circulation des informations.', ou: [['acteurs', 'Acteurs'], ['gouv', 'Gouvernance et RACI'], ['incidents', 'Incidents']],
      auto: [[`${D.actors.length} parties prenantes (internes et externes)`, D.actors.some(a => a.type === 'int') && D.actors.some(a => a.type === 'ext')], [`${D.conflits.length} conflits d'objectifs analysés`, D.conflits.length >= 3], ['RACI : un seul A par activité', D.raci.rows.every(r => r.v.filter(x => x.startsWith('A')).length === 1)], ['Circuit d\'alerte et grille de criticité définis', D.grille.etapes.length > 0 && D.grille.niveaux.length > 0]] },
    { id: 'reco', n: 'Recommandations et livrables', pts: 2, obs: 'Faisabilité des mesures, qualité du rapport et des tableaux.', ou: [['recos', 'Recommandations'], ['rapport', 'Rapport'], ['note', 'Note'], ['soutenance', 'Soutenance']],
      auto: [[`${D.recos.length} recommandations (minimum 5) avec responsable et KPI`, D.recos.length >= 5 && D.recos.every(r => r.resp && r.kpi)], ['Bénéfice, faisabilité et limites pour chacune', D.recos.every(r => r.benefice && r.faisabilite && r.limites)], ['Cinq livrables disponibles : rapport, registre (Excel), matrice RACI, note, présentation', ['rapport', 'registre', 'gouv', 'note', 'soutenance'].every(k => NAV.some(n => n[0] === k))]] },
    { id: 'sout', n: 'Soutenance individuelle', pts: 2, obs: 'Maîtrise personnelle, argumentation et réponses aux questions.', ou: [['entrainement', 'Entraînement'], ['soutenance', 'Soutenance']], manual: true, auto: [] }
  ];
}
const CHK = [
  ['prob', 'La problématique est formulée et traitée tout au long du dossier.', () => !!D.meta.problematique],
  ['reg', 'Le registre contient au moins huit risques spécifiques au cas et une justification des scores.', () => D.risks.length >= 8 && D.risks.every(r => r.justP && r.justG)],
  ['coso', 'Les cinq composantes COSO sont examinées avec des observations concrètes.', () => D.coso.length === 5 && D.coso.every(c => c.obs.length >= 3)],
  ['gouv', 'Les responsabilités des acteurs et les lacunes de gouvernance sont explicitées.', () => D.raci.rows.length > 0 && D.conflits.length > 0 && D.risks.every(r => r.lacune)],
  ['reco', 'Au moins cinq recommandations relient chacune un risque, une faiblesse et une action.', () => D.recos.length >= 5 && D.recos.every(r => r.risques.length && r.coso && r.action)],
  ['hyp', 'Les hypothèses fictives sont signalées et les sources externes sont citées.', () => D.hypotheses.length > 0 && D.meta.references.length > 0],
  ['dfd', 'Les deux membres savent expliquer toutes les parties et défendre les choix.', null]
];
V.grille = () => {
  const C = CRIT(), sa = LS.get('pm_grille', {}), ck = LS.get('pm_chk', {}), tot = C.reduce((a, c) => a + c.pts, 0);
  const done = C.filter(c => !c.manual && c.auto.every(x => x[1])), ptsAuto = done.reduce((a, c) => a + c.pts, 0);
  const tr = MEMBERS.map(m => ({ m, s: trStats(m) }));
  const saLab = ['Non évalué', 'À renforcer', 'Solide'];
  return hd('Grille de notation', 'Où le dossier répond à chaque critère du livret (20 points) et ce qu\'il reste à vérifier', '') + `
  <div class="note warn" style="margin-bottom:14px"><b>Ce que cette page est, et n'est pas.</b> Elle vérifie automatiquement ce qui peut l'être dans les données (présence, quantité, cohérence). Elle ne note ni la qualité de l'argumentation, ni la soutenance : ce n'est pas une prévision de votre note.</div>
  <div class="grid g3" style="margin-bottom:14px"><div class="card kpi"><div class="v">${done.length}/${C.length - 1}</div><div class="l">critères rédactionnels vérifiés automatiquement</div></div><div class="card kpi"><div class="v">${ptsAuto}/${tot - 2}</div><div class="l">points concernés par ces vérifications (hors soutenance)</div></div><div class="card kpi"><div class="v">${tr.map(x => x.s.pct + ' %').join(' · ')}</div><div class="l">fiches acquises : ${tr.map(x => esc(x.m.split(' ')[0])).join(' · ')}</div></div></div>
  ${C.map(c => { const okAll = c.auto.every(x => x[1]); return `<div class="card" style="margin-bottom:12px"><div class="row"><h3 style="margin:0">${c.n}</h3><span class="tag" style="background:var(--surface2);color:var(--ink2);border-color:var(--line)">${c.pts} pts</span>${c.manual ? '<span class="tag z-mid">À travailler à deux</span>' : okAll ? '<span class="tag z-lo">✔ Vérifié</span>' : '<span class="tag z-hi">À corriger</span>'}</div>
  <p class="small muted" style="margin:4px 0 8px">Attendu par le livret : ${esc(c.obs)}</p>${c.note ? `<p class="small" style="color:var(--mid)">${esc(c.note)}</p>` : ''}
  ${c.auto.length ? `<ul class="chk">${c.auto.map(x => `<li class="${x[1] ? 'ok' : 'ko'}"><b>${x[1] ? '✔' : '✘'}</b> ${esc(x[0])}</li>`).join('')}</ul>` : `<p class="small">Entraînez-vous à deux : ${tr.map(x => `<b>${esc(x.m)}</b> ${x.s.acq}/${x.s.n} fiches acquises`).join(' · ')}. Chaque membre répond seul, comme le jour de la soutenance.</p>`}
  <div class="row small" style="margin-top:6px"><span class="muted">Voir :</span>${c.ou.map(o => `<a href="#/${o[0]}" class="tag">${o[1]}</a>`).join(' ')}<span class="sp"></span><label>Mon avis <select data-sa="${c.id}">${saLab.map((l, i) => `<option value="${i}" ${(sa[c.id] || 0) === i ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div></div>`; }).join('')}
  <div class="card"><h3>Avant de remettre le projet</h3><p class="small muted">La check-list du livret. Les cases vérifiables se cochent seules ; la dernière est à cocher par vous.</p>
  ${CHK.map(([id, t, f]) => { const auto = f ? f() : null, on = f ? auto : !!ck[id]; return `<label class="plan-row" style="margin-bottom:6px"><input type="checkbox" ${f ? 'disabled' : `data-chk="${id}"`} ${on ? 'checked' : ''}><span>${esc(t)}${f ? ` <span class="small muted">(${on ? 'vérifié automatiquement' : 'à corriger'})</span>` : ` <span class="small muted">(à confirmer vous-mêmes${tr.every(x => x.s.pct >= 70) ? ' : vos fiches sont acquises à plus de 70 %' : ' : voir Entraînement'})</span>`}</span></label>`; }).join('')}</div>`;
};

/* ---------- Événements ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const tm = t.closest('[data-tm]'); if (tm) { TRN.m = +tm.dataset.tm; TRN.cur = null; TRN.rev = false; KEEP = true; return render(); }
  const md = t.closest('[data-tmode]'); if (md) { TRN.mode = md.dataset.tmode; if (TRN.mode === 'cards') { TRN.cur = null; TRN.rev = false; } KEEP = true; return render(); }
  const ct = t.closest('[data-tcat]'); if (ct) { TRN.cat = ct.dataset.tcat; TRN.cur = null; TRN.rev = false; KEEP = true; return render(); }
  if (t.closest('[data-reveal]')) { TRN.rev = true; KEEP = true; return render(); }
  if (t.closest('[data-skip]')) { TRN.cur = trPick(); TRN.rev = false; KEEP = true; return render(); }
  const rt = t.closest('[data-rate]'); if (rt) return rate(rt.dataset.rate);
  if (t.closest('[data-jstart]')) { jStart(); KEEP = true; return render(); }
  if (t.closest('[data-jend]')) { if (TRN.jury) { TRN.jury.done = true; clearInterval(TRN.iv); } KEEP = true; return render(); }
  if (t.closest('[data-treset]')) { LS.set(trKey(MEMBERS[TRN.m]), {}); TRN.cur = null; KEEP = true; return render(); }
});
function rate(level) {
  if (!TRN.cur) return; trRate(level);
  if (TRN.jury && !TRN.jury.done && TRN.mode === 'jury') { TRN.jury.i++; TRN.jury.q = TRN.jury.pool[TRN.jury.i % TRN.jury.pool.length]; TRN.cur = TRN.jury.q; } else TRN.cur = trPick();
  TRN.rev = false; KEEP = true; render();
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.tweak !== undefined) { TRN.weak = t.checked; TRN.cur = null; KEEP = true; render(); }
  if (t.dataset.sa) { const v = LS.get('pm_grille', {}); v[t.dataset.sa] = +t.value; LS.set('pm_grille', v); }
  if (t.dataset.chk) { const v = LS.get('pm_chk', {}); v[t.dataset.chk] = t.checked; LS.set('pm_chk', v); }
});
document.addEventListener('keydown', e => {
  if (cur !== 'entrainement' || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName) || e.ctrlKey || e.metaKey) return;
  if ($('#pal') && $('#pal').classList.contains('on')) return;
  if (e.key === ' ' && !TRN.rev && TRN.cur) { e.preventDefault(); TRN.rev = true; KEEP = true; render(); }
  else if (TRN.rev && ['1', '2', '3'].includes(e.key)) rate(['non', 'moyen', 'oui'][+e.key - 1]);
});
