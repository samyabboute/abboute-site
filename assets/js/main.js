/* ABBOUTE Global Trading : comportements du site */
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var body = document.body, gsap = window.gsap, ST = window.ScrollTrigger, mfTween = null;
var T = function(en, fr, de){ return window.NX ? NX.t(en, fr, de) : en; };
if(gsap && ST) gsap.registerPlugin(ST);
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

/* Navigation */
var nav = document.getElementById('nav'), links = document.getElementById('navLinks'), burger = document.getElementById('burger');
var hero = document.querySelector('.hero'), bar = document.getElementById('progress'), mob = document.getElementById('mobCta');
var contact = document.getElementById('contact'), lastY = 0;
var darkSecs = [].slice.call(document.querySelectorAll('.sec-ink, .statement, .footer'));
var spy = [].slice.call(links.querySelectorAll('a[href^="#"]:not(.btn)')).map(function(a){ return { a: a, s: document.querySelector(a.getAttribute('href')) }; });
function onScroll(){
  var y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  var pastHero = y > hero.offsetHeight - 80;
  var onDark = darkSecs.some(function(s){ var r = s.getBoundingClientRect(); return r.top < 40 && r.bottom > 40; });
  nav.classList.toggle('light', y > 30 && !onDark);
  nav.classList.toggle('dark-sec', onDark);
  if(!links.classList.contains('open')){
    if(y > lastY + 4 && y > 400) nav.classList.add('hide');
    else if(y < lastY - 4) nav.classList.remove('hide');
  }
  lastY = y;
  if(bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
  var cur = null;
  spy.forEach(function(o){ if(o.s && o.s.getBoundingClientRect().top < innerHeight * 0.4) cur = o; });
  spy.forEach(function(o){ o.a.classList.toggle('active', o === cur); });
  if(mob){ var cr = contact.getBoundingClientRect(); mob.classList.toggle('show', pastHero && cr.top > innerHeight * 0.6); }
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

function closeMenu(){
  links.classList.remove('open'); nav.classList.remove('open-menu');
  burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', T('Open menu', 'Ouvrir le menu', 'Menü öffnen'));
  body.style.overflow = ''; if(window.lenis) lenis.start();
}
burger.addEventListener('click', function(){
  if(links.classList.contains('open')) return closeMenu();
  links.classList.add('open'); nav.classList.add('open-menu'); nav.classList.remove('hide');
  burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', T('Close menu', 'Fermer le menu', 'Menü schließen'));
  body.style.overflow = 'hidden'; if(window.lenis) lenis.stop();
});
links.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
addEventListener('keydown', function(e){ if(e.key === 'Escape' && links.classList.contains('open')) closeMenu(); });

/* Apparitions, sortie du héros */
if(gsap && ST && !reduce){
  document.querySelectorAll('[data-reveal]').forEach(function(el){
    gsap.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('[data-reveal-list]').forEach(function(list){
    gsap.to(list.children, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: list, start: 'top 86%', once: true } });
  });
  gsap.fromTo(['.hero-inner', '.hero-facts'], { y: 0, opacity: 1 }, { y: -70, opacity: 0, ease: 'none', immediateRender: false,
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 35%', scrub: 0.4 } });
}

/* Déclaration : les mots s'allument au fil du défilement */
function splitStatement(){
  var mf = document.getElementById('manifesto');
  if(!mf || !gsap || !ST || reduce) return;
  if(mfTween){ if(mfTween.scrollTrigger) mfTween.scrollTrigger.kill(); mfTween.kill(); }
  mf.setAttribute('aria-label', mf.textContent.trim());
  mf.innerHTML = mf.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
  mfTween = gsap.to(mf.querySelectorAll('.w'), { color: '#ffffff', ease: 'none', stagger: 0.1, scrollTrigger: { trigger: mf, start: 'top 80%', end: 'bottom 50%', scrub: 0.3 } });
}
splitStatement();
addEventListener('nx:lang', function(){ splitStatement(); if(ST) ST.refresh(); });

/* Parcours : le conteneur avance sur la ligne avec la lecture */
var route = document.getElementById('route'), box = document.getElementById('routeBox'), fill = document.getElementById('routeFill');
var cs = [].slice.call(document.querySelectorAll('.cstep'));
function onRoute(){
  var sec = document.getElementById('corridor'); if(!sec) return;
  var r = sec.getBoundingClientRect();
  var p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height * 0.75)));
  if(route && box && route.offsetWidth){
    var w = route.offsetWidth - box.offsetWidth;
    box.style.transform = 'translateX(' + (w * p).toFixed(1) + 'px)';
    fill.style.transform = 'scaleX(' + p + ')';
  }
  cs.forEach(function(c, i){ c.classList.toggle('on', p >= i / (cs.length - 1) - 0.02); });
}
addEventListener('scroll', onRoute, { passive: true }); addEventListener('resize', onRoute); onRoute();

/* Dans les deux sens : bascule, puis passe seule à l'autre sens à la première lecture */
var tw = document.getElementById('two-ways');
if(tw){
  var wbtns = tw.querySelectorAll('[data-way]'), touched = false;
  var setWay = function(w){
    tw.classList.toggle('is-a2e', w === 'a2e');
    wbtns.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.way === w)); });
    tw.querySelectorAll('[data-way-list]').forEach(function(l){ var on = l.dataset.wayList === w; l.classList.toggle('on', on); l.setAttribute('aria-hidden', String(!on)); });
  };
  wbtns.forEach(function(b){ b.addEventListener('click', function(){ touched = true; setWay(b.dataset.way); }); });
  var io = new IntersectionObserver(function(en){
    if(en[0].isIntersecting){ io.disconnect(); setTimeout(function(){ if(!touched) setWay('a2e'); }, reduce ? 0 : 2600); }
  }, { threshold: 0.5 });
  io.observe(document.getElementById('ways'));
}

/* Copier l'adresse e-mail */
var cm = document.getElementById('copyMail');
if(cm) cm.addEventListener('click', function(){
  var tag = cm.querySelector('span'), mail = cm.dataset.mail;
  var done = function(){ tag.textContent = T('Copied', 'Copiée', 'Kopiert'); setTimeout(function(){ tag.textContent = T('Copy', 'Copier', 'Kopieren'); }, 1800); };
  if(navigator.clipboard) navigator.clipboard.writeText(mail).then(done, function(){ location.href = 'mailto:' + mail; });
  else location.href = 'mailto:' + mail;
});
})();
