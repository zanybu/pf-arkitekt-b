// Pure Fusion scroll film — v7 marble kitchen (2026-10-02).
// Source: hf/sb3/vid/FILM-1080-v1.mp4 (33.5 s, 1080p, four continuous Seedance takes).
// The film is SCRUBBED by scroll: one scroll position = one frame, so the shopper's own scroll speed is the
// playback speed. PIECES sets how much scroll each stretch of film gets: ~0.2 screens per film second for
// normal motion, ~0.6 for the slow-motion beats, and short holds where the copy changes.
// Rollback: cp scroll-frames-preV7.js scroll-frames.js && cp chapters-preV7.json chapters.json && cp style-preV7.css style.css && ./stamp.sh
const $=s=>document.querySelector(s);
const FPS=24, LAST=803;                           // 804 frames
const PHONE=matchMedia('(max-width: 820px)').matches||innerWidth/innerHeight<1.2;
const BASE=window.FRAMESET||((window.PF_ASSETS||'')+(PHONE?'frames/film9m':'frames/film9d')), EXT='webp';   // light sets for the live A/B page: phone 1280px every 2nd frame (~18 MB), desktop 1920px (~64 MB)
const FSTEP=PHONE?2:1;   // phone set only has odd-numbered files (every 2nd frame)
const fi=i=>i-(i%FSTEP);
const FV='202610041600';   // bump when frames change so browsers refetch them
// s = screens of scroll (100vh each) spent on this piece. t0==t1 is a hold.
const PIECES=[
 {id:'open',fx:0.3,     t0:0,     t1:4.5,   s:0.90},   // rise, turn, tear
 {id:'tip',fx:0.32,      t0:4.5,   t1:5.5,   s:0.25},
 {id:'breakout',fx:0.33, t0:5.5,   t1:7.04,  s:0.92},   // SLOW-MO: push-in, powder breaks out, focus pull
 {id:'fall',fx:0.5,     t0:7.04,  t1:9.0,   s:0.35},
 {id:'form',fx:0.5,     t0:9.0,   t1:10.5,  s:0.75},   // SLOW-MO: powder folds into the five piles
 {id:'rise',fx:0.5,     t0:10.5,  t1:12.08, s:0.32},   // camera rises to the top-down view
 {id:'whey',     t0:12.08, t1:12.08, s:0.50},   // holds: one ingredient each
 {id:'creatine', t0:12.08, t1:12.08, s:0.50},
 {id:'beta',     t0:12.08, t1:12.08, s:0.50},
 {id:'hmb',      t0:12.08, t1:12.08, s:0.50},
 {id:'elec',     t0:12.08, t1:12.08, s:0.50},
 {id:'zoom',fx:0.62,     t0:12.08, t1:13.58, s:0.30},   // zoom out, blender appears on the right
 {id:'flyup',fx:0.6,    t0:13.58, t1:15.33, s:0.88},   // SLOW-MO: powders lift and fly into the jar
 {id:'blend',fx:0.62,    t0:15.33, t1:18.33, s:0.54},
 {id:'pourprep',fx:0.53, t0:18.33, t1:24.3,  s:0.96},   // stop, lid off, glass slides in, jar lifts
 {id:'pour',fx:0.38,     t0:24.3,  t1:30.0,  s:1.14},   // pour + push-in + drip
 {id:'drop',fx:0.36,     t0:30.0,  t1:33.4,  s:1.70},   // SLOW-MO: bag drops and lands
 {id:'end',fx:0.34,      t0:33.4,  t1:33.4,  s:0.80}
];
const SCREENS=PIECES.reduce((a,p)=>a+p.s,0);
{let acc=0;for(const p of PIECES){p.p0=acc/SCREENS;acc+=p.s;p.p1=acc/SCREENS;}}
const pieceById=Object.fromEntries(PIECES.map(p=>[p.id,p]));
function timeAt(prog){
 for(const p of PIECES){if(prog<=p.p1){const f=p.p1>p.p0?(prog-p.p0)/(p.p1-p.p0):0;return p.t0+(p.t1-p.t0)*Math.max(0,Math.min(1,f));}}
 return PIECES[PIECES.length-1].t1;
}

