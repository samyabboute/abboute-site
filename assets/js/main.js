(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ========== ANIMATED MESH GRADIENT (signature visuals) ========== */
function Mesh(canvas,opts){
  var ctx=canvas.getContext('2d'),W,H,t=Math.random()*100;
  opts=opts||{};
  var pal=opts.palette;
  var blobs=[];
  function resize(){
    var r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    W=canvas.width=Math.max(1,r.width*dpr);H=canvas.height=Math.max(1,r.height*dpr);
  }
  function seed(){
    blobs=[];
    for(var i=0;i<pal.length;i++){
      blobs.push({
        x:Math.random(),y:Math.random(),
        vx:(Math.random()-.5)*.00016,vy:(Math.random()-.5)*.00016,
        r:.5+Math.random()*.45,c:pal[i],
        px:Math.random()*10
      });
    }
  }
  function draw(){
    t+=reduce?0:.0016;
    ctx.clearRect(0,0,W,H);
    // base
    ctx.fillStyle=opts.base||'#14110d';ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<blobs.length;i++){
      var b=blobs[i];
      var cx=(b.x+Math.sin(t+b.px)*.08)*W;
      var cy=(b.y+Math.cos(t*.8+b.px)*.08)*H;
      b.x+=b.vx;b.y+=b.vy;
      if(b.x<-.2||b.x>1.2)b.vx*=-1;
      if(b.y<-.2||b.y>1.2)b.vy*=-1;
      var rad=b.r*Math.max(W,H);
      var g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
      g.addColorStop(0,b.c);
      g.addColorStop(1,b.c.replace(/[\d.]+\)$/,'0)'));
      ctx.fillStyle=g;
      ctx.fillRect(0,0,W,H);
    }
    ctx.globalCompositeOperation='source-over';
    requestAnimationFrame(draw);
  }
  addEventListener('resize',function(){resize();});
  resize();seed();draw();
}

var palettes={
  hero:{base:'#14110d',palette:['rgba(160,123,62,.55)','rgba(90,70,40,.6)','rgba(40,34,26,.9)','rgba(196,154,83,.35)','rgba(25,22,17,.9)']},
  eu:{base:'#12100c',palette:['rgba(70,90,130,.5)','rgba(160,123,62,.4)','rgba(40,50,70,.7)','rgba(120,140,170,.3)']},
  dz:{base:'#14100b',palette:['rgba(170,110,50,.5)','rgba(120,80,40,.6)','rgba(80,110,70,.4)','rgba(196,154,83,.4)']},
  contact:{base:'#14110d',palette:['rgba(160,123,62,.5)','rgba(60,48,32,.7)','rgba(196,154,83,.3)','rgba(30,26,20,.9)']}
};

var hero=document.getElementById('mesh');if(hero)Mesh(hero,palettes.hero);
var mc=document.getElementById('meshC');if(mc)Mesh(mc,palettes.contact);
document.querySelectorAll('.ent-mesh').forEach(function(c){
  Mesh(c, c.getAttribute('data-seed')==='1'?palettes.eu:palettes.dz);
});

/* ========== LOADER ========== */
var loader=document.getElementById('loader'),pct=document.getElementById('loadpct');
var p=0;
var li=setInterval(function(){
  p=Math.min(100,p+Math.random()*14+7);
  if(pct)pct.textContent=Math.floor(p);
  if(p>=100){clearInterval(li);setTimeout(fin,450);}
},130);
function fin(){document.body.classList.add('ready');if(loader)loader.classList.add('done');setTimeout(function(){if(loader)loader.style.display='none';},1500);}
if(reduce){clearInterval(li);fin();}

/* ========== NAV ========== */
var nav=document.getElementById('nav'),prog=document.getElementById('prog');
addEventListener('scroll',function(){
  var y=scrollY;
  nav.classList.toggle('solid',y>60);
  if(prog){var h=document.documentElement.scrollHeight-innerHeight;prog.style.width=(h>0?y/h*100:0)+'%';}
},{passive:true});

