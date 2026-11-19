/* Vues du site */
const V = {};
const hd = (t, sub, extra = '') => `<div class="top"><div><h1>${t}</h1><p class="sub">${sub}</p></div><div class="tools">${extra}</div></div>`;
const kpi = (v, l, n, col) => `<div class="card kpi"><div class="v" ${col ? `style="color:var(--${col})"` : ''}>${v}</div><div class="l">${l}</div>${n ? `<div class="n">${n}</div>` : ''}</div>`;
const incState = () => { try { const s = JSON.parse(localStorage.getItem('pm_inc') || 'null'); if (s) return s; } catch (e) { } return JSON.parse(JSON.stringify(D.incidents)); };
const incSave = l => { try { localStorage.setItem('pm_inc', JSON.stringify(l)); } catch (e) { } };
let INC = incState();
const critZ = c => ({ C1: 'hi', C2: 'hi', C3: 'mid', C4: 'lo' }[c]);

V.dash = () => {
  const rk = ranked().filter(r => !S.cat || r.cat === S.cat), cnt = z => rk.filter(r => zone(sc(r).s) === z).length;
  const avg = (rk.reduce((a, r) => a + sc(r).s, 0) / rk.length).toFixed(1);
  const open = INC.filter(i => i.statut !== 'Clôturé').length, c12 = INC.filter(i => i.statut !== 'Clôturé' && ['C1', 'C2'].includes(i.crit)).length;
  const mat = (D.coso.reduce((a, c) => a + c.mat, 0) / 5).toFixed(1);
  return hd('Tableau de bord', `PayMaroc — ${D.meta.problematique}`) + `
  ${heroBlock()}
  <div class="note" style="margin-bottom:14px"><b>Lecture :</b> ${S.mode === 'now' ? 'cotation actuelle' : 'cotation cible après actions (hypothèse)'} · ${D.meta.regleCotation}</div>
  <div class="grid g4" style="margin-bottom:14px">
    ${kpi(rk.length, S.cat ? 'risques ' + D.cats[S.cat].toLowerCase() + 's' : 'risques au registre', '3 catégories · ' + D.risks.filter(r => r.basis === 'Fait du cas').length + ' faits du cas, ' + D.risks.filter(r => r.basis !== 'Fait du cas').length + ' inférences')}
    ${kpi(cnt('hi'), 'risques élevés (15–25)', cnt('mid') + ' modérés · ' + cnt('lo') + ' faibles', 'hi')}
    ${kpi(avg, 'score P × G moyen', 'indicateur de lecture, pas une perte attendue')}
    ${kpi(mat + ' / 4', 'maturité COSO moyenne', 'cible ' + (D.coso.reduce((a, c) => a + c.cible, 0) / 5).toFixed(1) + ' (hypothèse)', 'mid')}
  </div>
  <div class="grid g21" style="margin-bottom:14px">
    <div class="card"><div class="row" style="margin-bottom:8px"><h3 style="margin:0">Cartographie qualitative P × G</h3><span class="sp"></span><div class="seg" role="group" aria-label="Filtrer par catégorie"><button data-cat="" aria-pressed="${!S.cat}">Toutes</button>${Object.keys(D.cats).map(k => `<button data-cat="${k}" aria-pressed="${S.cat === k}">${D.cats[k]}</button>`).join('')}</div></div>${heatmap(r => !S.cat || r.cat === S.cat)}<p class="small muted" style="margin:8px 0 0">Cliquer un risque pour afficher cause → événement → conséquences. Les cases portent aussi le score et le niveau (couleur + libellé).</p></div>
    <div class="card"><h3>Classement des risques</h3>${bars(rk)}<p class="small muted" style="margin:8px 0 0">${D.meta.departage}</p></div>
  </div>
  <div class="grid g3" style="margin-bottom:14px">
    <div class="card"><h3>Typologie</h3>${donut()}<p class="small muted" style="margin:8px 0 0">Opérationnel · Financier · Conformité, selon la nature de l'impact principal.</p></div>
    <div class="card"><h3>Maturité COSO</h3>${radar(280)}</div>
    <div class="card"><h3>Incidents (exemples fictifs)</h3><div class="grid g2" style="margin-bottom:8px">${kpi(open, 'ouverts', '', '')}${kpi(c12, 'C1/C2 non clos', '', c12 ? 'hi' : 'lo')}</div><p class="small">Suivi complet, classification et déclaration dans l'onglet <a href="#/incidents">Incidents</a>.</p><p class="small">${hyp('H13')}</p></div>
  </div>
  <div class="card" style="margin-bottom:14px"><h3>Les quatre priorités et leur chaîne de décision</h3>
  ${topN(4).map(r => { const rc = recosOf(r.id).sort((a, b) => a.prio - b.prio)[0]; return `<div style="margin:12px 0"><div class="row" style="margin-bottom:6px">${chip(r)} <b>${esc(r.titre)}</b> ${tagZ(sc(r).s)} <span class="muted small">P${sc(r).p} × G${sc(r).g} = ${sc(r).s}</span></div>${chainFor(rc, r.id)}</div>`; }).join('')}
  </div>
  <div class="card"><h3>Compromis rapidité commerciale / risque acceptable / solidité des contrôles</h3>${scenarioChart()}</div>`;
};
function scenarioChart(note = true) {
  const dims = [['rap', 'Rapidité commerciale', 'var(--accent)'], ['risque', 'Risque résiduel', 'var(--hi)'], ['ctrl', 'Solidité des contrôles', 'var(--brand)']];
  return `<div class="grid g3">${D.scenarios.map(s => `<div class="card ${s.id === 'C' ? '' : ''}" style="${s.id === 'C' ? 'border:2px solid var(--brand)' : ''}"><h4>${s.id === 'C' ? '★ ' : ''}${esc(s.nom)}</h4>${dims.map(([k, l, c]) => `<div style="margin:6px 0"><div class="row small"><span>${l}</span><span class="sp"></span><b>${s[k]}/5</b></div><div style="height:9px;background:var(--surface2);border-radius:5px"><div style="height:100%;width:${s[k] * 20}%;background:${c};border-radius:5px"></div></div></div>`).join('')}<p class="small muted" style="margin:8px 0 0">${esc(s.txt)}</p></div>`).join('')}</div>${note ? `<p class="small muted" style="margin:8px 0 0">Notes qualitatives sur 5 attribuées par le groupe ${hyp('H12')} — elles illustrent l'arbitrage, elles ne mesurent rien.</p>` : ''}`;
}

