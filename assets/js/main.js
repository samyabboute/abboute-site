(function(){
'use strict';
var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---- LOADER ---- */
var loader=document.getElementById('loader'), bar=document.getElementById('loaderBar');
var p=0;
var li=setInterval(function(){
  p=Math.min(100,p+Math.random()*18+6);
  if(bar)bar.style.width=p+'%';
  if(p>=100){clearInterval(li);setTimeout(done,350);}
},140);
function done(){
  if(loader)loader.classList.add('done');
  document.body.classList.add('ready');
  setTimeout(function(){if(loader)loader.style.display='none';},800);
}
if(reduce){clearInterval(li);done();}

/* ---- CUSTOM CURSOR (magnetic) ---- */
var cur=document.getElementById('cursor'), dot=document.getElementById('cursorDot');
var mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my;
if(cur && !('ontouchstart' in window)){
  addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';});
  (function loop(){cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cur.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();
  document.querySelectorAll('[data-cursor="hover"]').forEach(function(el){
    el.addEventListener('mouseenter',function(){cur.classList.add('hov');});
    el.addEventListener('mouseleave',function(){cur.classList.remove('hov');});
  });
}

/* ---- PROGRESS ---- */
var prog=document.getElementById('prog');
addEventListener('scroll',function(){
  var h=document.documentElement.scrollHeight-innerHeight;
  if(prog)prog.style.width=(h>0?scrollY/h*100:0)+'%';
},{passive:true});

/* ---- SPLIT text for reveals ---- */
document.querySelectorAll('[data-reveal-lines]').forEach(function(el){
  var html=el.innerHTML.split('<br>');
  el.innerHTML=html.map(function(l){return '<span class="rl" style="display:block;overflow:hidden"><span style="display:block" class="rl-i">'+l+'</span></span>';}).join('');
});
document.querySelectorAll('[data-reveal-words]').forEach(function(el){
  var words=el.textContent.trim().split(' ');
  el.innerHTML=words.map(function(w){return '<span class="rw">'+w+'</span>';}).join(' ');
});

/* ---- REVEAL on scroll ---- */
function reveal(){
  var items=document.querySelectorAll('[data-reveal],[data-reveal-lines] .rl,[data-reveal-words] .rw');
  if(!('IntersectionObserver' in window)){items.forEach(function(i){i.classList.add('is-in');});return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var el=e.target;
        var sibs=Array.prototype.indexOf.call(el.parentNode.children,el);
        el.style.animationDelay=(sibs*0.07)+'s';
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  },{threshold:.2,rootMargin:'0px 0px -6% 0px'});
  items.forEach(function(i){io.observe(i);});
}
reveal();

/* ---- COUNTERS ---- */
document.querySelectorAll('[data-count]').forEach(function(el){
  var target=+el.getAttribute('data-count'),done=false;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting && !done){done=true;var n=0;var t=setInterval(function(){n++;el.textContent=n;if(n>=target)clearInterval(t);},260);}
    });
  },{threshold:.6});
  io.observe(el);
});

/* ---- HERO parallax ---- */
if(!reduce){
  var orbs=document.querySelectorAll('.orb');
  addEventListener('scroll',function(){
    var y=scrollY;
    orbs.forEach(function(o,i){o.style.transform='translateY('+(y*(i?.12:.2))+'px)';});
  },{passive:true});
}

/* ---- MOBILE MENU ---- */
var burger=document.getElementById('burger'),nav=document.getElementById('nav');
if(burger){
  burger.addEventListener('click',function(){
    var o=nav.classList.toggle('open');burger.classList.toggle('on',o);
    document.body.style.overflow=o?'hidden':'';
  });
  nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');burger.classList.remove('on');document.body.style.overflow='';});});
}
})();
