/* Nexus : comportements du site */
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
var body = document.body, gsap = window.gsap, ST = window.ScrollTrigger, mfTween = null;
if(gsap && ST){ gsap.registerPlugin(ST); }
if(gsap && !reduce) document.documentElement.classList.add('js-reveal');

/* Chargement : s'ouvre dès que le globe est prêt (0,7 s minimum, 3 s maximum) */
var loader = document.getElementById('loader'), t0 = performance.now(), started = false;
function start(){
  if(started) return; started = true;
  var wait = reduce ? 0 : Math.max(0, 700 - (performance.now() - t0));
  setTimeout(function(){
    if(loader) loader.classList.add('out');
    body.classList.add('ready');
    setTimeout(function(){ if(loader) loader.remove(); }, 900);
  }, wait);
}
if(reduce || window.__globeReady) start(); else addEventListener('globe:ready', start, { once: true });
setTimeout(start, 3000);

/* Défilement fluide */
if(window.Lenis && gsap && !reduce){
  window.lenis = new Lenis({ lerp: 0.1, anchors: { offset: -64 } });
  if(ST) lenis.on('scroll', ST.update);
  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
}

/* Navigation : couleur selon la section, masquée en descendant, section active */
var nav = document.getElementById('nav'), links = document.getElementById('navLinks'), burger = document.getElementById('burger');
var hero = document.querySelector('.hero'), bar = document.getElementById('progress'), mob = document.getElementById('mobCta');
var darkSecs = [].slice.call(document.querySelectorAll('.sec-ink, .sec-blue, .manifesto, .day, .footer'));
var spy = [].slice.call(links.querySelectorAll('a[href^="#"]:not(.btn)')).map(function(a){ return { a: a, s: document.querySelector(a.getAttribute('href')) }; });
var contact = document.getElementById('contact'), lastY = 0;
function onScroll(){
  var y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  var pastHero = y > hero.offsetHeight - 70;
  var onDark = darkSecs.some(function(s){ var r = s.getBoundingClientRect(); return r.top < 40 && r.bottom > 40; });
  nav.classList.toggle('light', pastHero && !onDark);
  nav.classList.toggle('dark-sec', pastHero && onDark);
  if(!links.classList.contains('open')){
    if(y > lastY + 4 && y > 400) nav.classList.add('hide');
    else if(y < lastY - 4) nav.classList.remove('hide');
  }
  lastY = y;
  if(bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
  var cur = null;
  spy.forEach(function(o){ if(o.s && o.s.getBoundingClientRect().top < innerHeight * 0.4) cur = o; });
  spy.forEach(function(o){ o.a.classList.toggle('active', o === cur); });
  if(mob){ var cr = contact.getBoundingClientRect(), dr = document.getElementById('day').getBoundingClientRect(); mob.classList.toggle('show', pastHero && cr.top > innerHeight * 0.6 && !(dr.top < innerHeight && dr.bottom > 0)); }
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

function closeMenu(){ links.classList.remove('open'); nav.classList.remove('open-menu'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu'); body.style.overflow = ''; if(window.lenis) lenis.start(); }
burger.addEventListener('click', function(){
  if(links.classList.contains('open')) return closeMenu();
  links.classList.add('open'); nav.classList.add('open-menu'); nav.classList.remove('hide');
  burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
  body.style.overflow = 'hidden'; if(window.lenis) lenis.stop();
});
links.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
addEventListener('keydown', function(e){ if(e.key === 'Escape' && links.classList.contains('open')) closeMenu(); });

/* Apparitions et animations liées au défilement */
if(gsap && ST && !reduce){
  document.querySelectorAll('[data-reveal]').forEach(function(el){
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('[data-reveal-list]').forEach(function(list){
    gsap.to(list.children, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: list, start: 'top 86%', once: true } });
  });
  var heroIn = document.querySelector('.hero-inner');
  gsap.fromTo([heroIn, '.hero-facts'], { y: 0, opacity: 1 }, { y: -60, opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 40%', scrub: 0.4 } });
  var app = document.getElementById('app');
  if(app) gsap.fromTo(app, { rotationX: 16, scale: 0.92, y: 50, transformPerspective: 1800, transformOrigin: '50% 0%' },
    { rotationX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: app, start: 'top 98%', end: 'top 30%', scrub: 0.6 } });
  splitManifesto();

}

/* Manifeste : les mots s'allument au fil du défilement, dans la langue affichée */
function splitManifesto(){
  var mf = document.getElementById('manifesto');
  if(!mf || !gsap || !ST || reduce) return;
  if(mfTween){ mfTween.scrollTrigger && mfTween.scrollTrigger.kill(); mfTween.kill(); }
  mf.setAttribute('aria-label', mf.textContent.trim());
  mf.innerHTML = mf.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
  mfTween = gsap.to(mf.querySelectorAll('.w'), { color: '#ffffff', ease: 'none', stagger: 0.1, scrollTrigger: { trigger: mf, start: 'top 80%', end: 'bottom 50%', scrub: 0.3 } });
}
addEventListener('nx:lang', function(){ splitManifesto(); if(ST) ST.refresh(); });

/* Une journée avec Nexus : l'horloge avance, le ciel change */
var day = document.getElementById('day');
if(day){
  var scenes = [].slice.call(day.querySelectorAll('.scene')), clock = document.getElementById('dayClock'), rail = document.getElementById('dayRail');
  var pin = day.querySelector('.day-pin');
  var sky = [[14,22,48],[31,59,255],[28,48,200],[30,28,70],[11,13,18]];
  var mins = scenes.map(function(s){ var p = s.dataset.time.split(':'); return +p[0] * 60 + +p[1]; });
  var cur = 0, shownMin = mins[0], tw = { v: mins[0] };
  var fmt = function(v){ v = Math.round(v); return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
  var updDay = function(){
    if(reduce) return;
    var r = day.getBoundingClientRect(), total = day.offsetHeight - innerHeight;
    var p = Math.max(0, Math.min(1, -r.top / total));
    var f = p * (sky.length - 1), a = Math.floor(f), b = Math.min(sky.length - 1, a + 1), q = f - a;
    var c = sky[a].map(function(x, j){ return Math.round(x + (sky[b][j] - x) * q); });
    pin.style.background = 'rgb(' + c.join(',') + ')';
    if(rail) rail.style.transform = 'scaleX(' + p + ')';
    var idx = Math.min(scenes.length - 1, Math.floor(p * scenes.length * 0.999));
    if(idx !== cur){
      scenes[cur].classList.remove('on'); scenes[idx].classList.add('on'); cur = idx;
      if(gsap){ gsap.to(tw, { v: mins[idx], duration: 0.9, ease: 'power2.inOut', onUpdate: function(){ clock.textContent = fmt(tw.v); } }); }
      else clock.textContent = scenes[idx].dataset.time;
    }
  };
  addEventListener('scroll', updDay, { passive: true }); addEventListener('resize', updDay); updDay();
}

/* Méthode : la ligne avance avec la lecture */
var steps = document.getElementById('steps');
if(steps){
  var items = steps.querySelectorAll('.step');
  var prog = function(){
    var b = steps.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (innerHeight * 0.7 - b.top) / (b.height + innerHeight * 0.2)));
    steps.style.setProperty('--p', p);
    items.forEach(function(it, i){ it.classList.toggle('on', p >= i / (items.length - 1) - 0.001); });
  };
  addEventListener('scroll', prog, { passive: true }); prog();
}

/* Services : accordéon */
document.querySelectorAll('.svc-head').forEach(function(btn){
  btn.addEventListener('click', function(){
    var open = btn.getAttribute('aria-expanded') === 'true';
    var bodyEl = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(!open));
    if(open){
      if(gsap && !reduce) gsap.to(bodyEl, { height: 0, duration: 0.4, ease: 'power3.inOut', onComplete: function(){ bodyEl.hidden = true; bodyEl.style.height = ''; } });
      else bodyEl.hidden = true;
    } else {
      bodyEl.hidden = false;
      if(gsap && !reduce) gsap.fromTo(bodyEl, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'power3.out' });
    }
    if(ST) setTimeout(function(){ ST.refresh(); }, 520);
  });
});

/* Services : aperçu d'interface qui suit le curseur (ordinateur) ou intégré (mobile) */
var pv = document.getElementById('pv'), svcs = document.querySelectorAll('.svc[data-pv]');
if(pv && svcs.length){
  if(fine && innerWidth > 900 && gsap){
    var xTo = gsap.quickTo(pv, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(pv, 'y', { duration: 0.5, ease: 'power3' });
    var shown = false;
    gsap.set(pv, { scale: 0.85 });
    var place = function(e){ return { x: Math.min(e.clientX + 26, innerWidth - 340), y: Math.max(14, Math.min(e.clientY - 102, innerHeight - 220)) }; };
    svcs.forEach(function(s){
      s.addEventListener('pointerenter', function(e){
        pv.querySelectorAll('.pv-panel').forEach(function(p){ p.classList.toggle('on', p.dataset.k === s.dataset.pv); });
        if(!shown){ var q = place(e); gsap.set(pv, { x: q.x, y: q.y }); }
        shown = true; gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      });
      s.addEventListener('pointermove', function(e){ var q = place(e); xTo(q.x); yTo(q.y); });
    });
    document.querySelector('.svc-list').addEventListener('pointerleave', function(){
      shown = false; gsap.to(pv, { autoAlpha: 0, scale: 0.85, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
    });
  } else {
    svcs.forEach(function(s){
      var src = pv.querySelector('.pv-panel[data-k="' + s.dataset.pv + '"]'); if(!src) return;
      var box = document.createElement('div'); box.className = 'pv-inline'; box.setAttribute('aria-hidden', 'true');
      box.appendChild(src.cloneNode(true)); s.querySelector('.svc-body').appendChild(box);
    });
    pv.remove();
  }
}

/* Contact : copier l'adresse e-mail */
var cm = document.getElementById('copyMail');
if(cm) cm.addEventListener('click', function(){
  var tag = cm.querySelector('span'), mail = cm.dataset.mail;
  var done = function(){ tag.textContent = 'Copiée'; setTimeout(function(){ tag.textContent = 'Copier'; }, 1800); };
  if(navigator.clipboard) navigator.clipboard.writeText(mail).then(done, function(){ location.href = 'mailto:' + mail; });
  else location.href = 'mailto:' + mail;
});
})();