let manual=false,target=0,shown=0,last=0,parts=[],activeIndex=-1,lastDrawn=-1,lastKey='';
let spotA=0,spotX=.5,spotY=.5,camFX=.3;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(x,l=0,h=1)=>Math.max(l,Math.min(h,x));
const stage=$('#stage'),cv=document.createElement('canvas');
cv.id='frames';stage.append(cv);
const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='medium';
for(const v of stage.querySelectorAll('video'))v.remove();
const A=[];let ready=0;
const url=i=>`${BASE}/${String(fi(i)+1).padStart(4,'0')}.${EXT}?v=${FV}`;
function loadSeq(){
 // Coarse-to-fine: every 8th frame first so the whole film scrubs early, then fill the gaps.
 const order=[],seen=new Set();
 for(const step of [8,4,2,1])for(let i=0;i<=LAST;i+=step)if(i%FSTEP===0&&!seen.has(i)){seen.add(i);order.push(i);}
 let k=0;const N=6;
 const next=()=>{if(k>=order.length)return;const i=order[k++];const im=new Image();im.decoding='async';
  im.onload=im.onerror=()=>{if(im.naturalWidth)A[i]=im;if(++ready>Math.ceil((LAST+1)/8))$('#loading').hidden=true;draw(true);next();};
  im.src=url(i);};
 // Leave connections free for the page's own photos: 2 lanes until those <img>s finish (or 3 s), then all 6.
 // (Not window 'load': the frames themselves hold that event open, so it would never fire.)
 const spawn=k=>{for(let n=0;n<k;n++)next();};spawn(2);
 const pics=[...document.querySelectorAll('#after img')].filter(i=>!i.complete).map(i=>new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}));
 Promise.race([Promise.all(pics),new Promise(r=>setTimeout(r,3000))]).then(()=>spawn(N-2));
}
function nearest(i){
 if(A[i])return A[i];
 for(let d=1;d<=60;d++){if(i-d>=0&&A[i-d])return A[i-d];if(i+d<=LAST&&A[i+d])return A[i+d];}
 return null;
}

