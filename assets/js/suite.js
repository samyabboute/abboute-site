/* Exemple d'outil de gestion développé par ABBOUTE — interactive (CRM, facturation, comptabilité, tableau de bord) */
(function(){
'use strict';
var app = document.getElementById('app');
if(!app) return;
var view = document.getElementById('view');
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

var COUNTRIES = {
  PL:{name:'Pologne', cur:'PLN', rate:4.24, vat:23, fmt:'KSeF', std:'Loi comptable polonaise', locale:'pl-PL'},
  FR:{name:'France', cur:'EUR', rate:1, vat:20, fmt:'Factur-X', std:'Plan comptable général', locale:'fr-FR'},
  DE:{name:'Allemagne', cur:'EUR', rate:1, vat:19, fmt:'XRechnung', std:'HGB', locale:'de-DE'},
  DZ:{name:'Algérie', cur:'DZD', rate:151.2, vat:19, fmt:'PDF signé', std:'SCF', locale:'fr-DZ'}
};
var STAGES = [
  {id:'lead', name:'Prospect', p:0.1},
  {id:'qual', name:'Qualifié', p:0.3},
  {id:'prop', name:'Proposition', p:0.6},
  {id:'nego', name:'Négociation', p:0.8},
  {id:'won',  name:'Gagné', p:1}
];
var STATUS = {draft:{l:'Brouillon',c:'st-draft'}, sent:{l:'Envoyée',c:'st-sent'}, paid:{l:'Payée',c:'st-paid'}};

function seed(){
  return {
    country:'PL', page:'dash', sel:null, seq:45, highlight:null, adding:false,
    deals:[
      {id:1, client:'Vistula Logistics', v:18000, s:2},
      {id:2, client:'Nordbau Projekt', v:42000, s:3},
      {id:3, client:'Sahel Agro', v:9500, s:1},
      {id:4, client:'Atlas Distribution', v:27000, s:0},
      {id:5, client:'Baltyk Media', v:12400, s:2},
      {id:6, client:'Medina Retail', v:6800, s:0},
      {id:7, client:'Oranis Matériaux', v:54000, s:3},
      {id:8, client:'Kraków Dental', v:7600, s:1}
    ],
    invoices:[
      {num:'FA-2026-041', client:'Lumen Conseil', ht:14200, st:'paid', date:'14/10/2026', log:['sent','paid']},
      {num:'FA-2026-042', client:'Delta Transport', ht:8900, st:'paid', date:'27/10/2026', log:['sent','paid']},
      {num:'FA-2026-043', client:'Kasbah Hôtels', ht:21500, st:'sent', date:'05/11/2026', log:['sent']},
      {num:'FA-2026-044', client:'Polar Tech', ht:6300, st:'sent', date:'12/11/2026', log:['sent']}
    ],
    months:[
      {m:'juin', v:38200},{m:'juil.', v:44100},{m:'août', v:30800},
      {m:'sept.', v:52300},{m:'oct.', v:47600},{m:'nov.', v:18400}
    ],
    activity:[
      {t:'09:12', txt:'Facture FA-2026-044 envoyée à Polar Tech'},
      {t:'08:40', txt:'Nordbau Projekt passé en négociation'},
      {t:'hier', txt:'Paiement reçu de Delta Transport'}
    ]
  };
}
var S = seed();
var nextId = 9;

/* ---------- Formats ---------- */
function C(){ return COUNTRIES[S.country]; }
function money(eur, opts){
  var c = C();
  return new Intl.NumberFormat('fr-FR', {style:'currency', currency:c.cur, maximumFractionDigits: (opts && opts.dec) ? 2 : 0, minimumFractionDigits: (opts && opts.dec) ? 2 : 0}).format(eur * c.rate);
}
function compact(eur){
  var c = C();
  return new Intl.NumberFormat('fr-FR', {notation:'compact', maximumFractionDigits:1}).format(eur * c.rate);
}
function esc(s){ return String(s).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
function norm(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
function now(){ var d = new Date(); return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }
function today(){ return new Date().toLocaleDateString('fr-FR'); }
function vat(ht){ return ht * C().vat / 100; }
function log(txt){ S.activity.unshift({t:now(), txt:txt}); S.activity = S.activity.slice(0,6); }

/* ---------- Calculs ---------- */
function pipeline(){ return S.deals.filter(function(d){return d.s<4;}).reduce(function(a,d){return a+d.v;},0); }
function weighted(){ return S.deals.filter(function(d){return d.s<4;}).reduce(function(a,d){return a+d.v*STAGES[d.s].p;},0); }
function dueTTC(){ return S.invoices.filter(function(i){return i.st==='sent';}).reduce(function(a,i){return a+i.ht+vat(i.ht);},0); }
function winRate(){ var w = S.deals.filter(function(d){return d.s===4;}).length; return Math.round(w / S.deals.length * 100); }

/* ---------- Pays ---------- */
var cs = document.getElementById('countrySwitch');
Object.keys(COUNTRIES).forEach(function(k){
  var b = document.createElement('button');
  b.type = 'button'; b.setAttribute('role','radio'); b.dataset.c = k; b.textContent = COUNTRIES[k].name;
  cs.appendChild(b);
});
cs.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) setCountry(b.dataset.c, true); });
cs.addEventListener('keydown', function(e){
  if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  var keys = Object.keys(COUNTRIES), i = keys.indexOf(S.country);
  i = (i + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
  setCountry(keys[i], true); cs.querySelector('[data-c="'+keys[i]+'"]').focus(); e.preventDefault();
});
function setCountry(k, announce){
  var changed = S.country !== k;
  S.country = k;
  cs.querySelectorAll('button').forEach(function(b){
    var on = b.dataset.c === k; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
  });
  var c = C();
  var rules = document.getElementById('sideRules');
  rules.innerHTML = '<b>Règles appliquées : '+c.name+'</b>TVA '+c.vat+' %, devise '+c.cur+'<br>Facture : '+c.fmt+'<br>Comptabilité : '+c.std;
  if(changed){ rules.classList.remove('flash'); void rules.offsetWidth; rules.classList.add('flash'); }
  render(true);
  if(announce && changed) toast(c.name+' : TVA '+c.vat+' %, montants en '+c.cur+', factures au format '+c.fmt+'.');
}

/* ---------- Navigation ---------- */
app.querySelectorAll('.side-nav button').forEach(function(b){
  b.addEventListener('click', function(){ go(b.dataset.page); });
});
function go(page, opts){
  S.page = page;
  if(opts && opts.sel) S.sel = opts.sel;
  if(opts && opts.highlight) S.highlight = opts.highlight;
  render(false, true);
  view.focus({preventScroll:true});
}

/* ---------- Rendu ---------- */
function render(soft, anim){
  app.querySelectorAll('.side-nav button').forEach(function(b){
    if(b.dataset.page === S.page) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  document.getElementById('crmCount').textContent = S.deals.filter(function(d){return d.s<4;}).length;
  document.getElementById('invCount').textContent = S.invoices.length;
  var html = S.page === 'crm' ? crmView() : S.page === 'inv' ? invView() : dashView();
  view.innerHTML = '<div class="'+(anim && !reduce ? 'view-in' : '')+'">'+html+'</div>';
  if(S.page === 'dash') wireChart();
  if(S.page === 'crm') wireBoard();
  if(S.page === 'inv') wireInv();
}

/* Tableau de bord */
function dashView(){
  var m = S.months, cur = m[m.length-1];
  return '<div class="v-head"><div><h3>Tableau de bord</h3><p>Vue d’ensemble de novembre 2026, mise à jour à chaque action.</p></div></div>'+
  '<div class="kpis">'+
    kpi('enc','Encaissé en novembre', money(cur.v), 'Hors taxes')+
    kpi('due','À encaisser', money(dueTTC()), S.invoices.filter(function(i){return i.st==='sent';}).length+' factures envoyées')+
    kpi('pip','Prévision des ventes', money(weighted()), 'Pipeline pondéré par étape')+
    kpi('win','Taux de transformation', winRate()+' %', (function(n){return n+(n>1?' affaires gagnées':' affaire gagnée');})(S.deals.filter(function(d){return d.s===4;}).length))+
  '</div>'+
  '<div class="panels">'+
    '<section class="panel"><h4>Chiffre d’affaires encaissé</h4><p class="ph-sub">Six derniers mois, hors taxes, en '+C().cur+'</p><div class="chart" id="revChart">'+barChart()+'<div class="tip" id="tip"></div></div></section>'+
    '<section class="panel"><h4>Pipeline par étape</h4><p class="ph-sub">Montant des affaires en cours</p>'+stageBars()+
      '<h4 style="margin-top:18px">Activité récente</h4><ul class="activity">'+S.activity.slice(0,4).map(function(a){return '<li><time>'+esc(a.t)+'</time><span>'+esc(a.txt)+'</span></li>';}).join('')+'</ul></section>'+
  '</div>';
}
function kpi(id,l,v,s){ return '<div class="kpi" data-k="'+id+'"><div class="kpi-l">'+l+'</div><div class="kpi-v">'+v+'</div><div class="kpi-s">'+s+'</div></div>'; }
function barChart(){
  var W=560, H=230, pl=46, pr=8, pt=10, pb=28;
  var data = S.months, max = Math.max.apply(null, data.map(function(d){return d.v;}));
  var top = Math.ceil(max/20000)*20000;
  var iw = W-pl-pr, ih = H-pt-pb, bw = iw/data.length;
  var out = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Chiffre d’affaires encaissé par mois"><g class="grid">';
  for(var g=0; g<=4; g++){
    var gy = pt + ih - ih*g/4, gv = top*g/4;
    out += '<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+gy+'" y2="'+gy+'"/><text class="ax" x="'+(pl-8)+'" y="'+(gy+4)+'" text-anchor="end">'+compact(gv)+'</text>';
  }
  out += '</g>';
  data.forEach(function(d,i){
    var h = Math.max(2, ih*d.v/top), x = pl + i*bw + bw*0.22, w = bw*0.56, y = pt+ih-h, r = Math.min(4,w/2,h);
    var path = 'M'+x+','+(pt+ih)+'V'+(y+r)+'Q'+x+','+y+' '+(x+r)+','+y+'H'+(x+w-r)+'Q'+(x+w)+','+y+' '+(x+w)+','+(y+r)+'V'+(pt+ih)+'Z';
    out += '<g class="col" data-i="'+i+'"><rect class="hit" x="'+(pl+i*bw)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'"/><path class="bar'+(i===data.length-1?' cur':'')+'" d="'+path+'"/>'+
      '<text class="ax" x="'+(x+w/2)+'" y="'+(H-8)+'" text-anchor="middle">'+d.m+'</text></g>';
  });
  return out + '</svg>';
}
function wireChart(){
  var ch = document.getElementById('revChart'), tip = document.getElementById('tip');
  if(!ch) return;
  var svg = ch.querySelector('svg');
  ch.querySelectorAll('g.col').forEach(function(g){
    g.addEventListener('mousemove', function(){
      var i = +g.dataset.i, d = S.months[i];
      var bar = g.querySelector('.bar').getBBox(), sb = svg.getBoundingClientRect(), k = sb.width/560;
      tip.innerHTML = '<b>'+money(d.v)+'</b>'+d.m+' 2026'+(i===S.months.length-1?' (en cours)':'');
      tip.style.left = ((bar.x + bar.width/2)*k)+'px';
      tip.style.top = (bar.y*k + 4)+'px';
      tip.classList.add('on');
    });
    g.addEventListener('mouseleave', function(){ tip.classList.remove('on'); });
  });
}
function stageBars(){
  var sums = STAGES.slice(0,4).map(function(st,i){ return S.deals.filter(function(d){return d.s===i;}).reduce(function(a,d){return a+d.v;},0); });
  var max = Math.max.apply(null, sums.concat([1]));
  return '<ul class="stagebars">'+sums.map(function(v,i){
    return '<li><span class="sb-l">'+STAGES[i].name+'</span><span class="sb-t"><span class="sb-f" style="width:'+(v/max*100)+'%"></span></span><span class="sb-v">'+money(v)+'</span></li>';
  }).join('')+'</ul>';
}

/* CRM */
var ICON_L = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';
var ICON_R = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
function crmView(){
  var head = '<div class="v-head"><div><h3>Ventes</h3><p>Faites glisser une affaire, ou utilisez les flèches de la carte.</p></div>'+
    '<div class="crm-sum"><div>Pipeline<b>'+money(pipeline())+'</b></div><div>Prévision<b>'+money(weighted())+'</b></div></div>'+
    '<button class="a-btn" id="addDeal" type="button">Nouvelle affaire</button></div>';
  var cols = STAGES.map(function(st, si){
    var ds = S.deals.filter(function(d){return d.s===si;});
    var total = ds.reduce(function(a,d){return a+d.v;},0);
    var cards = ds.map(function(d){
      var inv = S.invoices.filter(function(i){return i.deal===d.id;})[0];
      return '<article class="deal'+(S.highlight===d.id?' hl':'')+(d.fresh?' new':'')+'" draggable="true" data-id="'+d.id+'" aria-label="'+esc(d.client)+', '+money(d.v)+', '+st.name+'">'+
        '<div class="deal-c">'+esc(d.client)+'</div>'+
        '<div class="deal-m"><span class="deal-v">'+money(d.v)+'</span><span class="deal-a">'+
          (si>0?'<button type="button" data-mv="-1" aria-label="Reculer d’une étape">'+ICON_L+'</button>':'')+
          (si<4?'<button type="button" data-mv="1" aria-label="Avancer d’une étape">'+ICON_R+'</button>':'')+
        '</span></div>'+
        (inv?'<div class="deal-inv">Facture '+inv.num+' : '+STATUS[inv.st].l.toLowerCase()+'</div>':'')+
      '</article>';
    }).join('');
    var form = (si===0 && S.adding) ? '<form class="newdeal" id="newDeal"><input id="ndClient" placeholder="Nom du client" aria-label="Nom du client" required><input id="ndVal" inputmode="decimal" placeholder="Montant HT en '+C().cur+'" aria-label="Montant hors taxes" required><div class="row"><button class="a-btn" type="submit">Ajouter</button><button class="a-btn sec" type="button" id="ndCancel">Annuler</button></div></form>' : '';
    return '<div class="col'+(si===4?' won':'')+'" data-s="'+si+'"><div class="col-h"><b>'+st.name+'</b><span>'+(si<4?Math.round(st.p*100)+' %':'')+'</span></div><div class="col-t">'+ds.length+(ds.length>1?' affaires, ':' affaire, ')+money(total)+'</div>'+form+cards+'</div>';
  }).join('');
  S.deals.forEach(function(d){ d.fresh = false; });
  return head + '<div class="board">'+cols+'</div>';
}
function wireBoard(){
  var board = view.querySelector('.board');
  var dragId = null;
  board.addEventListener('dragstart', function(e){
    var c = e.target.closest('.deal'); if(!c) return;
    dragId = +c.dataset.id; c.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragId));
  });
  board.addEventListener('dragend', function(e){ var c = e.target.closest('.deal'); if(c) c.classList.remove('dragging'); board.querySelectorAll('.col').forEach(function(x){x.classList.remove('over');}); });
  board.querySelectorAll('.col').forEach(function(col){
    col.addEventListener('dragover', function(e){ e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', function(e){ if(!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', function(e){
      e.preventDefault(); col.classList.remove('over');
      var id = dragId || +e.dataTransfer.getData('text/plain');
      if(id) moveDeal(id, +col.dataset.s);
    });
  });
  board.addEventListener('click', function(e){
    var b = e.target.closest('[data-mv]'); if(!b) return;
    var id = +b.closest('.deal').dataset.id, d = byId(id);
    moveDeal(id, d.s + (+b.dataset.mv), true);
  });
  var add = document.getElementById('addDeal');
  add.addEventListener('click', function(){ S.adding = true; render(); var i = document.getElementById('ndClient'); if(i) i.focus(); });
  var f = document.getElementById('newDeal');
  if(f){
    document.getElementById('ndCancel').addEventListener('click', function(){ S.adding = false; render(); });
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var name = document.getElementById('ndClient').value.trim();
      var raw = parseFloat(document.getElementById('ndVal').value.replace(/\s/g,'').replace(',','.'));
      if(!name || !(raw > 0)){ toast('Indiquez un nom de client et un montant supérieur à zéro.'); return; }
      var d = {id:nextId++, client:name, v:Math.round(raw / C().rate), s:0, fresh:true};
      S.deals.push(d); S.adding = false; S.highlight = d.id;
      log('Nouvelle affaire : '+name);
      render();
      toast('Affaire ajoutée en Prospect. Faites-la avancer jusqu’à Gagné.');
    });
  }
  if(S.highlight){ var h = board.querySelector('.deal.hl'); if(h) h.scrollIntoView({block:'nearest', inline:'center', behavior: reduce?'auto':'smooth'}); setTimeout(function(){ S.highlight = null; }, 50); }
}
function byId(id){ return S.deals.filter(function(d){return d.id===id;})[0]; }
function moveDeal(id, to, keepFocus){
  var d = byId(id); if(!d || to<0 || to>4 || to===d.s) return;
  var from = d.s; d.s = to;
  log(d.client+' : '+STAGES[from].name+' → '+STAGES[to].name);
  var inv = null;
  if(to === 4 && !S.invoices.some(function(i){return i.deal===d.id;})){
    inv = {num:'FA-2026-0'+(S.seq++), client:d.client, ht:d.v, st:'draft', date:today(), deal:d.id, log:[]};
    S.invoices.unshift(inv);
    log('Facture '+inv.num+' créée pour '+d.client);
  }
  render();
  if(keepFocus){ var c = view.querySelector('.deal[data-id="'+id+'"] [data-mv]'); if(c) c.focus(); }
  if(inv) toast('Affaire gagnée. Facture '+inv.num+' créée en brouillon.', 'Voir la facture', function(){ go('inv', {sel:inv.num}); });
}

/* Factures */
function invView(){
  if(!S.sel || !S.invoices.some(function(i){return i.num===S.sel;})) S.sel = S.invoices[0].num;
  var inv = S.invoices.filter(function(i){return i.num===S.sel;})[0];
  var list = '<ul class="inv-list">'+S.invoices.map(function(i){
    return '<li><button type="button" data-n="'+i.num+'" aria-current="'+(i.num===S.sel)+'"><span class="il-n">'+i.num+'</span><span class="il-v">'+money(i.ht+vat(i.ht))+'</span><span class="il-c">'+esc(i.client)+'</span><span class="st '+STATUS[i.st].c+'">'+STATUS[i.st].l+'</span></button></li>';
  }).join('')+'</ul>';
  return '<div class="v-head"><div><h3>Factures</h3><p>Montants, TVA et format suivent le pays choisi en haut.</p></div></div><div class="inv-wrap">'+list+invDoc(inv)+'</div>';
}
function invDoc(i){
  var c = C(), t = vat(i.ht), ttc = i.ht + t;
  var act = i.st === 'draft' ? '<button class="a-btn" type="button" data-act="send">Envoyer la facture</button>'
          : i.st === 'sent' ? '<button class="a-btn" type="button" data-act="pay">Enregistrer le paiement</button>'
          : '<button class="a-btn sec" type="button" disabled>Facture réglée</button>';
  var rows = '';
  if(i.log.indexOf('sent') > -1){
    rows += led('Clients', ttc, 0, i.fresh==='sent') + led('Ventes de prestations', 0, i.ht, i.fresh==='sent') + led('TVA collectée '+c.vat+' %', 0, t, i.fresh==='sent');
  }
  if(i.log.indexOf('paid') > -1){
    rows += led('Banque', ttc, 0, i.fresh==='paid') + led('Clients', 0, ttc, i.fresh==='paid');
  }
  i.fresh = null;
  var ledger = '<div class="ledger"><h5>Écritures comptables <span>'+c.std+'</span></h5>'+
    (rows ? '<table><thead><tr><th>Compte</th><th class="r">Débit</th><th class="r">Crédit</th></tr></thead><tbody>'+rows+'</tbody></table>'
          : '<p class="empty">Les écritures seront passées automatiquement à l’envoi de la facture.</p>')+'</div>';
  return '<article class="doc" aria-label="Facture '+i.num+'">'+
    '<div class="doc-top"><div class="doc-brand">Votre société</div><div class="doc-num"><b>Facture '+i.num+'</b><span>Émise le '+i.date+'</span></div></div>'+
    '<div class="doc-parties"><div><b>Votre entreprise</b>Entreprise de démonstration<br>'+c.name+'</div><div><b>'+esc(i.client)+'</b>Client<br>Paiement à 30 jours</div></div>'+
    '<table><thead><tr><th>Désignation</th><th class="r">Montant</th></tr></thead><tbody>'+
      '<tr><td>Logiciel de gestion : licence et intégration</td><td class="r">'+money(i.ht,{dec:1})+'</td></tr>'+
      '<tr><td>TVA '+c.vat+' %</td><td class="r">'+money(t,{dec:1})+'</td></tr>'+
      '<tr class="tot"><td>Total TTC</td><td class="r">'+money(ttc,{dec:1})+'</td></tr></tbody></table>'+
    '<div class="doc-meta"><span>Format : '+c.fmt+'</span><span>Devise : '+c.cur+'</span><span class="st '+STATUS[i.st].c+'" style="padding:4px 9px">'+STATUS[i.st].l+'</span></div>'+
    '<div class="doc-act">'+act+'</div>'+ledger+'</article>';
}
function led(acc, d, c, fresh){
  return '<tr'+(fresh?' class="fresh"':'')+'><td>'+acc+'</td><td class="r">'+(d?money(d,{dec:1}):'')+'</td><td class="r">'+(c?money(c,{dec:1}):'')+'</td></tr>';
}
function wireInv(){
  view.querySelectorAll('.inv-list button').forEach(function(b){
    b.addEventListener('click', function(){ S.sel = b.dataset.n; render(); var nb = view.querySelector('.inv-list button[data-n="'+S.sel+'"]'); if(nb) nb.focus(); });
  });
  var a = view.querySelector('[data-act]');
  if(a) a.addEventListener('click', function(){
    var i = S.invoices.filter(function(x){return x.num===S.sel;})[0];
    if(a.dataset.act === 'send'){
      i.st = 'sent'; i.log.push('sent'); i.fresh = 'sent';
      log('Facture '+i.num+' envoyée à '+i.client);
      render(); toast('Facture '+i.num+' envoyée au format '+C().fmt+'. Écritures passées en comptabilité.');
    } else {
      i.st = 'paid'; i.log.push('paid'); i.fresh = 'paid';
      S.months[S.months.length-1].v += i.ht;
      log('Paiement reçu de '+i.client);
      render(); toast('Paiement enregistré. Le chiffre d’affaires de novembre est à jour.', 'Voir le tableau de bord', function(){ go('dash'); bumpKpi('enc'); });
    }
    var n = view.querySelector('[data-act]') || view.querySelector('.doc'); if(n) n.focus && n.focus();
  });
}
function bumpKpi(k){ var el = view.querySelector('.kpi[data-k="'+k+'"]'); if(el){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }

/* ---------- Notification ---------- */
var toastEl = document.getElementById('toast'), toastTimer;
function toast(msg, label, fn){
  clearTimeout(toastTimer);
  toastEl.innerHTML = '<span>'+esc(msg)+'</span>'+(label?'<button type="button">'+esc(label)+'</button>':'');
  if(label) toastEl.querySelector('button').addEventListener('click', function(){ toastEl.classList.remove('on'); fn(); });
  toastEl.classList.add('on');
  toastTimer = setTimeout(function(){ toastEl.classList.remove('on'); }, label ? 6500 : 4200);
}

/* ---------- Palette de commandes ---------- */
var scrim = document.getElementById('paletteScrim'), pin = document.getElementById('paletteInput'), plist = document.getElementById('paletteList');
var pItems = [], pIdx = 0, lastFocus = null;
function buildItems(){
  var it = [];
  it.push({g:'Aller à', l:'Tableau de bord', h:'Module', run:function(){go('dash');}});
  it.push({g:'Aller à', l:'Ventes', h:'Module', run:function(){go('crm');}});
  it.push({g:'Aller à', l:'Factures', h:'Module', run:function(){go('inv');}});
  it.push({g:'Actions', l:'Nouvelle affaire', h:'Ventes', run:function(){ S.adding = true; go('crm'); var i = document.getElementById('ndClient'); if(i) i.focus(); }});
  Object.keys(COUNTRIES).forEach(function(k){
    it.push({g:'Actions', l:'Passer en '+COUNTRIES[k].name, h:'TVA '+COUNTRIES[k].vat+' %, '+COUNTRIES[k].cur, run:function(){ setCountry(k, true); }});
  });
  S.deals.forEach(function(d){
    it.push({g:'Clients', l:d.client, h:STAGES[d.s].name+', '+money(d.v), run:function(){ go('crm', {highlight:d.id}); }});
  });
  S.invoices.forEach(function(i){
    it.push({g:'Factures', l:i.num+', '+i.client, h:STATUS[i.st].l, run:function(){ go('inv', {sel:i.num}); }});
  });
  return it;
}
function openPalette(){
  lastFocus = document.activeElement;
  var r = app.getBoundingClientRect();
  if(r.top < 0 || r.bottom > innerHeight) app.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
  scrim.hidden = false; pin.value = ''; pIdx = 0; filter(); pin.focus();
}
function closePalette(){ scrim.hidden = true; if(lastFocus && lastFocus.focus) lastFocus.focus(); }
function filter(){
  var q = norm(pin.value.trim()), all = buildItems();
  pItems = q ? all.filter(function(x){ return norm(x.l+' '+x.h+' '+x.g).indexOf(q) > -1; }) : all;
  if(pIdx >= pItems.length) pIdx = 0;
  if(!pItems.length){ plist.innerHTML = '<li class="none">Aucun résultat pour « '+esc(pin.value)+' ». Essayez un nom de client ou « facture ».</li>'; return; }
  var html = '', g = null;
  pItems.forEach(function(x, i){
    if(x.g !== g){ g = x.g; html += '<li class="grp" role="presentation">'+g+'</li>'; }
    html += '<li role="option" id="po'+i+'" data-i="'+i+'" aria-selected="'+(i===pIdx)+'">'+esc(x.l)+'<span>'+esc(x.h)+'</span></li>';
  });
  plist.innerHTML = html;
  pin.setAttribute('aria-activedescendant', 'po'+pIdx);
}
function moveSel(d){
  if(!pItems.length) return;
  pIdx = (pIdx + d + pItems.length) % pItems.length;
  plist.querySelectorAll('[role="option"]').forEach(function(o){ o.setAttribute('aria-selected', +o.dataset.i === pIdx); });
  var el = document.getElementById('po'+pIdx); if(el) el.scrollIntoView({block:'nearest'});
  pin.setAttribute('aria-activedescendant', 'po'+pIdx);
}
function runSel(i){ var x = pItems[i]; if(!x) return; scrim.hidden = true; x.run(); }
pin.addEventListener('input', function(){ pIdx = 0; filter(); });
pin.addEventListener('keydown', function(e){
  if(e.key === 'ArrowDown'){ moveSel(1); e.preventDefault(); }
  else if(e.key === 'ArrowUp'){ moveSel(-1); e.preventDefault(); }
  else if(e.key === 'Enter'){ runSel(pIdx); e.preventDefault(); }
  else if(e.key === 'Escape'){ closePalette(); e.preventDefault(); }
  else if(e.key === 'Tab'){ e.preventDefault(); }
});
plist.addEventListener('mousemove', function(e){ var o = e.target.closest('[role="option"]'); if(o && +o.dataset.i !== pIdx){ moveSel(+o.dataset.i - pIdx); } });
plist.addEventListener('click', function(e){ var o = e.target.closest('[role="option"]'); if(o) runSel(+o.dataset.i); });
scrim.addEventListener('click', function(e){ if(e.target === scrim) closePalette(); });
document.getElementById('openPalette').addEventListener('click', openPalette);
addEventListener('keydown', function(e){
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); scrim.hidden ? openPalette() : closePalette(); }
});

/* ---------- Réinitialiser ---------- */
document.getElementById('resetDemo').addEventListener('click', function(){
  var c = S.country; S = seed(); S.country = c; nextId = 9; setCountry(c, false); toast('Démo réinitialisée.');
});

setCountry('PL', false);
})();
