/* ABBOUTE Technologies : configurateur de projet. Quatre questions, un brief prêt à envoyer. Bilingue. */
(function(){
'use strict';
var form = document.getElementById('cfg');
if(!form) return;
var gsap = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var t = function(fr, en, ar){ return window.NX ? NX.t(fr, en, ar) : fr; };
var steps = [].slice.call(form.querySelectorAll('.cfg-step'));
var order = ['need','stage','size','when','who','done'];
var prog = document.getElementById('cfgProg'), count = document.getElementById('cfgCount');
var back = document.getElementById('cfgBack'), err = document.getElementById('cfgErr');
var brief = document.getElementById('brief'), bar = document.getElementById('briefBar');
var info = { name: '', email: '', phone: '', company: '' };
var cur = 0, busy = false, inView = false, ready = false;

var d = new Date();
var ref = 'AT-' + String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + '-' + Math.floor(1000 + Math.random()*9000);
document.getElementById('briefRef').textContent = 'Brief ' + ref;

/* Réponses lues depuis les libellés : elles suivent la langue affichée */
function labelOf(inp){ var el = inp.closest('label').querySelector('b, em'); return el ? el.textContent.trim() : inp.value; }
function answers(){
  var a = {};
  a.need = [].slice.call(form.querySelectorAll('[name=need]:checked')).map(labelOf).join(', ');
  ['stage','size','when'].forEach(function(k){ var x = form.querySelector('[name=' + k + ']:checked'); a[k] = x ? labelOf(x) : ''; });
  a.who = [info.name, info.company].filter(Boolean).join(', ');
  return a;
}
function paint(flashKey){
  var a = answers(), filled = 0;
  ['need','stage','size','when','who'].forEach(function(key){
    var row = brief.querySelector('[data-b="' + key + '"]'), dd = row.querySelector('dd');
    var v = a[key];
    dd.textContent = v || t('À préciser', 'To be defined', 'يُحدَّد لاحقاً');
    row.classList.toggle('set', !!v); if(v) filled++;
    if(key === flashKey && v){ row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
  });
  bar.style.width = (filled / 5 * 100) + '%';
  document.getElementById('briefState').textContent = ready ? t('Prêt', 'Ready', 'جاهز') : t('En cours', 'In progress', 'قيد الإعداد');
}

function show(i, dir){
  if(i === cur || busy) return;
  var from = steps[cur], to = steps[i], done = order[i] === 'done';
  busy = true;
  var finish = function(){
    from.classList.remove('on'); to.classList.add('on'); cur = i; busy = false; ui();
    if(done) to.focus({ preventScroll: true });
    else if(order[i] === 'who'){ var f = to.querySelector('input'); if(f) f.focus({ preventScroll: true }); }
  };
  if(gsap && !reduce){
    gsap.to(from, { opacity: 0, x: -32 * dir, duration: 0.24, ease: 'power2.in', onComplete: function(){
      finish();
      gsap.fromTo(to, { opacity: 0, x: 32 * dir }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' });
      if(done) gsap.from(to.querySelectorAll('h3, p, .done-sum, .done-actions, .cfg-restart'), { opacity: 0, y: 14, duration: 0.55, stagger: 0.06, ease: 'power3.out', delay: 0.2 });
    }});
  } else finish();
}
function ui(){
  var isDone = order[cur] === 'done';
  prog.style.width = ((isDone ? 5 : cur) / 5 * 100) + '%';
  count.textContent = isDone ? t('Terminé', 'Done', 'تمّ') : (Math.min(cur, 4) + 1) + ' / 5';
  back.disabled = cur === 0;
  form.classList.toggle('is-done', isDone);
}
function next(){ if(cur < 4) show(cur + 1, 1); }
back.addEventListener('click', function(){ if(cur > 0) show(order[cur] === 'done' ? 4 : cur - 1, -1); });

var needStep = steps[0], needBtn = needStep.querySelector('.cfg-next');
needStep.addEventListener('change', function(){
  needBtn.disabled = !form.querySelector('[name=need]:checked');
  paint('need');
});
needBtn.addEventListener('click', next);
['stage','size','when'].forEach(function(key){
  steps[order.indexOf(key)].addEventListener('change', function(){ paint(key); setTimeout(next, reduce ? 0 : 240); });
});
['name','email','phone','company'].forEach(function(key){
  var el = form.elements[key];
  el.addEventListener('input', function(){
    info[key] = el.value.trim(); el.closest('.field').classList.remove('err');
    if(!form.querySelector('.field.err')) err.textContent = '';
    if(key === 'name' || key === 'company') paint('who');
  });
});

function text(){
  var a = answers();
  return [
    'Brief ' + ref, '',
    t('Besoin : ', 'Need: ', 'الحاجة: ') + (a.need || '-'),
    t('Situation : ', 'Stage: ', 'الوضعية: ') + (a.stage || '-'),
    t('Taille : ', 'Company size: ', 'حجم المؤسسة: ') + (a.size || '-'),
    t('Démarrage : ', 'Start: ', 'الانطلاق: ') + (a.when || '-'), '',
    t('Contact : ', 'Contact: ', 'الاتصال: ') + info.name + (info.company ? ', ' + info.company : ''),
    t('E-mail : ', 'Email: ', 'البريد: ') + info.email,
    info.phone ? t('Téléphone : ', 'Phone: ', 'الهاتف: ') + info.phone : ''
  ].filter(function(x, i, arr){ return x !== '' || (arr[i-1] !== '' && i < arr.length - 1); }).join('\n').trim();
}
function finalize(){
  var a = answers();
  document.getElementById('cfgSend').href = 'mailto:contact@abboute.com?subject=' + encodeURIComponent('Brief ' + ref + ' : ' + a.need) + '&body=' + encodeURIComponent(text());
  document.getElementById('doneSum').innerHTML = brief.querySelector('dl').innerHTML;
}

form.addEventListener('submit', function(e){
  e.preventDefault();
  if(order[cur] !== 'who') return;
  var bad = [];
  if(!info.name) bad.push('name');
  if(!/^\S+@\S+\.\S+$/.test(info.email)) bad.push('email');
  bad.forEach(function(key){ form.elements[key].closest('.field').classList.add('err'); });
  if(bad.length){
    err.textContent = bad.length === 2 ? t('Indiquez votre nom et une adresse e-mail valide.', 'Please add your name and a valid email address.', 'يرجى إدخال اسمكم وبريد إلكتروني صحيح.')
      : bad[0] === 'name' ? t('Indiquez votre nom.', 'Please add your name.', 'يرجى إدخال اسمكم.')
      : t('Indiquez une adresse e-mail valide, par exemple nom@entreprise.dz.', 'Please add a valid email address, for example name@company.com.', 'يرجى إدخال بريد إلكتروني صحيح، مثل name@company.dz.');
    form.elements[bad[0]].focus(); return;
  }
  err.textContent = '';
  ready = true; brief.classList.add('ready'); paint(); finalize();
  show(5, 1);
});

document.getElementById('cfgCopy').addEventListener('click', function(){
  var b = this, txt = text();
  var ok = function(){ b.textContent = t('Brief copié', 'Brief copied', 'تم نسخ الملخّص'); setTimeout(function(){ b.textContent = t('Copier le brief', 'Copy the brief', 'نسخ الملخّص'); }, 2000); };
  if(navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function(){});
  else { var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch(x){} a.remove(); }
});
document.getElementById('cfgEdit').addEventListener('click', function(){ ready = false; brief.classList.remove('ready'); paint(); show(0, -1); });

/* Clavier : 1 à 6 pour répondre, Entrée pour continuer */
new IntersectionObserver(function(en){ inView = en[0].isIntersecting; }, { threshold: 0.35 }).observe(form);
document.addEventListener('keydown', function(e){
  if(!inView || e.metaKey || e.ctrlKey || e.altKey) return;
  var tag = (e.target.tagName || '').toLowerCase();
  if((tag === 'input' && e.target.type !== 'checkbox' && e.target.type !== 'radio') || tag === 'textarea') return;
  var n = parseInt(e.key, 10);
  if(n >= 1 && n <= 9){
    var inp = steps[cur].querySelectorAll('input[type=checkbox], input[type=radio]')[n - 1]; if(!inp) return;
    e.preventDefault();
    if(inp.type === 'checkbox') inp.checked = !inp.checked; else inp.checked = true;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  } else if(e.key === 'Enter' && order[cur] === 'need' && form.querySelector('[name=need]:checked')){ e.preventDefault(); next(); }
});

/* Changement de langue : le brief se réécrit */
addEventListener('nx:lang', function(){ paint(); ui(); if(ready) finalize(); });
paint(); ui();
})();
