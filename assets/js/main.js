(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ======== ISOMETRIC 3D CITY (generated architecture) ======== */
function rng(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};}

function City(canvas,o){
  o=o||{};
  var ctx=canvas.getContext('2d'),W,H,dpr,t0=performance.now();
  var R=rng(o.seed||7);
  var N=o.grid||11, bld=[];
  for(var gx=0;gx<N;gx++)for(var gy=0;gy<N;gy++){
    var d=Math.hypot(gx-N/2,gy-N/2)/(N/2);
    if(R()<.18+d*.25)continue;
    var hmax=o.tall||7;
    var h=(1-d*.55)*(.6+R()*hmax*(R()<.15?1.6:1));
    bld.push({x:gx,y:gy,w:.55+R()*.33,d:.55+R()*.33,h:Math.max(.25,h),delay:R()*1.6+d*.6,accent:R()<(o.accentRate||.12),win:R()<.6});
  }
  bld.sort(function(a,b){return (a.x+a.y)-(b.x+b.y);});

  function resize(){
    var r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
    W=canvas.width=Math.max(2,r.width*dpr);H=canvas.height=Math.max(2,r.height*dpr);
  }
  function iso(x,y,z,s,ox,oy){return [ox+(x-y)*s*.866, oy+(x+y)*s*.5 - z*s];}
  var visible=true;
  if('IntersectionObserver' in window){new IntersectionObserver(function(e){visible=e[0].isIntersecting;}).observe(canvas);}

  function frame(now){
    requestAnimationFrame(frame);
    if(!visible)return;
    var t=(now-t0)/1000;
    var s=Math.min(W,H)/(N*(o.zoom||1.05));
    var drift=reduce?0:t*.035;
    var ox=W*(o.cx||.62)+Math.sin(drift)*s*.6;
    var oy=H*(o.cy||.18)+Math.cos(drift*.7)*s*.3;
    ctx.clearRect(0,0,W,H);
    // ground glow
    var g=ctx.createRadialGradient(ox,oy+N*s*.5,0,ox,oy+N*s*.5,N*s*.9);
    g.addColorStop(0,'rgba(39,121,167,.20)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(58,155,209,.10)';ctx.lineWidth=1*dpr;
    for(var i=0;i<=N;i++){
      var a=iso(i,0,0,s,ox,oy),b=iso(i,N,0,s,ox,oy);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
      a=iso(0,i,0,s,ox,oy);b=iso(N,i,0,s,ox,oy);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
    }
    for(var k=0;k<bld.length;k++){
      var B=bld[k];
      var p=reduce?1:Math.min(1,Math.max(0,(t-B.delay)/1.4));
      p=1-Math.pow(1-p,4);
      if(p<=0)continue;
      var breathe=reduce?0:Math.sin(t*.6+k)*.03;
      var h=B.h*p+breathe*B.h;
      var x0=B.x+(1-B.w)/2,y0=B.y+(1-B.d)/2,x1=x0+B.w,y1=y0+B.d;
      var A=iso(x0,y1,0,s,ox,oy),Bb=iso(x1,y1,0,s,ox,oy),C=iso(x1,y0,0,s,ox,oy);
      var At=iso(x0,y1,h,s,ox,oy),Bt=iso(x1,y1,h,s,ox,oy),Ct=iso(x1,y0,h,s,ox,oy),Dt=iso(x0,y0,h,s,ox,oy);
      // left face
      ctx.fillStyle=B.accent?'#1d5f86':'#121518';
      ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(Bb[0],Bb[1]);ctx.lineTo(Bt[0],Bt[1]);ctx.lineTo(At[0],At[1]);ctx.closePath();ctx.fill();
      // right face
      ctx.fillStyle=B.accent?'#164a69':'#0b0d0f';
      ctx.beginPath();ctx.moveTo(Bb[0],Bb[1]);ctx.lineTo(C[0],C[1]);ctx.lineTo(Ct[0],Ct[1]);ctx.lineTo(Bt[0],Bt[1]);ctx.closePath();ctx.fill();
      // top
      ctx.fillStyle=B.accent?'#2779a7':'#1f2428';
      ctx.beginPath();ctx.moveTo(At[0],At[1]);ctx.lineTo(Bt[0],Bt[1]);ctx.lineTo(Ct[0],Ct[1]);ctx.lineTo(Dt[0],Dt[1]);ctx.closePath();ctx.fill();
      // windows (floors)
      if(B.win&&h>.8){
        var floors=Math.floor(h/.35);
        ctx.strokeStyle=B.accent?'rgba(150,215,250,.35)':'rgba(58,155,209,.22)';ctx.lineWidth=1*dpr;
        for(var f=1;f<floors;f++){
          var zf=f*.35,l1=iso(x0,y1,zf,s,ox,oy),l2=iso(x1,y1,zf,s,ox,oy),l3=iso(x1,y0,zf,s,ox,oy);
          ctx.beginPath();ctx.moveTo(l1[0],l1[1]);ctx.lineTo(l2[0],l2[1]);ctx.lineTo(l3[0],l3[1]);ctx.stroke();
        }
      }
      // edges
      ctx.strokeStyle=B.accent?'rgba(140,210,250,.9)':'rgba(58,155,209,.55)';ctx.lineWidth=1*dpr;
      ctx.beginPath();
      ctx.moveTo(At[0],At[1]);ctx.lineTo(Bt[0],Bt[1]);ctx.lineTo(Ct[0],Ct[1]);ctx.lineTo(Dt[0],Dt[1]);ctx.closePath();
      ctx.moveTo(Bt[0],Bt[1]);ctx.lineTo(Bb[0],Bb[1]);
      ctx.stroke();
      // scanning light on tallest accent
      if(B.accent&&!reduce){
        var sh=(Math.sin(t*1.2+k)*.5+.5)*h;
        var s1=iso(x0,y1,sh,s,ox,oy),s2=iso(x1,y1,sh,s,ox,oy),s3=iso(x1,y0,sh,s,ox,oy);
        ctx.strokeStyle='rgba(200,235,255,.8)';ctx.lineWidth=1.5*dpr;
        ctx.beginPath();ctx.moveTo(s1[0],s1[1]);ctx.lineTo(s2[0],s2[1]);ctx.lineTo(s3[0],s3[1]);ctx.stroke();
      }
    }
  }
  addEventListener('resize',resize);resize();requestAnimationFrame(frame);
}

var heroC=document.getElementById('city');
if(heroC)City(heroC,{seed:42,grid:13,tall:7,cx:.66,cy:.12,zoom:1.0,accentRate:.1});
document.querySelectorAll('.mini-city').forEach(function(c){
  var v=c.getAttribute('data-variant');
  var cfg={eu:{seed:11,grid:8,tall:7,cx:.5,cy:.3,zoom:1.35,accentRate:.2},
           dz:{seed:77,grid:9,tall:4,cx:.5,cy:.2,zoom:1.1,accentRate:.14},
           contact:{seed:5,grid:9,tall:6,cx:.5,cy:.16,zoom:1.05,accentRate:.16}}[v];
  City(c,cfg);
});

/* ======== READY ======== */
requestAnimationFrame(function(){setTimeout(function(){document.body.classList.add('ready');},150);});

/* ======== NAV ======== */
var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('solid',scrollY>40);},{passive:true});
var burger=document.getElementById('burger');
burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.classList.toggle('on',o);document.body.style.overflow=o?'hidden':'';});
document.querySelectorAll('.menu a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');burger.classList.remove('on');document.body.style.overflow='';});});

/* ======== REVEAL ======== */
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){var i=Array.prototype.indexOf.call(e.target.parentNode.children,e.target);
  e.target.style.transitionDelay=Math.min(i,4)*.09+'s';e.target.classList.add('in');io.unobserve(e.target);}
});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

/* ======== COUNTERS ======== */
document.querySelectorAll('[data-to]').forEach(function(el){
  var to=+el.dataset.to,done=false;
  new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting&&!done){done=true;var n=0;var iv=setInterval(function(){el.textContent=++n;if(n>=to)clearInterval(iv);},220);}
  });},{threshold:.5}).observe(el);
});
})();
