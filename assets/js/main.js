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
if(reduce) start(); else setTimeout(start, 1750);

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

/* Apparitions : un seul mouvement par bloc */
if(gsap && ST && !reduce){
  gsap.registerPlugin(ST);
  document.querySelectorAll('[data-reveal]').forEach(function(el){
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  document.querySelectorAll('[data-reveal-list]').forEach(function(list){
    gsap.to(list.children, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
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