V.cadrage = () => hd('Cadrage du scénario', 'Faits du cas, hypothèses, périmètre méthodologique') + `
<div class="grid g2" style="margin-bottom:14px">
 <div class="card"><h3>PayMaroc (cas fictif)</h3><p>Fintech de paiement proposant un portefeuille électronique en forte croissance. Elle enregistre davantage d'opérations annulées, des interruptions ponctuelles de l'application et dépend d'un prestataire technologique ; les incidents ne sont pas documentés selon une procédure commune.</p>
 <div class="note"><b>Problématique :</b> ${D.meta.problematique}</div></div>
 <div class="card"><h3>Équipe</h3><p><b>Groupe ${D.meta.groupe}</b> · ${D.meta.sujet} · ${D.meta.filiere}<br>${D.meta.membres.join(' · ')}<br>${D.meta.ecole} · ${D.meta.professeur} · ${D.meta.annee}</p>
 <div class="note warn"><b>Hors périmètre :</b> ${D.meta.horsPerimetre}</div></div>
</div>
<div class="card" style="margin-bottom:14px"><h3>Les six indices de départ — tous exploités</h3><div class="tw"><table><thead><tr><th>#</th><th>Indice du cas</th><th>Risques reliés</th></tr></thead><tbody>${D.indices.map(i => `<tr><td><b>${i.id}</b></td><td>${esc(i.txt)}</td><td>${D.risks.filter(r => r.indices.includes(i.id)).map(chip).join(' ')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="grid g2" style="margin-bottom:14px">
 <div class="card"><h3>Barème qualitatif</h3><p><b>P</b> : 1 très peu probable → 5 très probable, justifié par un indice du cas.<br><b>G</b> : 1 impact limité → 5 impact très important (financier, opérationnel, réputationnel).<br><b>Priorité indicative</b> : ${D.meta.bareme}.</p><div class="note">${D.meta.regleCotation}</div>
 <p class="small" style="margin-top:8px"><span class="tag fact">Fait du cas</span> la cotation s'appuie sur un indice fourni. <span class="tag infer">Inférence</span> aucun indice direct : risque déduit des lacunes, probabilité cotée prudemment.</p></div>
 <div class="card"><h3>Typologie retenue</h3><p><b>Opérationnel</b> : défaillance de processus, de systèmes, de personnes ou de tiers technologiques (R01, R02, R04, R05, R06, R07).<br><b>Financier</b> : pertes ou tensions sur les fonds, hors modèles quantitatifs (R03, R08, R11).<br><b>Conformité</b> : respect des exigences applicables à l'activité de paiement (R09, R10).</p><p class="small muted">Un risque est classé selon la nature de son impact principal ; beaucoup ont des effets croisés.</p></div>
</div>
<div class="card"><h3>Liste des hypothèses fictives</h3><p class="small muted">Toute information complémentaire (volumes, délais, effectifs, SLA) est ici déclarée. Elles sont citées par leur numéro dans le registre et le rapport.</p><div class="tw"><table><thead><tr><th>N°</th><th>Hypothèse</th></tr></thead><tbody>${D.hypotheses.map(h => `<tr><td>${hyp(h.id)}</td><td>${esc(h.txt)}</td></tr>`).join('')}</tbody></table></div></div>`;

V.registre = () => {
  const rows = ranked().filter(r => (!V._cat || r.cat === V._cat) && (!V._z || zone(sc(r).s) === V._z));
  const f = (k, v, l) => `<button class="btn" data-f="${k}:${v}" aria-pressed="${(k === 'cat' ? V._cat : V._z) === v}">${l}</button>`;
  return hd('Registre des risques', `${D.risks.length} risques · cause → événement → conséquences · cotation justifiée · contrôle associé`, `<a class="btn pri" href="downloads/Livrable2_Registre_Risques_PayMaroc_G5.xlsx" download>⬇ Classeur Excel</a><button class="btn" id="csv-reg">⬇ CSV</button>`) + `
  <div class="row" style="margin-bottom:10px"><b class="small">Catégorie</b>${f('cat', '', 'Toutes')}${Object.keys(D.cats).map(k => f('cat', k, D.cats[k])).join('')}<span class="sp"></span><b class="small">Niveau</b>${f('z', '', 'Tous')}${['hi', 'mid', 'lo'].map(z => f('z', z, ZL[z])).join('')}</div>
  <div class="tw"><table><thead><tr><th>Rang</th><th>ID</th><th>Risque</th><th>Catégorie</th><th>P</th><th>G</th><th>P×G</th><th>Niveau</th><th>Pilote</th><th>COSO</th><th>Reco</th>${S.tr ? '<th>Sources</th>' : ''}</tr></thead><tbody>
  ${rows.map(r => { const c = sc(r); return `<tr style="cursor:pointer" data-risk="${r.id}"><td><b>${rankOf(r.id)}</b></td><td>${chip(r)}</td><td><b>${esc(r.titre)}</b><div class="small muted">${esc(r.evenement)}</div></td><td>${D.cats[r.cat]}</td><td>${c.p}</td><td>${c.g}</td><td class="score" style="color:var(--${zone(c.s)})">${c.s}</td><td>${tagZ(c.s)}</td><td>${esc(A(r.owner).nom)}</td><td class="small">${CK[r.coso]}</td><td>${recosOf(r.id).map(x => x.id).join(', ')}</td>${S.tr ? `<td class="small">${basisTag(r)}<br>Indices ${r.indices.join(', ')}${hrefs(r).length ? '<br>' + hrefs(r).map(h => hyp(h)).join(' ') : ''}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>
  <p class="small muted" style="margin-top:8px">Cliquer une ligne : cause, événement, conséquences, justification des notes, mesure de contrôle. ${D.meta.regleCotation}</p>`;
};

V.carto = () => hd('Cartographie P × G', 'Classement argumenté des risques — modifier une note met à jour tout le site', `<button class="btn" id="reset-ov">↺ Réinitialiser les notes</button>`) + `
<div class="grid g21" style="margin-bottom:14px"><div class="card"><h3>Matrice de cotation ${S.mode === 'target' ? '(cible)' : '(actuelle)'}</h3><div id="hm-wrap">${heatmap()}</div></div><div class="card"><h3>Les trois zones</h3>
<p><span class="tag z-hi">▲ Élevé</span> 15–25 : action immédiate, suivi par la Direction.</p><p><span class="tag z-mid">◆ Modéré</span> 6–12 : plan d'action et suivi par le pilote du risque.</p><p><span class="tag z-lo">● Faible</span> 1–5 : surveillance périodique.</p><div class="note">${D.meta.regleCotation}</div>
<h3 style="margin-top:14px">Lecture des priorités</h3><p class="small" id="top4">${topN(4).map(r => `${chip(r)} ${esc(r.titre)} (${sc(r).s})`).join('<br>')}</p></div></div>
<div class="card"><h3>Simulateur de cotation</h3>${S.mode === 'target' ? '<p class="note warn">Passer en « Cotation actuelle » (en-haut) pour modifier P et G.</p>' : '<p class="small muted">Ajuster P et G (1–5) pour tester une autre appréciation. La justification de chaque note reste visible ; toute modification est signalée.</p>'}
${ranked().map(r => { const c = sc(r); return `<div class="slrow"><span>${chip(r)}</span><span class="small"><b>${esc(r.titre)}</b></span><label class="f sl2">P = ${c.p}<input type="range" min="1" max="5" value="${c.p}" data-sl="${r.id}:p" ${S.mode === 'target' ? 'disabled' : ''}></label><label class="f sl2">G = ${c.g}<input type="range" min="1" max="5" value="${c.g}" data-sl="${r.id}:g" ${S.mode === 'target' ? 'disabled' : ''}></label><span class="score" style="color:var(--${zone(c.s)})">${c.s}</span></div>`; }).join('')}</div>`;

V.acteurs = () => hd('Parties prenantes et carte acteurs–risques', 'Qui pilote, qui contribue, qui subit — et où les objectifs divergent') + `
<div class="card" style="margin-bottom:14px"><h3>Carte acteurs–risques</h3>${actorMap(V._hl)}</div>
<div class="card" style="margin-bottom:14px"><h3>Matrice acteurs × risques</h3><div class="tw"><table><thead><tr><th>Acteur</th>${ranked().map(r => `<th>${r.id}</th>`).join('')}</tr></thead><tbody>${D.actors.map(a => `<tr><td><b>${esc(a.nom)}</b></td>${ranked().map(r => { const v = r.owner === a.id ? 'P' : r.sources.includes(a.id) ? 'S' : r.impacted.includes(a.id) ? 'I' : ''; return `<td style="text-align:center">${v ? `<span class="rc ${v === 'P' ? 'rc-A' : v === 'S' ? 'z-hi' : 'rc-C'}">${v}</span>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted" style="margin-top:6px">P pilote · S source (contribue à la cause) · I impacté.</p></div>
<div class="card" style="margin-bottom:14px"><h3>Parties prenantes internes et externes</h3><div class="tw"><table><thead><tr><th>Partie prenante</th><th>Type</th><th>Rôle</th><th>Objectif</th><th>Pouvoir</th><th>Intérêt</th></tr></thead><tbody>${D.actors.map(a => `<tr><td><b>${esc(a.nom)}</b></td><td>${a.type === 'int' ? 'Interne' : 'Externe'}</td><td>${esc(a.role)}</td><td>${esc(a.objectif)}</td><td>${a.pouvoir}</td><td>${a.interet}</td></tr>`).join('')}</tbody></table></div><p class="small muted" style="margin-top:6px">Pouvoir et intérêt : appréciation qualitative du groupe ${hyp('H12')}.</p></div>
<div class="card"><h3>Conflits d'objectifs</h3>${D.conflits.map(k => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line);align-items:flex-start"><b>${k.id}</b><div style="flex:1 1 300px"><b>${k.entre.map(x => esc(A(x).nom)).join(' ↔ ')}</b><br>${esc(k.txt)}</div><div>${k.risques.map(x => chip(R(x))).join(' ')}</div></div>`).join('')}</div>`;

V.gouv = () => hd('Gouvernance et responsabilités', 'Schémas actuel / cible et matrice RACI') + `
<div class="card" style="margin-bottom:14px"><div class="row" style="margin-bottom:10px"><h3 style="margin:0">Schéma de gouvernance</h3><span class="sp"></span><div class="seg" role="group"><button data-gv="now" aria-pressed="${V._gv !== 'target'}">Actuelle</button><button data-gv="target" aria-pressed="${V._gv === 'target'}">Cible</button></div></div>${govSvg(V._gv === 'target' ? 'target' : 'now')}
<div class="legend">${V._gv === 'target' ? '<span><i style="border-color:var(--brand)"></i>Flux de décision / alerte organisé</span><span class="muted">Encadrés verts : composants ajoutés (comité, gate, registre).</span>' : '<span><i style="border-color:var(--hi)"></i>Flux problématique</span><span class="muted">Contrôle interne isolé du circuit de décision ; support sans mandat de classification ; aucune instance d\'arbitrage.</span>'}</div>
${V._gv === 'target' ? `<p class="small" style="margin-top:8px"><b>Principes :</b> l'opérationnel porte le risque ; le Contrôle interne donne un avis indépendant et tient le suivi ; la Direction arbitre le compromis dans le comité mensuel ; le prestataire est piloté par contrat (SLA) et non subi.</p>` : `<p class="small" style="margin-top:8px"><b>Constat :</b> la pression commerciale arrive directement sur Tech (indice 6) sans validation, les incidents arrivent au Support sans critère (indice 4), et le Contrôle interne n'a pas de place dans les décisions (indice 5).</p>`}</div>
<div class="card"><div class="row" style="margin-bottom:10px"><h3 style="margin:0">Matrice RACI cible</h3><span class="sp"></span><button class="btn" id="csv-raci">⬇ CSV</button></div>${raciTable(true)}<p class="small" style="margin-top:6px" id="raci-check"></p></div>`;

V.coso = () => hd('Diagnostic COSO 2013', 'Cinq composantes lues sous l\'angle de l\'alerte, de l\'information et du suivi') + `
<div class="grid g21" style="margin-bottom:14px"><div class="card"><h3>Maturité par composante</h3>${radar(320)}<p class="small muted">Échelle et cibles : appréciation qualitative du groupe ${hyp('H12')}.</p></div>
<div class="card"><h3>Synthèse</h3><div class="tw"><table><thead><tr><th>Composante</th><th>Actuelle</th><th>Cible</th></tr></thead><tbody>${D.coso.map(c => `<tr><td>${CK[c.k]}</td><td><b>${c.mat}/4</b></td><td>${c.cible}/4</td></tr>`).join('')}</tbody></table></div><div class="note" style="margin-top:10px">Les deux composantes les plus faibles — <b>Information et communication</b> et <b>Pilotage et surveillance</b> — sont celles par lesquelles une alerte devrait circuler et être suivie.</div></div></div>
${D.coso.map((c, i) => `<div class="card" style="margin-bottom:12px"><div class="row"><h3 style="margin:0">${i + 1}. ${CK[c.k]}</h3><span class="tag ${c.mat <= 1 ? 'z-hi' : 'z-mid'}">Maturité ${c.mat}/4</span><span class="muted small">${c.principes}</span></div><p class="muted" style="margin:6px 0"><i>${c.q}</i></p>
<div class="grid g2"><div><div class="sec" style="margin-top:4px">Observations concrètes</div><ul>${c.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul><div class="note warn"><b>Lacune :</b> ${esc(c.lacune)}</div></div>
<div><div class="sec" style="margin-top:4px">Angle alerte · information · suivi</div><p class="small"><b>Alerte :</b> ${esc(c.alerte)}<br><b>Information :</b> ${esc(c.info)}<br><b>Suivi :</b> ${esc(c.suivi)}</p><p class="small"><b>Risques reliés :</b> ${D.risks.filter(r => r.coso === c.k).map(chip).join(' ')}<br><b>Recommandations :</b> ${D.recos.filter(x => x.coso === c.k).map(x => `<a href="#/recos">${x.id}</a>`).join(', ')}</p></div></div></div>`).join('')}`;

V.incidents = () => {
  const l = INC; const w = l.filter(i => i.pec > 0); const avg = w.length ? Math.round(w.reduce((a, i) => a + i.pec, 0) / w.length) : 0;
  const lv = D.grille.niveaux;
  const opts = (arr, sel) => arr.map(x => `<option ${x === sel ? 'selected' : ''}>${x}</option>`).join('');
  return hd('Dispositif d\'incidents', 'Circuit de déclaration, classification, escalade et suivi') + `
<div class="card" style="margin-bottom:14px"><h3>Circuit de remontée des alertes</h3><div class="steps">${D.grille.etapes.map(e => `<div class="s"><i>${e.n}</i> <b>${e.t}</b>${esc(e.d)}</div>`).join('')}</div>
<div class="tw" style="margin-top:12px"><table><thead><tr><th>Niveau</th><th>Délai cible ${hyp('H11')}</th><th>Escalade</th><th>Informés</th></tr></thead><tbody>${lv.map(n => `<tr><td><span class="tag z-${critZ(n.c)}">${n.c} ${n.nom}</span></td><td>${n.delai}</td><td>${n.escalade}</td><td>${n.qui.map(x => esc(A(x).nom)).join(', ')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="grid g2" style="margin-bottom:14px"><div class="card"><h3>Simulateur de classification</h3><p class="small muted">Règle : la criticité est le niveau le plus élevé des quatre dimensions (maximum, pas somme).</p>
${D.grille.dims.map(d => `<label class="f" style="margin-bottom:8px">${d.nom}<select data-dim="${d.k}">${d.niv.map((n, i) => `<option value="${i}">${i} — ${n}</option>`).join('')}</select></label>`).join('')}
<div class="res" id="sim-res"></div></div>
<div class="card"><h3>Déclarer un incident</h3><div class="grid g2"><label class="f" style="grid-column:1/-1">Description<input type="text" id="n-desc" placeholder="Que s'est-il passé ?"></label>
<label class="f">Source<select id="n-src">${opts(['Client', 'Supervision', 'Équipe Tech', 'Support', 'Prestataire', 'Contrôle interne'])}</select></label>
<label class="f">Service<input type="text" id="n-svc" placeholder="ex. Transferts"></label>
<label class="f">Risque lié<select id="n-risk">${D.risks.map(r => `<option value="${r.id}">${r.id} — ${esc(r.titre.slice(0, 38))}</option>`).join('')}</select></label>
<label class="f">Responsable<select id="n-resp">${D.actors.filter(a => a.type === 'int').map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></label>
<div style="grid-column:1/-1" class="small">Criticité proposée par le simulateur : <b id="n-crit">C4</b></div></div><button class="btn pri" id="n-add" style="margin-top:10px">Ajouter au tableau de suivi</button><p class="small muted">Enregistré localement dans votre navigateur.</p></div></div>
<div class="grid g4" style="margin-bottom:12px">${kpi(l.length, 'incidents suivis', '')}${kpi(l.filter(i => i.statut !== 'Clôturé').length, 'non clos', '')}${kpi(l.filter(i => i.statut !== 'Clôturé' && ['C1', 'C2'].includes(i.crit)).length, 'C1/C2 non clos', '', 'hi')}${kpi(avg + ' min', 'prise en charge moyenne', 'incidents pris en charge')}</div>
<div class="card"><div class="row" style="margin-bottom:8px"><h3 style="margin:0">Tableau de suivi des incidents</h3>${hyp('H13')}<span class="sp"></span><button class="btn" id="csv-inc">⬇ CSV</button><button class="btn" id="inc-reset">↺ Exemples</button></div>
<div class="tw"><table><thead><tr><th>ID</th><th>Date</th><th>Source</th><th>Description</th><th>Service</th><th>Crit.</th><th>Risque</th><th>Resp.</th><th>Statut</th><th>PEC (min)</th><th>Cause racine</th><th>Action</th><th>Échéance</th></tr></thead><tbody>
${l.map((i, k) => `<tr><td><b>${i.id}</b></td><td class="small">${i.date}</td><td>${i.source}</td><td>${esc(i.desc)}</td><td>${esc(i.service)}</td><td><span class="tag z-${critZ(i.crit)}">${i.crit}</span></td><td>${chip(R(i.risque))}</td><td>${esc(A(i.resp).nom)}</td><td><select data-st="${k}">${opts(['Ouvert', 'En cours', 'Escaladé', 'Clôturé'], i.statut)}</select></td><td>${i.pec}</td><td class="small">${esc(i.cause)}</td><td class="small">${esc(i.action)}</td><td class="small">${i.ech}</td></tr>`).join('')}</tbody></table></div></div>`;
};

V.recos = () => hd('Recommandations priorisées', 'Risque → lacune COSO → action → responsable → KPI', `<button class="btn" id="csv-rec">⬇ CSV</button>`) + planCard() + `
<div class="card" style="margin-bottom:14px"><h3>Calendrier de mise en œuvre ${hyp('H11')}</h3><div class="grid g3">${['Vague 1 (0–30 jours)', 'Vague 2 (30–90 jours)', 'Vague 3 (90–180 jours)'].map(v => `<div style="border-top:3px solid var(--brand);padding-top:6px"><b>${v}</b>${D.recos.filter(r => r.vague === v).sort((a, b) => a.prio - b.prio).map(r => `<div class="small" style="margin:4px 0"><b>${r.id}</b> (priorité ${r.prio}) ${esc(r.titre)}</div>`).join('')}</div>`).join('')}</div></div>
${[...D.recos].sort((a, b) => a.prio - b.prio).map(rc => `<div class="card" style="margin-bottom:12px"><div class="row"><span class="tag z-${rc.prio <= 3 ? 'hi' : 'mid'}">Priorité ${rc.prio}</span><h3 style="margin:0">${rc.id} — ${esc(rc.titre)}</h3></div>${chainFor(rc)}
<div class="grid g3" style="margin-top:10px"><div class="small"><b>Action détaillée</b><br>${esc(rc.action)}</div><div class="small"><b>Bénéfice attendu</b><br>${esc(rc.benefice)}</div><div class="small"><b>Faisabilité</b> : ${esc(rc.faisabilite)}<br><b>Limites</b> : ${esc(rc.limites)}</div></div>
<p class="small muted" style="margin:8px 0 0">Effet visé sur la cotation ${hyp('H12')} : ${rc.risques.map(id => { const r = R(id), b = base(r), t = r.target; return `${id} ${b.s} → ${t.p * t.g}`; }).join(' · ')}</p></div>`).join('')}
<div class="card" style="margin-bottom:14px"><h3>Arbitrage rapidité / risque / contrôle</h3>${scenarioChart()}
<div class="grid g2" style="margin-top:12px"><div><h4>Appétence qualitative au risque proposée</h4><div class="tw"><table><thead><tr><th>Domaine</th><th>Appétence</th><th>Règle</th></tr></thead><tbody>${D.appetence.map(a => `<tr><td>${a.domaine}</td><td><b>${a.niveau}</b></td><td class="small">${a.regle}</td></tr>`).join('')}</tbody></table></div></div>
<div><h4>Gate de mise en production à deux voies</h4><div class="tw"><table><thead><tr><th>Voie</th><th>Quand</th><th>Contrôle</th></tr></thead><tbody><tr><td><b>Rapide</b></td><td>Changement mineur, hors flux de paiement</td><td>Checklist, retour arrière prévu, validation Tech</td></tr><tr><td><b>Standard</b></td><td>Tout changement touchant paiement, fonds ou conformité</td><td>Avis risque/conformité (Contrôle interne), arbitrage Direction si désaccord</td></tr></tbody></table></div></div></div></div>`;

V.soutenance = () => hd('Soutenance', '12 minutes à deux voix + 8 minutes de questions', `<button class="btn pri" id="open-deck">▶ Lancer la présentation (12 diapositives)</button><a class="btn" href="downloads/Livrable5_Presentation_PayMaroc_G5.pptx" download>⬇ PowerPoint (.pptx)</a>`) + `
<div class="grid g2" style="margin-bottom:14px"><div class="card"><h3>Plan de la présentation</h3><div class="tw"><table><thead><tr><th>#</th><th>Diapositive</th><th>Qui</th><th>Durée</th></tr></thead><tbody>${SLIDES.map((s, i) => `<tr><td>${i + 1}</td><td>${s.t}</td><td>${s.who}</td><td>${s.sec} s</td></tr>`).join('')}</tbody></table></div><p class="small muted" style="margin-top:6px">Total : ${Math.round(SLIDES.reduce((a, s) => a + s.sec, 0) / 60 * 10) / 10} min. Les deux membres participent à toutes les étapes et doivent pouvoir défendre l'ensemble.</p></div>
<div class="card"><h3>Conseils de défense</h3><ul><li>Toujours revenir au fil : risque → lacune COSO → action → KPI.</li><li>Distinguer fait du cas, inférence et hypothèse.</li><li>Rappeler que P × G classe, il ne mesure pas.</li><li>Assumer les limites (R01 reste élevé après actions).</li></ul></div></div>
<div class="card"><h3>Questions probables du jury</h3>${D.jury.map(j => `<details><summary>${esc(j.q)}</summary><p>${esc(j.r)}</p></details>`).join('')}</div>`;

V.qualite = () => {
  const c = QA();
  return hd('Contrôle qualité', 'Vérifications automatiques calculées sur les données du site (source unique)') + `<div class="card">${c.map(x => `<div class="qarow"><b class="${x.ok ? 'ok' : 'ko'}">${x.ok ? '✔' : '✘'}</b><div><b>${x.t}</b><div class="small muted">${x.d}</div></div></div>`).join('')}</div>
  <p class="small muted" style="margin-top:10px">Les cinq livrables (rapport, classeur Excel, matrice, note, présentation) sont générés à partir des mêmes données : mêmes risques prioritaires, mêmes lacunes, mêmes décisions.</p>`;
};
function QA() {
  const out = []; const add = (t, ok, d) => out.push({ t, ok, d });
  add('Au moins 8 risques, avec cause ≠ événement ≠ conséquences', D.risks.length >= 8 && D.risks.every(r => r.cause && r.evenement && r.cause !== r.evenement && r.cons.fin && r.cons.op && r.cons.rep), `${D.risks.length} risques ; chacun a une cause, un événement et trois conséquences (financière, opérationnelle, réputationnelle).`);
  const txt = JSON.stringify({ ...D, meta: { ...D.meta, horsPerimetre: '' } }); const bad = txt.match(/\bVaR\b|\bPD\b|\bLGD\b|\bALM\b|AMMC|Bâle|solvabilité|dérivés/gi);
  add('Aucune méthode hors périmètre', !bad, bad ? 'Termes détectés : ' + [...new Set(bad)].join(', ') : 'Aucun terme exclu dans les données (VaR, PD/LGD, ALM, AMMC…) hors la mention de cadrage.');
  add('Cinq composantes COSO documentées avec observations concrètes', D.coso.length === 5 && D.coso.every(c => c.obs.length >= 3 && c.lacune), 'Chaque composante : question, ≥ 3 observations liées au cas, lacune, angle alerte/information/suivi.');
  add('Au moins 5 recommandations Risque → COSO → Action → Responsable → KPI', D.recos.length >= 5 && D.recos.every(r => r.risques.length && r.coso && r.action && r.resp && r.kpi), `${D.recos.length} recommandations complètes.`);
  const refs = [...txt.matchAll(/H(\d\d)/g)].map(m => 'H' + m[1]); const unk = refs.filter(h => !D.hypotheses.some(x => x.id === h));
  add('Hypothèses explicitement signalées', D.hypotheses.length > 0 && !unk.length, `${D.hypotheses.length} hypothèses déclarées ; chaque renvoi (H01…) pointe vers une hypothèse existante.`);
  const ids = D.risks.map(r => r.id), cov = ids.filter(i => recosOf(i).length);
  add('Chaque risque est relié à une lacune COSO et à au moins une recommandation', cov.length === ids.length && D.risks.every(r => r.lacune && r.coso), `${cov.length}/${ids.length} risques couverts.`);
  add('Les six indices du cas sont tous exploités', D.indices.every(i => D.risks.some(r => r.indices.includes(i.id))), 'Chaque indice est relié à au moins un risque.');
  const one = D.raci.rows.every(r => r.v.filter(x => x.startsWith('A')).length === 1 && r.v.some(x => x.includes('R')));
  add('RACI : un seul « A » et au moins un « R » par ligne', one, `${D.raci.rows.length} activités contrôlées.`);
  const hi = D.risks.filter(r => base(r).s >= 15);
  add('Chaque risque élevé a une action prioritaire (vague 1 ou 2)', hi.every(r => recosOf(r.id).some(x => x.prio <= 4)), 'Risques élevés : ' + hi.map(r => r.id).join(', ') + '.');
  add('Règle P × G rappelée comme règle pédagogique', /pédagogique/.test(D.meta.regleCotation), D.meta.regleCotation);
  return out;
}