// Decode-ahead cache: frames are decoded off the main thread (fetch -> createImageBitmap) into a window
// biased toward the scroll direction, so drawing never waits on a decode. Evicted bitmaps are closed.
const BM=new Map(),PEND=new Set();const CACHE=PHONE?40:64;let inflight=0,lastIdx=0,dir=1;
function pump(center){
 const ahead=Math.round(CACHE*.7),behind=CACHE-ahead;
 const lo=dir>=0?center-behind:center-ahead,hi=dir>=0?center+ahead:center+behind;
 for(const [k,b] of BM)if(k<lo-6||k>hi+6){b.close&&b.close();BM.delete(k);}
 for(let d=0;d<=CACHE&&inflight<4;d++){
  for(const k of [center+d*dir,center-d*dir]){
   if(inflight>=4)break;
   if(k<lo||k>hi||k<0||k>LAST||k%FSTEP||BM.has(k)||PEND.has(k))continue;
   PEND.add(k);inflight++;
   fetch(url(k)).then(r=>r.blob()).then(b=>createImageBitmap(b)).then(bm=>{BM.set(k,bm);lastKey='';})
    .catch(()=>{}).finally(()=>{PEND.delete(k);inflight--;});
  }
 }
}
function bestFrame(i){
 if(BM.has(i))return BM.get(i);
 for(let d=1;d<=8;d++){if(BM.has(i-d*dir))return BM.get(i-d*dir);if(BM.has(i+d*dir))return BM.get(i+d*dir);}
 return nearest(i);
}
function fit(){
 const r=stage.getBoundingClientRect(),dpr=Math.min(3,devicePixelRatio||1);
 cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));
 cv.style.width=r.width+'px';cv.style.height=r.height+'px';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='medium';lastDrawn=-1;draw(true);
}
// Desktop copy placement: each chapter's "box" [cx,cy,cw] is the centre of its text block and its width, as
// fractions of the FILM (not the window), picked from the empty part of that chapter's footage. The block is
// then clamped inside the window. Phone keeps its stacked layout below the film.
function placeCopy(){
 const vw=innerWidth,vh=innerHeight,mobile=vw<=820||vw/vh<1.2;
 const s=Math.min(vw/16,vh/9),rw=16*s,rh=9*s,rx=(vw-rw)/2,ry=(vh-rh)/2,pad=Math.max(24,vw*0.03),top0=96;
 document.querySelectorAll('section').forEach((sec,i)=>{
  const c=parts[i],el=sec.querySelector('.copy');if(!el)return;
  for(const k of ['left','top','right','bottom','width'])el.style.removeProperty(k);
  if(mobile||!c||!c.box)return;
  const [cx,cy,cwf]=c.box,w0=clamp(cwf*rw,260,c.hero?680:560);
  // when the window crops the film, shrink the block toward its free side instead of sliding it onto the subject
  let L=rx+cx*rw-w0/2,R=L+w0;L=Math.max(L,pad);R=Math.min(R,vw-pad);
  const w=Math.max(240,R-L);if(R-L<240)L=clamp(L,pad,vw-pad-w);
  el.style.setProperty('width',w+'px','important');
  const h=el.offsetHeight;
  el.style.setProperty('left',L+'px','important');
  el.style.setProperty('top',clamp(ry+cy*rh-h/2,top0,Math.max(top0,vh-pad-h))+'px','important');
  el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');
 });
}
function rect(img){
 const cw=cv.width,ch=cv.height,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 if(cw/ch<1.2){   // phone: fill a tall frame and pan to keep the subject in shot
  const s=Math.max(cw/iw,ch/ih),w=iw*s,h=ih*s;
  return {x:clamp(cw/2-camFX*w,cw-w,0),y:(ch-h)/2,w,h};
 }
 const s=Math.min(cw/iw,ch/ih),w=iw*s,h=ih*s;return {x:(cw-w)/2,y:(ch-h)/2,w,h};
}
function pieceAt(prog){for(const p of PIECES)if(prog<=p.p1)return p;return PIECES[PIECES.length-1];}
function draw(force){
 const idx=fi(clamp(Math.round(timeAt(shown)*FPS),0,LAST));
 const key=idx+'|'+camFX.toFixed(4)+'|'+spotA.toFixed(3)+'|'+spotX.toFixed(3)+'|'+spotY.toFixed(3);
 if(!force&&key===lastKey)return;
 lastKey=key;lastDrawn=idx;
 ctx.clearRect(0,0,cv.width,cv.height);
 if(idx!==lastIdx){dir=idx>lastIdx?1:-1;lastIdx=idx;}pump(idx);
 const im=bestFrame(idx);if(!im)return;
 const r=rect(im);ctx.drawImage(im,r.x,r.y,r.w,r.h);
 if(spotA>0.01){   // spotlight: keep one pile lit, dim the rest
  const cx=r.x+spotX*r.w,cy=r.y+spotY*r.h,rad=r.w*0.17;
  const g=ctx.createRadialGradient(cx,cy,rad*0.55,cx,cy,rad*1.25);
  g.addColorStop(0,'rgba(8,8,9,0)');g.addColorStop(1,`rgba(8,8,9,${0.72*spotA})`);
  ctx.fillStyle=g;ctx.fillRect(r.x,r.y,r.w,r.h);
 }
}

