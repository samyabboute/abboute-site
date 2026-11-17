(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var body = document.body;

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
addEventListener('scroll', function(){ nav.classList.toggle('solid', scrollY > 30); }, {passive:true});
burger.addEventListener('click', function(){
  var open = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  body.style.overflow = open ? 'hidden' : '';
});
links.querySelectorAll('a').forEach(function(a){
  a.addEventListener('click', function(){
    links.classList.remove('open'); burger.setAttribute('aria-expanded', false); body.style.overflow = '';
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
