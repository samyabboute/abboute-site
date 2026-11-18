/* Nexus : outil de gestion de démonstration (CRM, facturation, comptabilité, tableau de bord), bilingue */
(function(){
'use strict';
var app = document.getElementById('app');
if(!app) return;
var view = document.getElementById('view');
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function t(en, fr){ return (window.NX && NX.lang === 'fr') ? fr : en; }
function loc(){ return t('en-GB','fr-FR'); }

var COUNTRIES = {
  PL:{n:['Poland','Pologne'], cur:'PLN', rate:4.24, vat:23, fmt:['KSeF','KSeF'], std:['Polish Accounting Act','Loi comptable polonaise']},
  FR:{n:['France','France'], cur:'EUR', rate:1, vat:20, fmt:['Factur-X','Factur-X'], std:['French GAAP (PCG)','Plan comptable général']},
  DE:{n:['Germany','Allemagne'], cur:'EUR', rate:1, vat:19, fmt:['XRechnung','XRechnung'], std:['HGB','HGB']},
  DZ:{n:['Algeria','Algérie'], cur:'DZD', rate:151.2, vat:19, fmt:['Signed PDF','PDF signé'], std:['SCF','SCF']}
};
var STAGES = [
  {id:'lead', n:['Lead','Prospect'], p:0.1},
  {id:'qual', n:['Qualified','Qualifié'], p:0.3},
  {id:'prop', n:['Proposal','Proposition'], p:0.6},
  {id:'nego', n:['Negotiation','Négociation'], p:0.8},
  {id:'won',  n:['Won','Gagné'], p:1}
];
STAGES.forEach(function(s){ Object.defineProperty(s, 'name', { get: function(){ return t(s.n[0], s.n[1]); } }); });
var STATUS = {draft:{n:['Draft','Brouillon'],c:'st-draft'}, sent:{n:['Sent','Envoyée'],c:'st-sent'}, paid:{n:['Paid','Payée'],c:'st-paid'}};
Object.keys(STATUS).forEach(function(k){ Object.defineProperty(STATUS[k], 'l', { get: function(){ return t(STATUS[k].n[0], STATUS[k].n[1]); } }); });
Object.keys(COUNTRIES).forEach(function(k){ var c = COUNTRIES[k];
  Object.defineProperty(c, 'name', { get: function(){ return t(c.n[0], c.n[1]); } });
  Object.defineProperty(c, 'f', { get: function(){ return t(c.fmt[0], c.fmt[1]); } });
  Object.defineProperty(c, 's', { get: function(){ return t(c.std[0], c.std[1]); } });
});
/* Journal d'activité : stocké en structure, affiché dans la langue courante */
function A(k, a){ var d = a || [];
  var M = { sent:['Invoice '+d[0]+' sent to '+d[1], 'Facture '+d[0]+' envoyée à '+d[1]],
    nego:[d[0]+' moved to negotiation', d[0]+' passé en négociation'],
    paid:['Payment received from '+d[0], 'Paiement reçu de '+d[0]],
    move:[d[0]+': '+(d[1]&&d[1].name)+' → '+(d[2]&&d[2].name), d[0]+' : '+(d[1]&&d[1].name)+' → '+(d[2]&&d[2].name)],
    inv:['Invoice '+d[0]+' created for '+d[1], 'Facture '+d[0]+' créée pour '+d[1]],
    deal:['New deal: '+d[0], 'Nouvelle affaire : '+d[0]] };
  return t(M[k][0], M[k][1]); }

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
      {m:5, v:38200},{m:6, v:44100},{m:7, v:30800},
      {m:8, v:52300},{m:9, v:47600},{m:10, v:18400}
    ],
    activity:[
      {t:'09:12', k:'sent', a:['FA-2026-044','Polar Tech']},
      {t:'08:40', k:'nego', a:['Nordbau Projekt']},
      {t:'y', k:'paid', a:['Delta Transport']}
    ]
  };
}
var S = seed();
var nextId = 9;