/* ========== SPLIT big statements into lines ========== */
document.querySelectorAll('[data-lines]').forEach(function(el){
  var txt=el.textContent.trim();
  // wrap into words then detect line breaks after layout
  el.innerHTML='<span class="ln"><span>'+txt+'</span></span>';
});
// after fonts load, split by actual lines
function splitLines(){
  document.querySelectorAll('[data-lines]').forEach(function(el){
    var inner=el.querySelector('.ln>span');if(!inner)return;
    var words=inner.textContent.split(' ');
    inner.parentNode.parentNode.innerHTML='';
    var test=document.createElement('span');test.style.visibility='hidden';
    el.appendChild(test);
    var lines=[],cur=[];
    var prevTop=null;
    words.forEach(function(w){
      cur.push(w);test.textContent=cur.join(' ');
    });
    // simpler: measure word by word
    el.innerHTML='';
    var measure=document.createElement('span');measure.style.cssText='position:absolute;visibility:hidden;white-space:nowrap';
    document.body.appendChild(measure);
    var maxw=el.clientWidth;var line='';lines=[];
    words.forEach(function(w){
      var tryl=line?line+' '+w:w;
      measure.style.font=getComputedStyle(el).font;
      measure.textContent=tryl;
      if(measure.offsetWidth>maxw && line){lines.push(line);line=w;}
      else line=tryl;
    });
    if(line)lines.push(line);
    document.body.removeChild(measure);
    el.innerHTML=lines.map(function(l){return '<span class="ln"><span>'+l+'</span></span>';}).join('');
  });
  observeLines();
}
function observeLines(){
  var lns=document.querySelectorAll('.big .ln');
  if(!('IntersectionObserver' in window)){lns.forEach(function(l){l.classList.add('in');});return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var sibs=Array.prototype.indexOf.call(e.target.parentNode.children,e.target);
        e.target.style.transitionDelay=(sibs*.1)+'s';
        setTimeout(function(){e.target.classList.add('in');},30);
        io.unobserve(e.target);
      }
    });
  },{threshold:.3});
  lns.forEach(function(l){io.observe(l);});
}
if('fonts' in document){document.fonts.ready.then(function(){setTimeout(splitLines,50);});}
else setTimeout(splitLines,300);

/* ========== REVEAL up ========== */
var ups=document.querySelectorAll('.reveal-up');
if('IntersectionObserver' in window){
  var io2=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var sibs=Array.prototype.indexOf.call(e.target.parentNode.children,e.target);
        e.target.style.transitionDelay=(sibs%3*.08)+'s';
        e.target.classList.add('in');io2.unobserve(e.target);
      }
    });
  },{threshold:.15,rootMargin:'0px 0px -5%'});
  ups.forEach(function(u){io2.observe(u);});
}else ups.forEach(function(u){u.classList.add('in');});

/* ========== COUNTERS ========== */
document.querySelectorAll('[data-to]').forEach(function(el){
  var to=+el.getAttribute('data-to'),done=false;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting&&!done){done=true;var n=0;var iv=setInterval(function(){n++;el.textContent=n;if(n>=to)clearInterval(iv);},280);}
  });},{threshold:.6});
  io.observe(el);
});

/* ========== HERO parallax (mesh drifts slower than scroll) ========== */
if(!reduce){
  var hc=document.querySelector('.hero-canvas');
  addEventListener('scroll',function(){
    if(hc)hc.style.transform='translateY('+(scrollY*.25)+'px)';
  },{passive:true});
}

/* ========== MOBILE MENU ========== */
var burger=document.getElementById('burger');
if(burger){
  burger.addEventListener('click',function(){
    var o=nav.classList.toggle('menu-open');burger.classList.toggle('on',o);
    document.body.style.overflow=o?'hidden':'';
  });
  document.querySelectorAll('.links a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('menu-open');burger.classList.remove('on');document.body.style.overflow='';});});
}
})();
