/* ================= READINESS ESTIMATOR =================
   Predicts a fresh-exam score per domain from card mastery, exam-style accuracy, PBQ scores and
   real full-exam results, measures how fast that prediction is moving, and projects the date the
   readiness gate (80% overall, 70% every domain) will be met. Depends on globals from index.html:
   SECTIONS, CATS, CARDS, mastered, EXQ, exq, PBQS, pbq, examHist, days, exam, studyHours, readyLog,
   saveState, renderToday, esc, $. Loaded before the main script; everything is resolved at call time. */

const RD_GATE={all:80,dom:70};
const RD_UNITS_PER_HOUR=60;     // one card/answer ≈ one minute; PBQs count 5 (see bumpDay calls)
const RD_MIN_DAYS=3;            // study days needed before a pace is trusted
const RD_WINDOW=10;             // days of history the pace looks at
const RD_EXAM_DAYS=3;           // two fresh exams + drills once the score is there

function rdDayKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function rdDomains(){
  return SECTIONS.map((s,i)=>({d:i+1,name:s.h.replace(/^Domain \d: /,"").replace(/ \(\d+%\)/,""),w:parseInt((s.h.match(/\((\d+)%\)/)||[0,20])[1],10),decks:s.decks}));
}
/* per-domain predicted fresh-exam score, 0-100 */
function rdPredict(){
  const doms=rdDomains();
  const lastFresh=examHist.slice().reverse().find(h=>h.fresh!==false&&h.dom);
  const labBest=PBQS.filter(p=>pbq[p.id]).map(p=>pbq[p.id].best);
  const labAvg=labBest.length>=3?labBest.reduce((a,b)=>a+b,0)/labBest.length:null;
  let total=0,wsum=0;
  doms.forEach(dm=>{
    const pool=CARDS.filter(c=>dm.decks.includes(c.c));
    const m=pool.length?pool.filter(mastered).length/pool.length:0;
    const qs=EXQ.filter(q=>q.d===dm.d);
    const seen=qs.reduce((a,q)=>a+((exq[q.id]||{}).seen||0),0),right=qs.reduce((a,q)=>a+((exq[q.id]||{}).right||0),0);
    const acc=seen>=5?right/seen*100:null;
    // cards alone overstate readiness; discount until scenario data exists
    let base=acc===null?m*100*0.85:0.5*m*100+0.5*acc;
    if(labAvg!==null)base=0.85*base+0.15*labAvg;
    let p=base,src="cards"+(acc!==null?"+questions":"")+(labAvg!==null?"+lab":"");
    if(lastFresh&&lastFresh.dom[dm.d]){const ep=lastFresh.dom[dm.d][1]?lastFresh.dom[dm.d][0]/lastFresh.dom[dm.d][1]*100:0;const age=(Date.now()-lastFresh.t)/86400000;const wE=age<=14?0.6:0.35;p=wE*ep+(1-wE)*base;src="exam+"+src;}
    dm.p=Math.max(0,Math.min(100,p));dm.mastery=Math.round(m*100);dm.acc=acc===null?null:Math.round(acc);dm.src=src;
    total+=dm.p*dm.w;wsum+=dm.w;
  });
  return {doms,overall:wsum?total/wsum:0,hasExam:!!lastFresh,hasQ:doms.some(d=>d.acc!==null)};
}
/* record today's prediction so pace can be measured over time */
function rdSnapshot(overall){
  const k=rdDayKey(new Date());
  const prev=readyLog[k];
  readyLog[k]={p:Math.round(overall*10)/10,u:days[k]||0};
  // trim to 60 days
  const keys=Object.keys(readyLog).sort();while(keys.length>60)delete readyLog[keys.shift()];
  return !prev||Math.abs(prev.p-readyLog[k].p)>=0.5;
}
/* pace: activity units/day and score points gained per unit, over the recent window */
function rdPace(){
  const today=new Date();today.setHours(0,0,0,0);
  const keys=[];for(let i=RD_WINDOW-1;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);keys.push(rdDayKey(d));}
  const active=keys.filter(k=>(days[k]||0)>0);
  const units=keys.reduce((a,k)=>a+(days[k]||0),0);
  const unitsPerDay=units/RD_WINDOW;
  const logged=keys.filter(k=>readyLog[k]);
  let ptsPerUnit=null;
  if(logged.length>=2){const first=readyLog[logged[0]],last=readyLog[logged[logged.length-1]];const gained=last.p-first.p;const spent=keys.slice(keys.indexOf(logged[0])+1,keys.indexOf(logged[logged.length-1])+1).reduce((a,k)=>a+(days[k]||0),0);if(spent>0&&gained>0)ptsPerUnit=gained/spent;}
  return {unitsPerDay,activeDays:active.length,ptsPerUnit,units};
}
function rdFmtHours(units){const h=units/RD_UNITS_PER_HOUR;if(h<1)return Math.round(h*60)+" min";const m=Math.round((h%1)*60);return Math.floor(h)+" h"+(m?" "+String(m).padStart(2,"0"):"");}
function rdFmtDate(d){return d.toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function rdEstimate(){
  const pr=rdPredict();
  const pace=rdPace();
  const gapAll=Math.max(0,RD_GATE.all-pr.overall);
  const gapDom=Math.max(0,...pr.doms.map(d=>RD_GATE.dom-d.p));
  const bottleneck=pr.doms.slice().sort((a,b)=>(RD_GATE.dom-b.p)-(RD_GATE.dom-a.p))[0];
  const gap=Math.max(gapAll,gapDom);
  const gateMet=examHist.length>=2&&examHist[examHist.length-1].gate&&examHist[examHist.length-2].gate;
  const perDay=studyHours?studyHours*RD_UNITS_PER_HOUR:pace.unitsPerDay;
  // fallback learning rate before we have measured one: a conservative prior
  const ppu=pace.ptsPerUnit||0.045;
  const measured=!!pace.ptsPerUnit;
  let daysNeeded=null,lo=null,hi=null;
  if(gap===0)daysNeeded=RD_EXAM_DAYS;
  else if(perDay>0){daysNeeded=gap/(ppu*perDay)+RD_EXAM_DAYS;lo=gap/(ppu*1.25*perDay)+RD_EXAM_DAYS;hi=gap/(ppu*0.75*perDay)+RD_EXAM_DAYS;}
  const target=exam?new Date(exam+"T00:00:00"):null;
  const daysToTarget=target?Math.round((target-new Date().setHours(0,0,0,0))/86400000):null;
  let needPerDay=null;
  if(target&&daysToTarget>RD_EXAM_DAYS&&gap>0)needPerDay=gap/(ppu*(daysToTarget-RD_EXAM_DAYS));
  return {pr,pace,gap,gapAll,gapDom,bottleneck,gateMet,perDay,measured,daysNeeded,lo,hi,target,daysToTarget,needPerDay,override:!!studyHours};
}
function rdHtml(){
  const e=rdEstimate();const pr=e.pr;
  if(rdSnapshot(pr.overall))saveState();
  const bars=pr.doms.map(d=>{const p=Math.round(d.p);const c=p>=RD_GATE.all?"var(--green)":p>=RD_GATE.dom?"var(--amber)":"var(--red)";return `<div class="pd">${esc(d.name)} ${p}%<div class="bar"><i style="width:${p}%;background:${c}"></i></div></div>`;}).join("");
  let head,detail="";
  const paceTxt=e.override?`What-if pace: <b>${Math.round(e.perDay)}</b> cards/day (${e.override?studyHours+" h":""}/day)`:`Your pace: <b>${Math.round(e.pace.unitsPerDay)}</b> cards/day over the last ${RD_WINDOW} days (≈${rdFmtHours(e.pace.unitsPerDay)}/day, ${e.pace.activeDays} study day${e.pace.activeDays===1?"":"s"})`;
  if(e.gateMet){head=`<b style="color:var(--green)">Ready.</b> Two fresh exams cleared the gate. Book it.`;}
  else if(e.perDay<=0||(!e.override&&e.pace.activeDays<RD_MIN_DAYS)){head=`Estimate unlocks after <b>${RD_MIN_DAYS} study days</b>. ${e.pace.activeDays} so far.`;}
  else{
    const start=new Date();const est=new Date(start);est.setDate(est.getDate()+Math.round(e.daysNeeded));
    let range="";if(e.lo!==null){const a=new Date(start),b=new Date(start);a.setDate(a.getDate()+Math.round(e.lo));b.setDate(b.getDate()+Math.round(e.hi));range=` <span class="rdr">(${rdFmtDate(a)} – ${rdFmtDate(b)})</span>`;}
    head=`At ${e.override?"that":"this"} pace, ready around <b>${rdFmtDate(est)}</b>${range}`;
    if(e.target&&e.daysToTarget!==null){const diff=Math.round(e.daysNeeded)-e.daysToTarget;
      if(diff<=0)head+=` · <b style="color:var(--green)">${-diff} day${diff===-1?"":"s"} before your target</b>`;
      else{head+=` · <b style="color:var(--red)">${diff} day${diff===1?"":"s"} after your target</b>`;if(e.needPerDay)detail+=`To make ${rdFmtDate(e.target)}: about <b>${Math.round(e.needPerDay)}</b> cards/day (≈${rdFmtHours(e.needPerDay)}/day).`;}
    }
    if(e.gapDom>e.gapAll&&e.bottleneck)detail+=(detail?" ":"")+`Bottleneck: <b>${esc(e.bottleneck.name)}</b> at ${Math.round(e.bottleneck.p)}%, needs ${RD_GATE.dom}%.`;
    if(!pr.hasExam)detail+=(detail?" ":"")+`No full exam yet, so this leans on cards and is deliberately pessimistic; the first fresh exam will move it.`;
    else if(!e.measured)detail+=(detail?" ":"")+`Learning rate not measured yet; using a conservative default.`;
  }
  return `<div class="rdhead"><span class="rdp">Predicted fresh-exam score <b>${Math.round(pr.overall)}%</b></span><span class="rdg">gate ${RD_GATE.all}% · ${RD_GATE.dom}% per domain</span></div>
  <div class="proj">${bars}</div>
  <div class="rdline">${head}</div>${detail?`<div class="rddetail">${detail}</div>`:""}
  <div class="rdpace">${paceTxt} <span class="rdwhat">What if <input id="rdhours" type="number" inputmode="decimal" min="0.25" max="12" step="0.25" value="${studyHours||""}" placeholder="h"> h/day?${studyHours?` <button id="rdclear">use my pace</button>`:""}</span></div>`;
}
function rdBind(){
  const inp=$("#rdhours");if(!inp)return;
  inp.onchange=()=>{const v=parseFloat(inp.value);studyHours=(v>0)?v:null;saveState();renderToday();};
  inp.onclick=ev=>ev.stopPropagation();
  const c=$("#rdclear");if(c)c.onclick=()=>{studyHours=null;saveState();renderToday();};
}

/* ---------- weakness-weighted picking (used by today's set and the 10-question set) ---------- */
function rdDomainOf(cat){const doms=rdDomains();const dm=doms.find(d=>d.decks.includes(cat));return dm?dm.d:null;}
function rdWeights(){
  const pr=rdPredict();const w={};
  pr.doms.forEach(d=>{w[d.d]=Math.max(5,RD_GATE.all-d.p+5);});   // points of headroom below the gate, floor 5 so nothing hits zero
  return w;
}
/* pick n items from pool, each item's chance proportional to its domain's weakness; keyFn returns the domain number */
function rdWeakPick(pool,n,keyFn){
  const w=rdWeights();const items=pool.map(x=>({x,w:w[keyFn(x)]||10}));const out=[];
  while(out.length<n&&items.length){
    let tot=items.reduce((a,i)=>a+i.w,0),r=Math.random()*tot,k=0;
    for(;k<items.length;k++){r-=items[k].w;if(r<=0)break;}
    if(k>=items.length)k=items.length-1;
    out.push(items[k].x);items.splice(k,1);
  }
  return out;
}
function rdLeanTxt(){const pr=rdPredict();const worst=pr.doms.slice().sort((a,b)=>a.p-b.p);const w=rdWeights();const tot=Object.values(w).reduce((a,b)=>a+b,0);const share=Math.round(w[worst[0].d]/tot*100);return `Weighted toward your weakest domains: ${esc(worst[0].name)} gets ~${share}% of the weak-card slots today.`;}
