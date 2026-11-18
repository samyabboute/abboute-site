/* Nexus : comportements du site */
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
var darkSecs = [].slice.call(document.querySelectorAll('.sec-ink, .sec-blue, .manifesto, .footer'));
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
  if(mob){ var cr = contact.getBoundingClientRect(); mob.classList.toggle('show', pastHero && cr.top > innerHeight * 0.6); }
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

function closeMenu(){ links.classList.remove('open'); nav.classList.remove('open-menu'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', window.NX ? NX.t('Ouvrir le menu','Open menu','فتح القائمة') : 'Ouvrir le menu'); body.style.overflow = ''; if(window.lenis) lenis.start(); }
burger.addEventListener('click', function(){
  if(links.classList.contains('open')) return closeMenu();
  links.classList.add('open'); nav.classList.add('open-menu'); nav.classList.remove('hide');
  burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', window.NX ? NX.t('Fermer le menu','Close menu','إغلاق القائمة') : 'Fermer le menu');
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

/* Aujourd'hui / Avec Nexus : bascule, puis passe seul à « Avec Nexus » à la première lecture */
var ba = document.getElementById('avant-apres');
if(ba){
  var baBtns = ba.querySelectorAll('[data-ba]'), touched = false;
  var setBA = function(after){
    ba.classList.toggle('is-after', after);
    baBtns.forEach(function(b){ b.setAttribute('aria-pressed', String((b.dataset.ba === 'after') === after)); });
    ba.querySelectorAll('.ba-before').forEach(function(f){ f.setAttribute('aria-hidden', String(after)); });
    ba.querySelectorAll('.ba-after').forEach(function(f){ f.setAttribute('aria-hidden', String(!after)); });
  };
  baBtns.forEach(function(b){ b.addEventListener('click', function(){ touched = true; setBA(b.dataset.ba === 'after'); }); });
  var io = new IntersectionObserver(function(en){
    if(en[0].isIntersecting){ io.disconnect(); setTimeout(function(){ if(!touched) setBA(true); }, reduce ? 0 : 1400); }
  }, { threshold: 0.45 });
  io.observe(document.getElementById('baGrid'));
}

/* Galerie : onglets, défilement automatique avec barre de progression */
var gal = document.getElementById('gallery');
if(gal){
  var tabs = [].slice.call(gal.querySelectorAll('[role=tab]')), panes = [].slice.call(gal.querySelectorAll('.pane'));
  var gi = 0, auto = !reduce, seen = false, hover = false, t0g = 0, DUR = 6500;
  var select = function(i, focus){
    gi = (i + tabs.length) % tabs.length;
    tabs.forEach(function(t, j){ var on = j === gi; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; t.querySelector('.tab-bar i').style.transform = 'scaleX(0)'; });
    panes.forEach(function(p, j){ p.classList.toggle('on', j === gi); });
    if(focus) tabs[gi].focus();
    t0g = performance.now();
  };
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ auto = false; select(i); });
    t.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if(document.documentElement.dir === 'rtl' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) d = -d;
      if(d){ e.preventDefault(); auto = false; select(gi + d, true); }
    });
  });
  gal.addEventListener('pointerenter', function(){ hover = true; });
  gal.addEventListener('pointerleave', function(){ hover = false; t0g = performance.now() - (parseFloat(tabs[gi].querySelector('.tab-bar i').dataset.p || 0) * DUR); });
  new IntersectionObserver(function(en){ seen = en[0].isIntersecting; if(seen) t0g = performance.now(); }, { threshold: 0.3 }).observe(gal);
  (function tick(){
    requestAnimationFrame(tick);
    if(!auto || !seen || hover || document.hidden) return;
    var p = Math.min(1, (performance.now() - t0g) / DUR), bar = tabs[gi].querySelector('.tab-bar i');
    bar.style.transform = 'scaleX(' + p + ')'; bar.dataset.p = p;
    if(p >= 1) select(gi + 1);
  })();
}

/* Contact : copier l'adresse e-mail */
var cm = document.getElementById('copyMail');
if(cm) cm.addEventListener('click', function(){
  var tag = cm.querySelector('span'), mail = cm.dataset.mail;
  var T = function(a,b,c){ return window.NX ? NX.t(a,b,c) : a; };
  var done = function(){ tag.textContent = T('Copiée', 'Copied', 'تم النسخ'); setTimeout(function(){ tag.textContent = T('Copier', 'Copy', 'نسخ'); }, 1800); };
  if(navigator.clipboard) navigator.clipboard.writeText(mail).then(done, function(){ location.href = 'mailto:' + mail; });
  else location.href = 'mailto:' + mail;
});
})();
