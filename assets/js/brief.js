/* Nexus : configurateur de projet. Quatre questions, un brief prêt à envoyer. */
(function(){
'use strict';
var form = document.getElementById('cfg');
if(!form) return;
var gsap = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var steps = [].slice.call(form.querySelectorAll('.cfg-step'));
var order = ['need','stage','size','when','who','done'];
var prog = document.getElementById('cfgProg'), count = document.getElementById('cfgCount');
var back = document.getElementById('cfgBack'), err = document.getElementById('cfgErr');
var brief = document.getElementById('brief'), bar = document.getElementById('briefBar');
var state = { need: [], stage: '', size: '', when: '', name: '', email: '', company: '', message: '' };
var cur = 0, busy = false, inView = false;

/* Référence unique du brief */
var d = new Date();
var ref = 'NX-' + String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + '-' + Math.floor(1000 + Math.random()*9000);
document.getElementById('briefRef').textContent = 'Brief ' + ref;

function stepEl(i){ return steps[i]; }
function setBrief(key, val){
  var row = brief.querySelector('[data-b="' + key + '"] dd'); if(!row) return;
  var v = val || 'À préciser';
  if(row.textContent === v) return;
  row.textContent = v;
  row.parentNode.classList.toggle('set', !!val);
  row.parentNode.classList.remove('flash'); void row.offsetWidth; if(val) row.parentNode.classList.add('flash');
  var filled = brief.querySelectorAll('dl > div.set').length;
  bar.style.width = (filled / 5 * 100) + '%';
}
function who(){ return [state.name, state.company].filter(Boolean).join(', '); }

function show(i, dir){
  if(i === cur || busy) return;
  var from = stepEl(cur), to = stepEl(i);
  var done = order[i] === 'done';
  busy = true;
  var finish = function(){
    from.classList.remove('on'); to.classList.add('on'); cur = i; busy = false; ui();
    var f = to.querySelector(done ? '.btn' : (order[i] === 'who' ? 'input' : 'input'));
    if(f && (order[i] === 'who' || matchMedia('(hover: hover)').matches)) f.focus({ preventScroll: true });
    if(done) to.focus({ preventScroll: true });
  };
  if(gsap && !reduce){
    gsap.to(from, { opacity: 0, x: -36 * dir, filter: 'blur(6px)', duration: 0.28, ease: 'power2.in', onComplete: function(){
      finish();
      gsap.fromTo(to, { opacity: 0, x: 36 * dir, filter: 'blur(6px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' });
      if(done){ gsap.from(to.querySelectorAll('h3, p, .done-actions, .done-sum, .cfg-restart'), { opacity: 0, y: 16, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.25 }); }
    }});
  } else finish();
}
function ui(){
  var n = Math.min(cur, 4);
  prog.style.width = ((order[cur] === 'done' ? 5 : cur) / 5 * 100) + '%';
  count.textContent = order[cur] === 'done' ? 'Terminé' : (n + 1) + ' sur 5';
  back.disabled = cur === 0;
  form.classList.toggle('is-done', order[cur] === 'done');
}
function next(){ if(cur < 4) show(cur + 1, 1); }
back.addEventListener('click', function(){ if(cur > 0) show(order[cur] === 'done' ? 4 : cur - 1, -1); });

/* Étape 1 : besoins (choix multiples) */
var needStep = stepEl(0), needBtn = needStep.querySelector('.cfg-next');
needStep.addEventListener('change', function(){
  state.need = [].slice.call(needStep.querySelectorAll('input:checked')).map(function(x){ return x.value; });
  needBtn.disabled = !state.need.length;
  setBrief('need', state.need.join(', '));
});
needBtn.addEventListener('click', next);

/* Étapes 2 à 4 : un clic suffit, on passe à la suite */
['stage','size','when'].forEach(function(k){
  var el = stepEl(order.indexOf(k));
  el.addEventListener('change', function(e){
    state[k] = e.target.value; setBrief(k, e.target.value);
    setTimeout(next, reduce ? 0 : 260);
  });
});

/* Étape 5 : coordonnées, le brief se met à jour pendant la saisie */
['name','email','company','message'].forEach(function(k){
  var el = form.elements[k];
  el.addEventListener('input', function(){
    state[k] = el.value.trim(); el.closest('.field').classList.remove('err');
    if(!form.querySelector('.field.err')) err.textContent = '';
    if(k === 'name' || k === 'company') setBrief('who', who());
  });
});

function text(){
  return [
    'Brief ' + ref,
    '',
    'Besoin : ' + (state.need.join(', ') || '-'),
    'Situation : ' + (state.stage || '-'),
    'Entreprise : ' + (state.size || '-'),
    'Démarrage : ' + (state.when || '-'),
    '',
    'Contact : ' + state.name + (state.company ? ', ' + state.company : ''),
    'E-mail : ' + state.email,
    state.message ? '\nProjet : ' + state.message : ''
  ].join('\n').trim();
}

form.addEventListener('submit', function(e){
  e.preventDefault();
  if(order[cur] !== 'who') return;
  var bad = [];
  if(!state.name) bad.push('name');
  if(!/^\S+@\S+\.\S+$/.test(state.email)) bad.push('email');
  bad.forEach(function(k){ form.elements[k].closest('.field').classList.add('err'); });
  if(bad.length){
    err.textContent = bad.length === 2 ? 'Indiquez votre nom et une adresse e-mail valide.' : (bad[0] === 'name' ? 'Indiquez votre nom.' : 'Indiquez une adresse e-mail valide, par exemple nom@entreprise.com.');
    form.elements[bad[0]].focus(); return;
  }
  err.textContent = '';
  var subject = 'Brief ' + ref + ' : ' + state.need.join(', ');
  document.getElementById('cfgSend').href = 'mailto:contact@abboute.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text());
  var sum = document.getElementById('doneSum');
  if(sum) sum.innerHTML = brief.querySelector('dl').innerHTML;
  brief.classList.add('ready');
  document.getElementById('briefState').textContent = 'Prêt';
  show(5, 1);
});

document.getElementById('cfgCopy').addEventListener('click', function(){
  var b = this, t = text();
  var ok = function(){ b.querySelector('.btn-label') ? b.querySelector('.btn-label').textContent = 'Brief copié' : b.textContent = 'Brief copié'; };
  if(navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function(){});
  else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch(x){} a.remove(); }
});
document.getElementById('cfgEdit').addEventListener('click', function(){
  brief.classList.remove('ready'); document.getElementById('briefState').textContent = 'En cours';
  show(0, -1);
});

/* Clavier : 1 à 6 pour répondre, Entrée pour continuer */
new IntersectionObserver(function(en){ inView = en[0].isIntersecting; }, { threshold: 0.35 }).observe(form);
document.addEventListener('keydown', function(e){
  if(!inView || e.metaKey || e.ctrlKey || e.altKey) return;
  var tag = (e.target.tagName || '').toLowerCase();
  if(tag === 'input' && e.target.type !== 'checkbox' && e.target.type !== 'radio') return;
  if(tag === 'textarea') return;
  var step = stepEl(cur), n = parseInt(e.key, 10);
  if(n >= 1 && n <= 9){
    var inputs = step.querySelectorAll('input[type=checkbox], input[type=radio]');
    var inp = inputs[n - 1]; if(!inp) return;
    e.preventDefault();
    if(inp.type === 'checkbox') inp.checked = !inp.checked; else inp.checked = true;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  } else if(e.key === 'Enter' && order[cur] === 'need' && state.need.length){
    e.preventDefault(); next();
  }
});

ui();
})();
