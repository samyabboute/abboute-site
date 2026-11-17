(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var body = document.body;
var gsap = window.gsap, ST = window.ScrollTrigger;
if(gsap && !reduce) document.documentElement.classList.add('js-reveal');

/* Chargement : une seule séquence */
var loader = document.getElementById('loader');
function start(){
  if(loader) loader.classList.add('out');
  setTimeout(function(){ body.classList.add('ready'); }, reduce ? 0 : 350);
  setTimeout(function(){ if(loader) loader.remove(); }, 1400);
}
/* L'écran de chargement s'ouvre quand le globe est prêt (au moins 0,9 s pour le logo, au plus 3,5 s) */
var t0 = performance.now(), started = false;
function go(){ if(started) return; started = true; var wait = Math.max(0, 900 - (performance.now() - t0)); setTimeout(start, wait); }
if(reduce) start();
else {
  if(window.__globeReady) go(); else addEventListener('globe:ready', go, { once: true });
  setTimeout(go, 3500);
}

/* Navigation */
var nav = document.getElementById('nav');
var links = document.getElementById('navLinks');
var burger = document.getElementById('burger');
var lastY = 0;
function onScroll(){
  var y = scrollY;
  nav.classList.toggle('solid', y > 30);
  nav.classList.toggle('hide', y > 500 && y > lastY + 2 && !links.classList.contains('open'));
  if(y < lastY - 2) nav.classList.remove('hide');
  lastY = y;
}
addEventListener('scroll', onScroll, {passive:true});
burger.addEventListener('click', function(){
  var open = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  body.style.overflow = open ? 'hidden' : '';
  if(window.lenis){ open ? lenis.stop() : lenis.start(); }
});
links.querySelectorAll('a').forEach(function(a){
  a.addEventListener('click', function(){
    links.classList.remove('open'); burger.setAttribute('aria-expanded', false); body.style.overflow = ''; if(window.lenis) lenis.start();
  });
});

/* Méthode : la ligne avance avec le défilement */
var steps = document.getElementById('steps');
if(steps){
  var items = steps.querySelectorAll('.step');
  function prog(){
    var b = steps.getBoundingClientRect();
    var p = (innerHeight*0.75 - b.top) / (b.height + innerHeight*0.25);
    p = Math.max(0, Math.min(1, p));
    steps.style.setProperty('--p', p);
    items.forEach(function(it, i){ it.classList.toggle('on', p >= i/(items.length-1) - 0.001); });
  }
  addEventListener('scroll', prog, {passive:true}); prog();
}


/* Défilement fluide, synchronisé avec GSAP */
if(window.Lenis && gsap && !reduce){
  window.lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: { offset: -20 } });
  if(ST){ gsap.registerPlugin(ST); lenis.on('scroll', ST.update); }
  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
}