const SHOP_URL='https://purefusion.shop/products/protein-powder';
function renderCopy(c,i){
 const tag=i?'h2':'h1';const lines=(c.headline||'').split('<br>');
 const head=c.treat==='lb'
  ?`<${tag} class="lb"><span class="l">${lines[0]||''}</span><span class="b">${lines.slice(1).join(' ')}</span></${tag}>`
  :`<${tag}>${lines[0]||''}${lines.length>1?'<br><span class="hl2">'+lines.slice(1).join('<br>')+'</span>':''}</${tag}>`;
 const icon=c.icon?`<svg class="ic" aria-hidden="true"><use href="#${c.icon}"/></svg>`:'';
 const stat=c.amount?`<strong class="stat">${c.amount}</strong>`:'';
 const cta=c.cta?`<a class="cta" href="${SHOP_URL}"><svg class="ic" aria-hidden="true"><use href="#i-bag"/></svg>${c.ctaLabel||'Buy MA01'}<svg class="ic ic-end" aria-hidden="true"><use href="#i-arrow"/></svg></a>`:'';
 return `<div class="copy${c.hero?' hero':''}${c.big?' big':''}"><p class="kicker">${icon}<span>${c.kicker}</span></p>${c.treat==='lb'?stat+head:head}<p class="body">${c.body}</p>${c.treat==='lb'?'':stat}${cta}</div>`;
}
async function boot(){
 parts=await fetch((window.PF_ASSETS||'')+'chapters.json').then(r=>r.json());
 parts.forEach(c=>{c.at=pieceById[c.piece].p0;});
 parts.forEach((c,i)=>{const s=document.createElement('section');s.dataset.side=['left','bl','tl'].includes(c.pos)?'left':'right';s.dataset.pos=c.pos||'right';if(c.blank)s.dataset.blank='1';
  const nextAt=parts[i+1]?.at??1;
  s.style.height=((nextAt-c.at)*SCREENS*100+(i===parts.length-1?100:0))+'vh';
  s.innerHTML=renderCopy(c,i);$('#journey').append(s)});
 fit();placeCopy();document.fonts&&document.fonts.ready.then(placeCopy);loadSeq();
}
addEventListener('resize',()=>{fit();placeCopy();});
$('#manual').onclick=()=>{manual=!manual;document.body.classList.toggle('manual',manual);$('#controls').hidden=!manual;$('#manual').textContent=manual?'Scroll control':'Motion control';$('#manual').setAttribute('aria-pressed',String(manual));if(!manual)scrollTo({top:shown*($('#journey').offsetTop+$('#journey').offsetHeight-innerHeight),behavior:'instant'})};
$('#scrub').oninput=e=>target=Number(e.target.value)/1000;
function tick(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;
 if(!manual){const j=$('#journey');const end=Math.max(1,j.offsetTop+j.offsetHeight-innerHeight);
  target=clamp(scrollY/end);}
 // Tight follow (~45 ms) so the film tracks the hand; a little smoothing hides wheel steps.
 shown=reduced?target:shown+(target-shown)*(1-Math.exp(-dt*22));
 if(Math.abs(target-shown)<1e-5)shown=target;
 const index=parts.findLastIndex(c=>shown>=c.at);
 const c=parts[index];const want=c&&c.spot?1:0;
 spotA+=(want-spotA)*(1-Math.exp(-dt*8));
 if(c&&c.spot){spotX+=(c.spot[0]-spotX)*(1-Math.exp(-dt*9));spotY+=(c.spot[1]-spotY)*(1-Math.exp(-dt*9));if(spotA<0.05){spotX=c.spot[0];spotY=c.spot[1];}}
 const pc=pieceAt(shown);const wantFX=c&&c.spot?c.spot[0]:(pc.fx??.5);
 camFX+=(wantFX-camFX)*(1-Math.exp(-dt*5));
 draw(false);
 if(index!==activeIndex){document.querySelectorAll('section').forEach((s,i)=>s.classList.toggle('active',i===index));activeIndex=index;}
 document.body.classList.toggle('past',shown>0.995);document.body.classList.toggle('scrolled',shown>0.012);
 $('#progress').textContent=Math.round(shown*100)+'%';if(!manual)$('#scrub').value=Math.round(shown*1000);
 stage.dataset.progress=shown.toFixed(5);stage.dataset.timeline=timeAt(shown).toFixed(3);stage.dataset.frame=String(lastDrawn);
 requestAnimationFrame(tick);
}

// Screenshot mode: ?beat=<piece>&f=0.5 jumps straight to one beat (used for review captures only).
const QS=new URLSearchParams(location.search);
if(QS.get('beat')){
 const st=document.createElement('style');st.textContent='.copy{transition:none!important}#loading{display:none!important}';document.head.append(st);
 const wantBeat=QS.get('beat'),wantF=Number(QS.get('f')??0.5);
 const go=()=>{const p=pieceById[wantBeat];if(!p||!parts.length){setTimeout(go,100);return;}
  const prog=p.p0+(p.p1-p.p0)*wantF;const idx=fi(Math.round(timeAt(prog)*FPS));
  if(!A[idx]){setTimeout(go,100);return;}
  const j=$('#journey');scrollTo(0,prog*Math.max(1,j.offsetTop+j.offsetHeight-innerHeight));
  target=shown=prog;const ci=parts.findLastIndex(c=>prog>=c.at);const c=parts[ci];
  spotA=c&&c.spot?1:0;if(c&&c.spot){spotX=c.spot[0];spotY=c.spot[1];}camFX=c&&c.spot?c.spot[0]:(p.fx??.5);
  document.querySelectorAll('section').forEach((s,i)=>s.classList.toggle('active',i===ci));activeIndex=ci;draw(true);document.body.classList.add('shot-ready');};
 setTimeout(go,300);
}
boot().catch(()=>{$('#loading').textContent='The rendered experience is unavailable.'});
requestAnimationFrame(tick);