/* ---------- Formats ---------- */
function C(){ return COUNTRIES[S.country]; }
function money(eur, opts){
  var c = C();
  return new Intl.NumberFormat(loc(), {style:'currency', currency:c.cur, maximumFractionDigits: (opts && opts.dec) ? 2 : 0, minimumFractionDigits: (opts && opts.dec) ? 2 : 0}).format(eur * c.rate);
}
function compact(eur){
  var c = C();
  return new Intl.NumberFormat(loc(), {notation:'compact', maximumFractionDigits:1}).format(eur * c.rate);
}
function esc(s){ return String(s).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
function norm(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
function now(){ var d = new Date(); return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }
function today(){ return new Date().toLocaleDateString('fr-FR'); }
function mname(i){ return new Intl.DateTimeFormat(loc(), {month:'short'}).format(new Date(2026, i, 1)); }
function fdate(s){ if(window.NX && NX.lang === 'fr') return s; var p = s.split('/'); return (+p[0])+' '+new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(+p[2], +p[1]-1, 1))+' '+p[2]; }
function vat(ht){ return ht * C().vat / 100; }
function log(k, a){ S.activity.unshift({t:now(), k:k, a:a}); S.activity = S.activity.slice(0,6); }

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
  rules.innerHTML = '<b>'+t('Rules applied: ','Règles appliquées : ')+c.name+'</b>'+t('VAT ','TVA ')+c.vat+' %, '+t('currency ','devise ')+c.cur+'<br>'+t('Invoice: ','Facture : ')+c.f+'<br>'+t('Accounting: ','Comptabilité : ')+c.s;
  if(changed){ rules.classList.remove('flash'); void rules.offsetWidth; rules.classList.add('flash'); }
  render(true);
  if(announce && changed) toast(t(c.name+': '+c.vat+' % VAT, amounts in '+c.cur+', invoices in '+c.f+' format.', c.name+' : TVA '+c.vat+' %, montants en '+c.cur+', factures au format '+c.f+'.'));
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
  var nSent = S.invoices.filter(function(i){return i.st==='sent';}).length, nWon = S.deals.filter(function(d){return d.s===4;}).length;
  return '<div class="v-head"><div><h3>'+t('Dashboard','Tableau de bord')+'</h3><p>'+t('November 2026 at a glance, updated with every action.','Vue d’ensemble de novembre 2026, mise à jour à chaque action.')+'</p></div></div>'+
  '<div class="kpis">'+
    kpi('enc',t('Collected in November','Encaissé en novembre'), money(cur.v), t('Excluding VAT','Hors taxes'))+
    kpi('due',t('To collect','À encaisser'), money(dueTTC()), nSent+t(' invoices sent',' factures envoyées'))+
    kpi('pip',t('Sales forecast','Prévision des ventes'), money(weighted()), t('Pipeline weighted by stage','Pipeline pondéré par étape'))+
    kpi('win',t('Win rate','Taux de transformation'), winRate()+' %', nWon+(nWon>1?t(' deals won',' affaires gagnées'):t(' deal won',' affaire gagnée')))+
  '</div>'+
  '<div class="panels">'+
    '<section class="panel"><h4>'+t('Revenue collected','Chiffre d’affaires encaissé')+'</h4><p class="ph-sub">'+t('Last six months, excluding VAT, in ','Six derniers mois, hors taxes, en ')+C().cur+'</p><div class="chart" id="revChart">'+barChart()+'<div class="tip" id="tip"></div></div></section>'+
    '<section class="panel"><h4>'+t('Pipeline by stage','Pipeline par étape')+'</h4><p class="ph-sub">'+t('Value of open deals','Montant des affaires en cours')+'</p>'+stageBars()+
      '<h4 style="margin-top:18px">'+t('Recent activity','Activité récente')+'</h4><ul class="activity">'+S.activity.slice(0,4).map(function(a){return '<li><time>'+esc(a.t==='y'?t('yesterday','hier'):a.t)+'</time><span>'+esc(A(a.k,a.a))+'</span></li>';}).join('')+'</ul></section>'+
  '</div>';
}
function kpi(id,l,v,s){ return '<div class="kpi" data-k="'+id+'"><div class="kpi-l">'+l+'</div><div class="kpi-v">'+v+'</div><div class="kpi-s">'+s+'</div></div>'; }
function barChart(){
  var W=560, H=230, pl=46, pr=8, pt=10, pb=28;
  var data = S.months, max = Math.max.apply(null, data.map(function(d){return d.v;}));
  var top = Math.ceil(max/20000)*20000;
  var iw = W-pl-pr, ih = H-pt-pb, bw = iw/data.length;
  var out = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+t('Revenue collected per month','Chiffre d’affaires encaissé par mois')+'"><g class="grid">';
  for(var g=0; g<=4; g++){
    var gy = pt + ih - ih*g/4, gv = top*g/4;
    out += '<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+gy+'" y2="'+gy+'"/><text class="ax" x="'+(pl-8)+'" y="'+(gy+4)+'" text-anchor="end">'+compact(gv)+'</text>';
  }
  out += '</g>';
  data.forEach(function(d,i){
    var h = Math.max(2, ih*d.v/top), x = pl + i*bw + bw*0.22, w = bw*0.56, y = pt+ih-h, r = Math.min(4,w/2,h);
    var path = 'M'+x+','+(pt+ih)+'V'+(y+r)+'Q'+x+','+y+' '+(x+r)+','+y+'H'+(x+w-r)+'Q'+(x+w)+','+y+' '+(x+w)+','+(y+r)+'V'+(pt+ih)+'Z';
    out += '<g class="col" data-i="'+i+'"><rect class="hit" x="'+(pl+i*bw)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'"/><path class="bar'+(i===data.length-1?' cur':'')+'" d="'+path+'"/>'+
      '<text class="ax" x="'+(x+w/2)+'" y="'+(H-8)+'" text-anchor="middle">'+mname(d.m)+'</text></g>';
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
      tip.innerHTML = '<b>'+money(d.v)+'</b>'+mname(d.m)+' 2026'+(i===S.months.length-1?t(' (in progress)',' (en cours)'):'');
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
  var head = '<div class="v-head"><div><h3>'+t('Sales','Ventes')+'</h3><p>'+t('Drag a deal, or use the arrows on each card.','Faites glisser une affaire, ou utilisez les flèches de la carte.')+'</p></div>'+
    '<div class="crm-sum"><div>Pipeline<b>'+money(pipeline())+'</b></div><div>'+t('Forecast','Prévision')+'<b>'+money(weighted())+'</b></div></div>'+
    '<button class="a-btn" id="addDeal" type="button">'+t('New deal','Nouvelle affaire')+'</button></div>';
  var cols = STAGES.map(function(st, si){
    var ds = S.deals.filter(function(d){return d.s===si;});
    var total = ds.reduce(function(a,d){return a+d.v;},0);
    var cards = ds.map(function(d){
      var inv = S.invoices.filter(function(i){return i.deal===d.id;})[0];
      return '<article class="deal'+(S.highlight===d.id?' hl':'')+(d.fresh?' new':'')+'" draggable="true" data-id="'+d.id+'" aria-label="'+esc(d.client)+', '+money(d.v)+', '+st.name+'">'+
        '<div class="deal-c">'+esc(d.client)+'</div>'+
        '<div class="deal-m"><span class="deal-v">'+money(d.v)+'</span><span class="deal-a">'+
          (si>0?'<button type="button" data-mv="-1" aria-label="'+t('Move back one stage','Reculer d’une étape')+'">'+ICON_L+'</button>':'')+
          (si<4?'<button type="button" data-mv="1" aria-label="'+t('Move forward one stage','Avancer d’une étape')+'">'+ICON_R+'</button>':'')+
        '</span></div>'+
        (inv?'<div class="deal-inv">'+t('Invoice ','Facture ')+inv.num+t(': ',' : ')+STATUS[inv.st].l.toLowerCase()+'</div>':'')+
      '</article>';
    }).join('');
    var form = (si===0 && S.adding) ? '<form class="newdeal" id="newDeal"><input id="ndClient" placeholder="'+t('Client name','Nom du client')+'" aria-label="'+t('Client name','Nom du client')+'" required><input id="ndVal" inputmode="decimal" placeholder="'+t('Amount excl. VAT in ','Montant HT en ')+C().cur+'" aria-label="'+t('Amount excluding VAT','Montant hors taxes')+'" required><div class="row"><button class="a-btn" type="submit">'+t('Add','Ajouter')+'</button><button class="a-btn sec" type="button" id="ndCancel">'+t('Cancel','Annuler')+'</button></div></form>' : '';
    return '<div class="col'+(si===4?' won':'')+'" data-s="'+si+'"><div class="col-h"><b>'+st.name+'</b><span>'+(si<4?Math.round(st.p*100)+' %':'')+'</span></div><div class="col-t">'+ds.length+(ds.length>1?t(' deals, ',' affaires, '):t(' deal, ',' affaire, '))+money(total)+'</div>'+form+cards+'</div>';
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
      if(!name || !(raw > 0)){ toast(t('Enter a client name and an amount above zero.','Indiquez un nom de client et un montant supérieur à zéro.')); return; }
      var d = {id:nextId++, client:name, v:Math.round(raw / C().rate), s:0, fresh:true};
      S.deals.push(d); S.adding = false; S.highlight = d.id;
      log('deal', [name]);
      render();
      toast(t('Deal added as a lead. Move it all the way to Won.','Affaire ajoutée en Prospect. Faites-la avancer jusqu’à Gagné.'));
    });
  }
  if(S.highlight){ var h = board.querySelector('.deal.hl'); if(h) h.scrollIntoView({block:'nearest', inline:'center', behavior: reduce?'auto':'smooth'}); setTimeout(function(){ S.highlight = null; }, 50); }
}
function byId(id){ return S.deals.filter(function(d){return d.id===id;})[0]; }
function moveDeal(id, to, keepFocus){
  var d = byId(id); if(!d || to<0 || to>4 || to===d.s) return;
  var from = d.s; d.s = to;
  log('move', [d.client, STAGES[from], STAGES[to]]);
  var inv = null;
  if(to === 4 && !S.invoices.some(function(i){return i.deal===d.id;})){
    inv = {num:'FA-2026-0'+(S.seq++), client:d.client, ht:d.v, st:'draft', date:today(), deal:d.id, log:[]};
    S.invoices.unshift(inv);
    log('inv', [inv.num, d.client]);
  }
  render();
  if(keepFocus){ var c = view.querySelector('.deal[data-id="'+id+'"] [data-mv]'); if(c) c.focus(); }
  if(inv) toast(t('Deal won. Invoice '+inv.num+' created as a draft.','Affaire gagnée. Facture '+inv.num+' créée en brouillon.'), t('View invoice','Voir la facture'), function(){ go('inv', {sel:inv.num}); });
}

/* Factures */
function invView(){
  if(!S.sel || !S.invoices.some(function(i){return i.num===S.sel;})) S.sel = S.invoices[0].num;
  var inv = S.invoices.filter(function(i){return i.num===S.sel;})[0];
  var list = '<ul class="inv-list">'+S.invoices.map(function(i){
    return '<li><button type="button" data-n="'+i.num+'" aria-current="'+(i.num===S.sel)+'"><span class="il-n">'+i.num+'</span><span class="il-v">'+money(i.ht+vat(i.ht))+'</span><span class="il-c">'+esc(i.client)+'</span><span class="st '+STATUS[i.st].c+'">'+STATUS[i.st].l+'</span></button></li>';
  }).join('')+'</ul>';
  return '<div class="v-head"><div><h3>'+t('Invoices','Factures')+'</h3><p>'+t('Amounts, VAT and format follow the country chosen above.','Montants, TVA et format suivent le pays choisi en haut.')+'</p></div></div><div class="inv-wrap">'+list+invDoc(inv)+'</div>';
}
function invDoc(i){
  var c = C(), tx = vat(i.ht), ttc = i.ht + tx;
  var act = i.st === 'draft' ? '<button class="a-btn" type="button" data-act="send">'+t('Send invoice','Envoyer la facture')+'</button>'
          : i.st === 'sent' ? '<button class="a-btn" type="button" data-act="pay">'+t('Record payment','Enregistrer le paiement')+'</button>'
          : '<button class="a-btn sec" type="button" disabled>'+t('Invoice paid','Facture réglée')+'</button>';
  var rows = '';
  if(i.log.indexOf('sent') > -1){
    rows += led(t('Receivables','Clients'), ttc, 0, i.fresh==='sent') + led(t('Service revenue','Ventes de prestations'), 0, i.ht, i.fresh==='sent') + led(t('Output VAT ','TVA collectée ')+c.vat+' %', 0, tx, i.fresh==='sent');
  }
  if(i.log.indexOf('paid') > -1){
    rows += led(t('Bank','Banque'), ttc, 0, i.fresh==='paid') + led(t('Receivables','Clients'), 0, ttc, i.fresh==='paid');
  }
  i.fresh = null;
  var ledger = '<div class="ledger"><h5>'+t('Journal entries','Écritures comptables')+' <span>'+c.s+'</span></h5>'+
    (rows ? '<table><thead><tr><th>'+t('Account','Compte')+'</th><th class="r">'+t('Debit','Débit')+'</th><th class="r">'+t('Credit','Crédit')+'</th></tr></thead><tbody>'+rows+'</tbody></table>'
          : '<p class="empty">'+t('Entries are posted automatically when the invoice is sent.','Les écritures seront passées automatiquement à l’envoi de la facture.')+'</p>')+'</div>';
  return '<article class="doc" aria-label="'+t('Invoice ','Facture ')+i.num+'">'+
    '<div class="doc-top"><div class="doc-brand">'+t('Your company','Votre société')+'</div><div class="doc-num"><b>'+t('Invoice ','Facture ')+i.num+'</b><span>'+t('Issued ','Émise le ')+fdate(i.date)+'</span></div></div>'+
    '<div class="doc-parties"><div><b>'+t('Your company','Votre entreprise')+'</b>'+t('Demo company','Entreprise de démonstration')+'<br>'+c.name+'</div><div><b>'+esc(i.client)+'</b>'+t('Client','Client')+'<br>'+t('Payment within 30 days','Paiement à 30 jours')+'</div></div>'+
    '<table><thead><tr><th>'+t('Description','Désignation')+'</th><th class="r">'+t('Amount','Montant')+'</th></tr></thead><tbody>'+
      '<tr><td>'+t('Management software: licence and integration','Logiciel de gestion : licence et intégration')+'</td><td class="r">'+money(i.ht,{dec:1})+'</td></tr>'+
      '<tr><td>'+t('VAT ','TVA ')+c.vat+' %</td><td class="r">'+money(tx,{dec:1})+'</td></tr>'+
      '<tr class="tot"><td>'+t('Total incl. VAT','Total TTC')+'</td><td class="r">'+money(ttc,{dec:1})+'</td></tr></tbody></table>'+
    '<div class="doc-meta"><span>'+t('Format: ','Format : ')+c.f+'</span><span>'+t('Currency: ','Devise : ')+c.cur+'</span><span class="st '+STATUS[i.st].c+'" style="padding:4px 9px">'+STATUS[i.st].l+'</span></div>'+
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
      log('sent', [i.num, i.client]);
      render(); toast(t('Invoice '+i.num+' sent as '+C().f+'. Entries posted to accounting.','Facture '+i.num+' envoyée au format '+C().f+'. Écritures passées en comptabilité.'));
    } else {
      i.st = 'paid'; i.log.push('paid'); i.fresh = 'paid';
      S.months[S.months.length-1].v += i.ht;
      log('paid', [i.client]);
      render(); toast(t('Payment recorded. November revenue is up to date.','Paiement enregistré. Le chiffre d’affaires de novembre est à jour.'), t('View dashboard','Voir le tableau de bord'), function(){ go('dash'); bumpKpi('enc'); });
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
  var G = t('Go to','Aller à');
  it.push({g:G, l:t('Dashboard','Tableau de bord'), h:'Module', run:function(){go('dash');}});
  it.push({g:G, l:t('Sales','Ventes'), h:'Module', run:function(){go('crm');}});
  it.push({g:G, l:t('Invoices','Factures'), h:'Module', run:function(){go('inv');}});
  it.push({g:'Actions', l:t('New deal','Nouvelle affaire'), h:t('Sales','Ventes'), run:function(){ S.adding = true; go('crm'); var i = document.getElementById('ndClient'); if(i) i.focus(); }});
  Object.keys(COUNTRIES).forEach(function(k){
    it.push({g:'Actions', l:t('Switch to ','Passer en ')+COUNTRIES[k].name, h:t('VAT ','TVA ')+COUNTRIES[k].vat+' %, '+COUNTRIES[k].cur, run:function(){ setCountry(k, true); }});
  });
  S.deals.forEach(function(d){
    it.push({g:'Clients', l:d.client, h:STAGES[d.s].name+', '+money(d.v), run:function(){ go('crm', {highlight:d.id}); }});
  });
  S.invoices.forEach(function(i){
    it.push({g:t('Invoices','Factures'), l:i.num+', '+i.client, h:STATUS[i.st].l, run:function(){ go('inv', {sel:i.num}); }});
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
  if(!pItems.length){ plist.innerHTML = '<li class="none">'+t('No results for “'+esc(pin.value)+'”. Try a client name or “invoice”.','Aucun résultat pour « '+esc(pin.value)+' ». Essayez un nom de client ou « facture ».')+'</li>'; return; }
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
  var c = S.country; S = seed(); S.country = c; nextId = 9; setCountry(c, false); toast(t('Demo reset.','Démo réinitialisée.'));
});

setCountry('PL', false);

/* Changement de langue : on redessine tout */
addEventListener('nx:lang', function(){
  cs.querySelectorAll('button').forEach(function(b){ b.textContent = COUNTRIES[b.dataset.c].name; });
  setCountry(S.country, false);
});
})();