/* Animations façon Apple : apparitions floues, démo qui se redresse, héros qui s'efface */
if(gsap && ST && !reduce){
  gsap.registerPlugin(ST);
  var ease = 'power3.out';
  document.querySelectorAll('[data-reveal]').forEach(function(el){
    gsap.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: ease, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('[data-reveal-list]').forEach(function(list){
    gsap.to(list.children, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: ease, stagger: 0.09, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  });
  var app = document.getElementById('app');
  if(app){
    gsap.fromTo(app, { rotationX: 24, scale: 0.84, y: 80, transformPerspective: 1800, transformOrigin: '50% 0%' },
      { rotationX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: app, start: 'top 98%', end: 'top 22%', scrub: 0.8 } });
  }
  var heroIn = document.querySelector('.hero-inner');
  if(heroIn){
    gsap.to(heroIn, { y: -90, opacity: 0, filter: 'blur(10px)', ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: 0.5 } });
  }
  var why = document.querySelector('.why-title');
  if(why){
    why.removeAttribute('data-reveal');
    gsap.fromTo(why, { scale: 0.82, opacity: 0.2, transformOrigin: '0% 50%' },
      { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: why, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
  }
}

/* Manifeste : les mots s'allument au fil du défilement */
var mf = document.getElementById('manifesto');
if(mf && gsap && ST && !reduce){
  mf.setAttribute('aria-label', mf.textContent);
  mf.innerHTML = mf.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
  gsap.to(mf.querySelectorAll('.w'), { opacity: 1, ease: 'none', stagger: 0.12,
    scrollTrigger: { trigger: mf, start: 'top 78%', end: 'bottom 42%', scrub: 0.4 } });
}

/* Expertises : un aperçu d'interface suit le curseur (ordinateur) ou s'affiche dans la ligne (mobile) */
var pv = document.getElementById('pv'), sols = document.querySelectorAll('.sol[data-pv]');
if(pv && sols.length){
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth > 900;
  if(fine && gsap){
    var xTo = gsap.quickTo(pv, 'x', { duration: 0.55, ease: 'power3' });
    var yTo = gsap.quickTo(pv, 'y', { duration: 0.55, ease: 'power3' });
    var rTo = gsap.quickTo(pv, 'rotation', { duration: 0.6, ease: 'power3' });
    var px = 0, shown = false;
    gsap.set(pv, { scale: 0.7, rotation: 0 });
    var move = function(e){
      var x = Math.min(e.clientX + 28, innerWidth - 360), y = Math.max(16, Math.min(e.clientY - 107, innerHeight - 230));
      xTo(x); yTo(y); rTo(Math.max(-4, Math.min(4, (e.clientX - px) * 0.3))); px = e.clientX;
    };
    sols.forEach(function(s){
      s.addEventListener('pointerenter', function(e){
        pv.querySelectorAll('.pv-panel').forEach(function(p){ p.classList.toggle('on', p.dataset.k === s.dataset.pv); });
        if(!shown){ gsap.set(pv, { x: Math.min(e.clientX + 28, innerWidth - 360), y: e.clientY - 107 }); px = e.clientX; }
        shown = true;
        gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
      });
      s.addEventListener('pointermove', move);
    });
    document.querySelector('.sol-list').addEventListener('pointerleave', function(){
      shown = false; gsap.to(pv, { autoAlpha: 0, scale: 0.7, duration: 0.35, ease: 'power2.in', overwrite: 'auto' });
    });
  } else {
    sols.forEach(function(s){
      var src = pv.querySelector('.pv-panel[data-k="' + s.dataset.pv + '"]');
      if(!src) return;
      var box = document.createElement('div'); box.className = 'pv-inline'; box.setAttribute('aria-hidden', 'true');
      box.appendChild(src.cloneNode(true)); s.appendChild(box);
    });
    pv.remove();
  }
}


/* Boutons : flèche animée et effet magnétique */
var arrow = '<svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
document.querySelectorAll('.btn-primary').forEach(function(b){
  if(b.querySelector('.btn-ic')) return;
  var t = document.createElement('span'); t.className = 'btn-label';
  while(b.firstChild) t.appendChild(b.firstChild);
  b.appendChild(t);
  var ic = document.createElement('span'); ic.className = 'btn-ic'; ic.setAttribute('aria-hidden', 'true'); ic.innerHTML = arrow + arrow;
  b.appendChild(ic);
});
if(gsap && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.querySelectorAll('.btn, .nav-cta').forEach(function(b){
    var xT = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yT = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
    b.addEventListener('pointermove', function(e){
      var r = b.getBoundingClientRect();
      xT((e.clientX - r.left - r.width / 2) * 0.18); yT((e.clientY - r.top - r.height / 2) * 0.3);
    });
    b.addEventListener('pointerleave', function(){ xT(0); yT(0); });
  });
}

/* Lumière qui suit le pointeur sur les cartes */
document.querySelectorAll('.why-card').forEach(function(c){
  c.addEventListener('pointermove', function(e){
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

/* Contact : prépare un e-mail réel (site statique, sans serveur) */
var form = document.getElementById('contactForm');
if(form){
  var status = document.getElementById('formStatus');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var bad = [];
    ['cf-name','cf-mail','cf-msg'].forEach(function(id){
      var el = document.getElementById(id), f = el.closest('.field');
      var ok = el.value.trim() !== '' && (el.type !== 'email' || /\S+@\S+\.\S+/.test(el.value));
      f.classList.toggle('err', !ok); if(!ok) bad.push(el);
    });
    if(bad.length){
      status.className = 'form-status bad';
      status.textContent = 'Complétez le nom, une adresse e-mail valide et la description du projet.';
      bad[0].focus(); return;
    }
    var d = new FormData(form);
    var subject = 'Projet ' + d.get('need') + ' — ' + (d.get('company') || d.get('name'));
    var bodyTxt = 'Nom : ' + d.get('name') + '\nE-mail : ' + d.get('email') + '\nEntreprise : ' + (d.get('company')||'-') + '\nBesoin : ' + d.get('need') + '\n\n' + d.get('message');
    location.href = 'mailto:contact@abboute.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyTxt);
    status.className = 'form-status';
    status.textContent = 'Votre messagerie s’ouvre avec la demande préremplie. Il ne reste qu’à l’envoyer.';
  });
}
})();
