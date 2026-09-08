/* ================= EXAM MODE =================
   Full-length timed Security+ (SY0-701) exams. Depends on globals from index.html:
   $, esc, shuffle, show, saveState, bumpDay, CARDS, CATS, DIAG, DOMNAME,
   genHash/hashHtml/hashCheck, genFw/fwHtml/fwCheck, genRisk/riskHtml/riskCheck, startTodaySet, renderHome, examHist (array).
   Question banks: EXAM_BANK_A/B/C (exam/bank-*.js), EXAM_PBQS (exam/pbqs.js). */

const XM_EXAMS={a:{name:"Exam A",sub:"Hospital, software company, school district. Log and exhibit heavy."},b:{name:"Exam B",sub:"Finance, plant OT, cloud startup. Architecture, data, vendors."},c:{name:"Exam C",sub:"MSP, city government, remote firm. Operations and governance."}};
const XM_BANK={a:EXAM_BANK_A,b:EXAM_BANK_B,c:EXAM_BANK_C};
const XM_MIN=90, XM_PBQ_PTS=3, XM_PASS=720, XM_GATE={all:80,dom:70};
const XM_KEY="secplus-exam-inprogress";
const XM_CONF=["Sure","Leaning","No clue"];
const XM_CONFLONG=["I know this","Leaning one way","Total guess"];
const XM_DOMW={1:"12%",2:"22%",3:"18%",4:"28%",5:"20%"};
let XS=null, xmTimer=null, xmMode="exam"; // xmMode: "exam" | "drill"

function xmQ(id){for(const k in XM_BANK){const q=XM_BANK[k].find(q=>q.id===id);if(q)return q;}return null;}
function xmP(id){for(const k in EXAM_PBQS){const p=EXAM_PBQS[k].find(p=>p.id===id);if(p)return p;}return null;}
function xmFmt(ms){ms=Math.max(0,ms);const s=Math.floor(ms/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function xmDate(t){const d=new Date(t);return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})+" "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});}
function xmSaveLocal(){if(XS&&XS.drill)return;try{if(XS)localStorage.setItem(XM_KEY,JSON.stringify(XS));else localStorage.removeItem(XM_KEY);}catch(e){}}
function xmLoadLocal(){try{const v=localStorage.getItem(XM_KEY);return v?JSON.parse(v):null;}catch(e){return null;}}
function xmTaken(x){return examHist.filter(h=>h.x===x).length;}

/* ---------- home / picker ---------- */
function renderExam(){
  show("exam");
  if(xmTimer){clearInterval(xmTimer);xmTimer=null;}
  const saved=xmLoadLocal();
  const gate=xmGateStatus();
  let html=`<div class="xm-tb"><button id="xmhome">Exit</button><div class="labtitle">Full exam</div></div>`;
  html+=`<p class="lead">90 questions, 90 minutes, PBQs first, scored 100-900 with 720 to pass. No feedback until you submit. Mark how sure you are on every question; the report shows whether your guesses beat chance.</p>`;
  html+=`<div class="xm-gate"><div class="gt">READINESS GATE · two consecutive fresh exams at 80%+, every domain 70%+</div><div class="gv">${gate.html}</div></div>`;
  if(saved&&!saved.done){
    const left=XM_MIN*60000-saved.elapsed;
    html+=`<button class="xm-card pick" id="xmresume" style="width:100%;border:2px solid var(--amber);text-align:left;font-family:inherit"><span class="jack" style="background:var(--amber)"></span><span><span class="t">Resume ${XM_EXAMS[saved.x]?XM_EXAMS[saved.x].name:"Random mix"}</span><span class="s">Question ${saved.i+1} of ${saved.items.length} · ${xmFmt(left)} left · paused ${saved.pauses.length}×</span></span><span class="n" style="color:var(--amber)">resume</span></button>`;
    html+=`<button class="ghost" id="xmdiscard" style="width:100%;margin-bottom:12px">Discard the in-progress attempt</button>`;
  }
  for(const x of ["a","b","c"]){
    const n=xmTaken(x);const last=examHist.filter(h=>h.x===x).slice(-1)[0];
    html+=`<button class="xm-card pick" data-x="${x}" style="width:100%;border:none;text-align:left;font-family:inherit"><span class="jack" style="background:${n?"var(--muted)":"var(--green)"}"></span><span><span class="t">${XM_EXAMS[x].name}<span class="xm-fresh ${n?"no":"yes"}">${n?"seen "+n+"×":"fresh"}</span></span><span class="s">${XM_EXAMS[x].sub}</span></span><span class="n" style="color:${last?(last.pass?"var(--green)":"var(--red)"):"var(--muted)"}">${last?last.scaled+"<br><span style='font-size:11px;color:var(--muted)'>"+last.raw+"%</span>":"90 Qs"}</span></button>`;
  }
  html+=`<button class="xm-card pick" data-x="mix" style="width:100%;border:none;text-align:left;font-family:inherit"><span class="jack" style="background:var(--amber)"></span><span><span class="t">Random mix</span><span class="s">85 questions drawn across all three banks plus 5 PBQs. Not fresh once you've taken the others, but good volume.</span></span><span class="n">90 Qs</span></button>`;
  if(examHist.length){
    html+=`<div class="reft">History · ${examHist.length} attempt${examHist.length>1?"s":""}</div>`;
    html+=examHist.slice().reverse().map((h,k)=>`<div class="xm-hist" data-h="${examHist.length-1-k}"><span>${XM_EXAMS[h.x]?XM_EXAMS[h.x].name:"Mix"}<br><span class="d">${xmDate(h.t)} · ${Math.round(h.secs/60)} min${h.pauses?" · paused "+h.pauses+"×":""}</span></span><span class="sc ${h.pass?"ok":"no"}">${h.scaled}<br><span class="d">${h.raw}%${h.gate?" · gate ✓":""}</span></span></div>`).join("");
    html+=`<div class="reft">Trend</div>`+xmTrendHtml();
  }
  $("#xmbody").innerHTML=html;
  $("#xmhome").onclick=()=>renderHome();
  document.querySelectorAll("#xmbody .xm-card[data-x]").forEach(b=>b.onclick=()=>xmConfirmStart(b.dataset.x));
  if(saved&&!saved.done){$("#xmresume").onclick=()=>{XS=saved;xmMode="exam";xmResume();};$("#xmdiscard").onclick=()=>{if(confirm("Throw away the in-progress attempt?")){XS=null;xmSaveLocal();renderExam();}};}
  document.querySelectorAll(".xm-hist").forEach(el=>el.onclick=()=>xmShowResult(examHist[+el.dataset.h]));
}
function xmGateStatus(){
  const H=examHist;
  if(!H.length)return {ok:false,html:"No full exams yet. Take a fresh one, timed, in one sitting."};
  const last=H[H.length-1],prev=H[H.length-2];
  const okLast=last.gate,okPrev=prev&&prev.gate;
  if(okLast&&okPrev)return {ok:true,html:`<b>Gate met.</b> Two consecutive attempts at ${prev.raw}% and ${last.raw}% with every domain over ${XM_GATE.dom}%. Book the date.`};
  if(okLast)return {ok:false,html:`Last attempt <b>${last.raw}%</b> cleared the gate. One more consecutive pass on a <i>fresh</i> exam and you're there.`};
  const weak=Object.keys(last.dom).filter(d=>xmPct(last.dom[d])<XM_GATE.dom).map(d=>DOMNAME[d]);
  return {ok:false,html:`Last attempt <i>${last.raw}%</i>${last.raw>=XM_GATE.all?"":" (need "+XM_GATE.all+"%)"}${weak.length?" · under "+XM_GATE.dom+"% in "+weak.join(", "):""}. Drill those, then take the next fresh exam.`};
}
function xmPct(pair){return pair[1]?Math.round(pair[0]/pair[1]*100):0;}
function xmTrendHtml(){
  const H=examHist.slice(-8);const W=300,Hh=90;
  const pts=H.map((h,i)=>[H.length>1?20+i*(W-40)/(H.length-1):W/2,Hh-8-(h.raw/100)*(Hh-16)]);
  const gateY=Hh-8-(XM_GATE.all/100)*(Hh-16);
  return `<svg viewBox="0 0 ${W} ${Hh}" class="dg" style="max-height:110px"><line x1="10" y1="${gateY}" x2="${W-10}" y2="${gateY}" stroke="#43D97B" stroke-dasharray="4 4" stroke-width="1.5"/><text x="${W-12}" y="${gateY-4}" text-anchor="end" class="mt" style="fill:#43D97B">80%</text>${pts.length>1?`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="#FFB454" stroke-width="2.5"/>`:""}${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${H[i].pass?"#43D97B":"#FF5D52"}"/><text x="${p[0]}" y="${p[1]-10}" text-anchor="middle" class="mt">${H[i].raw}</text>`).join("")}</svg>`;
}
function xmConfirmStart(x){
  const n=x==="mix"?0:xmTaken(x);
  const msg=(n?`You've taken ${XM_EXAMS[x].name} before, so it isn't fresh; it won't count toward the gate. `:"")+`Start a 90-minute timed attempt now? Have 90 minutes, no notes, no lookups.`;
  if(!confirm(msg))return;
  xmStart(x);
}
function xmBuildItems(x){
  let qs,pbqs;
  if(x==="mix"){
    const all=[...EXAM_BANK_A,...EXAM_BANK_B,...EXAM_BANK_C];
    const byD={};all.forEach(q=>{(byD[q.d]=byD[q.d]||[]).push(q);});
    const quota={1:10,2:19,3:15,4:24,5:17};qs=[];
    for(const d in quota)qs=qs.concat(shuffle(byD[d].slice()).slice(0,quota[d]));
    qs=shuffle(qs);
    pbqs=shuffle([...EXAM_PBQS.a,...EXAM_PBQS.b,...EXAM_PBQS.c]);
    const seen=new Set();pbqs=pbqs.filter(p=>{const k=(p.type==="hashid"||p.type==="fwrule"||p.type==="risk")?p.type:p.id;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,5);
  }else{qs=shuffle(XM_BANK[x].slice());pbqs=EXAM_PBQS[x].slice();}
  const items=pbqs.map(p=>xmNewPbqItem(p)).concat(qs.map(q=>({k:"q",id:q.id,ord:shuffle(q.o.map((_,i)=>i)),ans:[],conf:0,fl:false})));
  return items;
}
function xmNewPbqItem(p){
  const it={k:"p",id:p.id,type:p.type,conf:0,fl:false};
  if(p.type==="match"){it.L=shuffle(p.pairs.map((_,i)=>i));it.R=shuffle(p.pairs.map((_,i)=>i));it.assign={};it.sel=null;}
  else if(p.type==="order"){it.items=shuffle(p.steps.map((_,i)=>i));if(it.items.every((v,k)=>v===k))[it.items[0],it.items[1]]=[it.items[1],it.items[0]];it.seq=[];}
  else if(p.type==="hashid"){it.g=genHash();it.alg=null;it.bits="";}
  else if(p.type==="fwrule"){it.g=genFw();it.act=null;it.rule=null;}
  else if(p.type==="risk"){it.g=genRisk();it.vals={};it.worth=null;}
  else if(p.type==="exhibit"){it.sub=p.qs.map(()=>({ord:shuffle([0,1,2,3]),ans:null}));}
  return it;
}
function xmStart(x){
  xmMode="exam";
  XS={x,items:xmBuildItems(x),i:0,elapsed:0,running:false,pauses:[],started:Date.now(),done:false,drill:false};
  xmSaveLocal();
  xmResume();
}
function xmResume(){
  XS.running=true;XS.tick=Date.now();
  if(xmTimer)clearInterval(xmTimer);
  xmTimer=setInterval(xmTick,500);
  xmRenderItem();
}
function xmTick(){
  if(!XS||!XS.running)return;
  const now=Date.now();XS.elapsed+=now-XS.tick;XS.tick=now;
  const left=XM_MIN*60000-XS.elapsed;
  const el=$("#xmclock");if(el){el.textContent=xmFmt(left);el.classList.toggle("low",left<5*60000);}
  if(left<=0){XS.elapsed=XM_MIN*60000;xmSubmit(true);}
}
function xmPause(){
  if(!XS.running)return;
  XS.running=false;XS.pauses.push({at:XS.elapsed,t:Date.now()});
  xmSaveLocal();
  const ov=document.createElement("div");ov.className="xm-pause";ov.id="xmpause";
  ov.innerHTML=`<h2>Paused</h2><p>The clock is stopped. Pauses are logged on the report, because the real exam doesn't have one. ${xmFmt(XM_MIN*60000-XS.elapsed)} left.</p><button id="xmgo">Resume</button><button class="ghost" id="xmleave" style="margin-top:12px;background:none;border:1px solid #2A394C;color:var(--muted)">Leave (attempt is saved)</button>`;
  document.body.appendChild(ov);
  $("#xmgo").onclick=()=>{ov.remove();xmResume();};
  $("#xmleave").onclick=()=>{ov.remove();if(xmTimer){clearInterval(xmTimer);xmTimer=null;}renderExam();};
}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&XS&&XS.running&&!XS.done&&xmMode==="exam")xmPause();});

/* ---------- question rendering ---------- */
function xmTopbar(label){
  const left=XM_MIN*60000-XS.elapsed;
  return `<div class="xm-tb"><button id="xmpausebtn">${xmMode==="drill"?"Exit":"Pause"}</button><span class="xm-count">${label}</span><span class="sp"></span>${xmMode==="drill"?"":`<span class="xm-clock ${left<5*60000?"low":""}" id="xmclock">${xmFmt(left)}</span>`}<button class="gridbtn" id="xmgridbtn">${xmMode==="drill"?"List":"Review"}</button></div>`;
}
function xmConfHtml(it){
  return `<div class="xm-conf"><div class="cl">HOW SURE ARE YOU?</div><div class="cb">${XM_CONF.map((c,i)=>`<button data-c="${i}" class="${it.conf===i?"on"+i:""}">${c}<br><span style="font-size:10.5px;font-weight:600;opacity:.8">${XM_CONFLONG[i]}</span></button>`).join("")}</div></div>`;
}
function xmRenderItem(){
  const it=XS.items[XS.i];const n=XS.items.length;
  const label=`${XS.i+1} / ${n}`;
  let html=xmTopbar(label);
  if(it.k==="q")html+=xmQuestionHtml(it);else html+=xmPbqHtml(it);
  html+=xmConfHtml(it);
  html+=`<div class="xm-nav"><button id="xmprev" ${XS.i===0?"disabled style='opacity:.4'":""}>Back</button><button class="flag ${it.fl?"on":""}" id="xmflag" title="Flag for review">⚑</button>${XS.i===n-1?`<button class="submit" id="xmnext">Finish &amp; submit</button>`:`<button class="next" id="xmnext">Next</button>`}</div>`;
  $("#xmbody").innerHTML=html;
  $("#exam").scrollTop=0;
  $("#xmpausebtn").onclick=()=>{if(xmMode==="drill"){xmDrillDone();}else xmPause();};
  $("#xmgridbtn").onclick=()=>xmRenderGrid();
  $("#xmprev").onclick=()=>{if(XS.i>0){XS.i--;xmSaveLocal();xmRenderItem();}};
  $("#xmflag").onclick=()=>{it.fl=!it.fl;$("#xmflag").classList.toggle("on",it.fl);xmSaveLocal();};
  $("#xmnext").onclick=()=>{if(XS.i===n-1){xmRenderGrid(true);}else{XS.i++;xmSaveLocal();xmRenderItem();}};
  document.querySelectorAll(".xm-conf .cb button").forEach(b=>b.onclick=()=>{it.conf=+b.dataset.c;document.querySelectorAll(".xm-conf .cb button").forEach(x=>{x.className=(+x.dataset.c===it.conf)?"on"+it.conf:"";});xmSaveLocal();});
  if(it.k==="q")xmBindQuestion(it);else xmBindPbq(it);
}
function xmQuestionHtml(it){
  const q=xmQ(it.id);
  let h=`<div><span class="xm-dom">${DOMNAME[q.d]}</span><span class="xm-type">${q.t==="ms"?"choose "+q.pick:"single answer"}</span></div>`;
  if(q.dg&&DIAG[q.dg])h+=`<div class="qwrap">${DIAG[q.dg]}</div>`;
  if(q.ex)h+=`<pre class="out">${esc(q.ex)}</pre>`;
  h+=`<div class="xm-q">${esc(q.q)}${q.t==="ms"?`<span class="pickn">SELECT ${q.pick===2?"TWO":"THREE"}</span>`:""}</div>`;
  h+=`<div class="xm-opts" id="xmopts">${it.ord.map((oi,k)=>`<button class="xm-opt ${q.t==="ms"?"ms":""} ${it.ans.includes(oi)?"sel":""}" data-i="${oi}"><span class="k">${"ABCDEF"[k]}</span><span>${esc(q.o[oi].t)}</span></button>`).join("")}</div>`;
  return h;
}
function xmBindQuestion(it){
  const q=xmQ(it.id);
  document.querySelectorAll("#xmopts .xm-opt").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(q.t==="mc")it.ans=[i];
    else{if(it.ans.includes(i))it.ans=it.ans.filter(x=>x!==i);else{if(it.ans.length>=q.pick)it.ans.shift();it.ans.push(i);}}
    document.querySelectorAll("#xmopts .xm-opt").forEach(x=>x.classList.toggle("sel",it.ans.includes(+x.dataset.i)));
    xmSaveLocal();
  });
}
function xmAnswered(it){
  if(it.k==="q")return it.ans.length>0;
  if(it.type==="match")return Object.keys(it.assign).length>0;
  if(it.type==="order")return it.seq.length>0;
  if(it.type==="hashid")return it.alg!==null||!!(it.bits&&it.bits.trim());
  if(it.type==="fwrule")return it.act!==null||it.rule!==null;
  if(it.type==="risk")return it.worth!==null||Object.values(it.vals).some(v=>v&&v.trim());
  if(it.type==="exhibit")return it.sub.some(s=>s.ans!==null);
  return false;
}
function xmRenderGrid(final){
  const n=XS.items.length,un=XS.items.filter(it=>!xmAnswered(it)).length,fl=XS.items.filter(it=>it.fl).length;
  let html=xmTopbar("Review");
  html+=`<p class="lead" style="margin-bottom:6px">${final?"Last question done. ":""}${un?`<b style="color:var(--amber)">${un} unanswered</b>`:"Every question answered"}${fl?` · ${fl} flagged`:""}. Tap a number to jump.</p>`;
  html+=`<div class="xm-legend">Filled = answered · dot = flagged · red edge = marked "no clue" · dashed = PBQ</div>`;
  html+=`<div class="xm-grid">${XS.items.map((it,i)=>`<button data-i="${i}" class="${xmAnswered(it)?"ans":""} ${i===XS.i?"cur":""} ${it.fl?"fl":""} ${it.conf===2?"g2":""} ${it.k==="p"?"pb":""}">${i+1}</button>`).join("")}</div>`;
  if(xmMode==="drill")html+=`<div class="xm-actions"><button class="pri" id="xmsubmit">Finish drill</button><button id="xmback2">Back to question</button></div>`;
  else html+=`<div class="xm-actions"><button class="pri" id="xmsubmit">Submit exam${un?" ("+un+" blank will count wrong)":""}</button><button id="xmback2">Back to question ${XS.i+1}</button></div>`;
  $("#xmbody").innerHTML=html;$("#exam").scrollTop=0;
  $("#xmpausebtn").onclick=()=>{if(xmMode==="drill")xmDrillDone();else xmPause();};
  $("#xmgridbtn").onclick=()=>xmRenderItem();
  document.querySelectorAll(".xm-grid button").forEach(b=>b.onclick=()=>{XS.i=+b.dataset.i;xmSaveLocal();xmRenderItem();});
  $("#xmback2").onclick=()=>xmRenderItem();
  $("#xmsubmit").onclick=()=>{if(xmMode==="drill")return xmDrillDone();if(confirm(`Submit now?${un?" "+un+" unanswered questions will be scored as wrong.":""}`))xmSubmit(false);};
}

/* ---------- PBQ rendering inside the exam ---------- */
function xmPbqHtml(it){
  const p=xmP(it.id);
  let h=`<div><span class="xm-dom">${DOMNAME[p.d]}</span><span class="xm-type">PBQ · ${({match:"matching",order:"put in order",hashid:"hash identification",fwrule:"firewall rules",risk:"risk math",exhibit:"exhibit, "+(p.qs||[]).length+" parts"})[p.type]}</span></div>`;
  h+=`<div class="xm-q" style="font-size:15px">${esc(p.title)}<span class="pickn" style="color:var(--muted);text-transform:none;letter-spacing:0;font-weight:650">${esc(p.prompt||p.setup||"")}</span></div>`;
  if(p.type==="match")h+=`<div class="xm-mgrid"><div class="mcol" id="xmL"></div><div class="mcol" id="xmR"></div></div>`;
  else if(p.type==="order")h+=`<div id="xmolist"></div><button class="ghost" id="xmoundo">Undo last</button>`;
  else if(p.type==="hashid")h+=hashHtml(it.g,"");
  else if(p.type==="fwrule")h+=fwHtml(it.g,"");
  else if(p.type==="risk")h+=riskHtml(it.g,"");
  else if(p.type==="exhibit"){h+=`<pre class="out">${esc(p.out)}</pre>`+p.qs.map((sq,si)=>`<div class="xm-sub"><div class="sq">${si+1}. ${esc(sq.q)}</div><div class="xm-opts" data-s="${si}">${it.sub[si].ord.map((oi,k)=>`<button class="xm-opt ${it.sub[si].ans===oi?"sel":""}" data-i="${oi}"><span class="k">${"ABCD"[k]}</span><span>${esc(sq.o[oi])}</span></button>`).join("")}</div></div>`).join("");}
  return h;
}
function xmBindPbq(it){
  const p=xmP(it.id);
  if(p.type==="match"){
    const draw=()=>{
      const L=$("#xmL"),R=$("#xmR");L.innerHTML="";R.innerHTML="";const used=new Set(Object.values(it.assign));
      it.L.forEach(i=>{const b=document.createElement("button");b.className="mi";b.textContent=p.pairs[i][0];const paired=it.assign[i]!==undefined;if(it.sel===i)b.classList.add("sel");if(paired){b.classList.add("paired");const t=document.createElement("span");t.className="mtag";t.textContent="→ "+p.pairs[it.assign[i]][1];b.appendChild(t);}
        b.onclick=()=>{if(paired){delete it.assign[i];it.sel=null;}else it.sel=(it.sel===i)?null:i;xmSaveLocal();draw();};L.appendChild(b);});
      it.R.forEach(i=>{const b=document.createElement("button");b.className="mi";b.textContent=p.pairs[i][1];if(used.has(i))b.classList.add("used");b.onclick=()=>{if(it.sel===null||used.has(i))return;it.assign[it.sel]=i;it.sel=null;xmSaveLocal();draw();};R.appendChild(b);});
    };draw();
  }else if(p.type==="order"){
    const draw=()=>{const box=$("#xmolist");box.innerHTML="";it.items.forEach(i=>{const pos=it.seq.indexOf(i);const b=document.createElement("button");b.className="mi oi";const n=document.createElement("span");n.className="onum";n.textContent=pos>=0?pos+1:"";b.appendChild(n);b.appendChild(document.createTextNode(p.steps[i]));if(pos>=0)b.classList.add("paired");b.onclick=()=>{if(pos>=0)return;it.seq.push(i);xmSaveLocal();draw();};box.appendChild(b);});};
    $("#xmoundo").onclick=()=>{it.seq.pop();xmSaveLocal();draw();};draw();
  }else if(p.type==="hashid"){
    const inp=$("#xmbody .fi[data-k=bits]");if(inp){inp.value=it.bits||"";inp.oninput=()=>{it.bits=inp.value;xmSaveLocal();};}
    document.querySelectorAll("#xmbody .hx-opts .opt").forEach(b=>{b.classList.toggle("sel",b.dataset.alg===it.alg);b.onclick=()=>{it.alg=b.dataset.alg;document.querySelectorAll("#xmbody .hx-opts .opt").forEach(x=>x.classList.toggle("sel",x.dataset.alg===it.alg));xmSaveLocal();};});
  }else if(p.type==="fwrule"){
    document.querySelectorAll("#xmbody .fw-act .opt").forEach(b=>{b.classList.toggle("sel",b.dataset.act===it.act);b.onclick=()=>{it.act=b.dataset.act;document.querySelectorAll("#xmbody .fw-act .opt").forEach(x=>x.classList.toggle("sel",x.dataset.act===it.act));xmSaveLocal();};});
    document.querySelectorAll("#xmbody .fw-rule .opt").forEach(b=>{b.classList.toggle("sel",b.dataset.rule===it.rule);b.onclick=()=>{it.rule=b.dataset.rule;document.querySelectorAll("#xmbody .fw-rule .opt").forEach(x=>x.classList.toggle("sel",x.dataset.rule===it.rule));xmSaveLocal();};});
  }else if(p.type==="risk"){
    document.querySelectorAll("#xmbody .fi").forEach(inp=>{inp.value=it.vals[inp.dataset.k]||"";inp.oninput=()=>{it.vals[inp.dataset.k]=inp.value;xmSaveLocal();};});
    document.querySelectorAll("#xmbody .rk-worth .opt").forEach(b=>{b.classList.toggle("sel",b.dataset.w===it.worth);b.onclick=()=>{it.worth=b.dataset.w;document.querySelectorAll("#xmbody .rk-worth .opt").forEach(x=>x.classList.toggle("sel",x.dataset.w===it.worth));xmSaveLocal();};});
  }else if(p.type==="exhibit"){
    document.querySelectorAll("#xmbody .xm-opts[data-s]").forEach(box=>{const si=+box.dataset.s;box.querySelectorAll(".xm-opt").forEach(b=>b.onclick=()=>{it.sub[si].ans=+b.dataset.i;box.querySelectorAll(".xm-opt").forEach(x=>x.classList.toggle("sel",+x.dataset.i===it.sub[si].ans));xmSaveLocal();});});
  }
}

/* ---------- scoring ---------- */
function xmScoreQ(it){const q=xmQ(it.id);const ok=q.o.map((o,i)=>o.ok?i:-1).filter(i=>i>=0);const a=it.ans.slice().sort();return ok.length===a.length&&ok.every((v,k)=>v===a.sort()[k])?1:0;}
function xmScoreP(it){
  const p=xmP(it.id);let f=0,notes=[];
  if(p.type==="match"){let ok=0;p.pairs.forEach((_,i)=>{if(it.assign[i]===i)ok++;});f=ok/p.pairs.length;p.pairs.forEach((x,i)=>{const j=it.assign[i];if(j===undefined)notes.push(x[0]+" was left unmatched.");else if(j!==i)notes.push("You paired "+x[0]+" with "+p.pairs[j][1]+"; that belongs to "+p.pairs[j][0]+".");});notes.push("Key: "+p.pairs.map(x=>x[0]+" → "+x[1]).join(" · "));}
  else if(p.type==="order"){let ok=0;it.seq.forEach((v,k)=>{if(v===k)ok++;});f=ok/p.steps.length;p.steps.forEach((s,i)=>{const k=it.seq.indexOf(i);if(k===-1)notes.push("Never placed: \""+s+"\" (step "+(i+1)+").");else if(k!==i)notes.push("\""+s+"\" is step "+(i+1)+"; you put it at "+(k+1)+".");});notes.push("Correct order: "+p.steps.map((s,i)=>(i+1)+". "+s).join("  "));}
  else if(p.type==="hashid"){const r=hashCheck(it.g,it.alg,it.bits);f=r.score/100;notes.push(r.why);}
  else if(p.type==="fwrule"){const r=fwCheck(it.g,it.act,it.rule);f=r.score/100;notes.push(r.why);}
  else if(p.type==="risk"){const r=riskCheck(it.g,it.vals.sle,it.vals.ale,it.worth);f=r.score/100;notes.push(r.why);}
  else if(p.type==="exhibit"){let ok=0;p.qs.forEach((sq,si)=>{if(it.sub[si].ans===0)ok++;else notes.push((si+1)+". "+(it.sub[si].ans===null?"Left blank. ":"You picked: "+sq.o[it.sub[si].ans]+". ")+"Answer: "+sq.o[0]+" — "+sq.x);});f=ok/p.qs.length;}
  return {f,notes,why:p.why||""};
}
function xmSubmit(timedOut){
  if(!XS||XS.done)return;
  XS.running=false;XS.done=true;if(xmTimer){clearInterval(xmTimer);xmTimer=null;}
  const dom={1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0]},conf={0:[0,0],1:[0,0],2:[0,0]};
  let pts=0,max=0;const miss=[],guess=[],flags=[],detail=[];
  XS.items.forEach(it=>{
    if(it.k==="q"){const q=xmQ(it.id);const r=xmScoreQ(it);pts+=r;max+=1;dom[q.d][0]+=r;dom[q.d][1]+=1;conf[it.conf][0]+=r;conf[it.conf][1]+=1;if(!r)miss.push(it.id);if(it.conf===2)guess.push(it.id);if(it.fl)flags.push(it.id);detail.push({id:it.id,r,conf:it.conf,ans:it.ans});}
    else{const p=xmP(it.id);const s=xmScoreP(it);const e=s.f*XM_PBQ_PTS;pts+=e;max+=XM_PBQ_PTS;dom[p.d][0]+=e;dom[p.d][1]+=XM_PBQ_PTS;conf[it.conf][0]+=s.f;conf[it.conf][1]+=1;if(s.f<1)miss.push(it.id);if(it.conf===2)guess.push(it.id);if(it.fl)flags.push(it.id);detail.push({id:it.id,r:s.f,conf:it.conf,notes:s.notes,why:s.why});}
  });
  for(const d in dom){dom[d][0]=Math.round(dom[d][0]*100)/100;}
  for(const c in conf){conf[c][0]=Math.round(conf[c][0]*100)/100;}
  const raw=Math.round(pts/max*100);const scaled=Math.round(100+800*pts/max);
  const fresh=XS.x!=="mix"&&xmTaken(XS.x)===0;
  const gate=fresh&&raw>=XM_GATE.all&&Object.values(dom).every(p=>xmPct(p)>=XM_GATE.dom);
  const res={t:Date.now(),x:XS.x,fresh,raw,scaled,pass:scaled>=XM_PASS,gate,dom,conf,secs:Math.round(XS.elapsed/1000),pauses:XS.pauses.length,timedOut:!!timedOut,miss,guess,flags,detail};
  examHist.push(res);
  if(examHist.length>40)examHist.splice(0,examHist.length-40);
  bumpDay(5);saveState();
  XS=null;xmSaveLocal();
  xmShowResult(res,true);
}

/* ---------- results ---------- */
function xmShowResult(res,fresh){
  show("exam");
  const c=res.pass?"var(--green)":"var(--red)";
  const wk=Object.keys(res.dom).filter(d=>xmPct(res.dom[d])<XM_GATE.dom);
  let html=`<div class="xm-tb"><button id="xmhome">Exams</button><div class="labtitle">${XM_EXAMS[res.x]?XM_EXAMS[res.x].name:"Random mix"} · ${xmDate(res.t)}</div></div>`;
  html+=`<div class="xm-score"><div class="big" style="color:${c}">${res.scaled}</div><div class="pf" style="color:${c}">${res.pass?"PASS":"NOT YET"} · ${res.raw}% raw · 720 to pass</div><div class="sub">${Math.round(res.secs/60)} min used${res.pauses?" · paused "+res.pauses+"×":""}${res.timedOut?" · <b style='color:var(--red)'>time ran out</b>":""} · ${res.miss.length} missed · ${res.guess.length} marked no-clue</div></div>`;
  html+=`<div class="xm-gate" style="margin-top:10px"><div class="gt">GATE CHECK · ${XM_GATE.all}% overall, ${XM_GATE.dom}% every domain</div><div class="gv">${res.gate?"<b>Cleared.</b> This attempt counts toward the two-in-a-row.":(res.fresh===false?"Not a fresh exam, so it can't count toward the gate. ":"")+(res.raw<XM_GATE.all?`<i>${res.raw}%</i> overall, need ${XM_GATE.all}%. `:"")+(wk.length?`Under ${XM_GATE.dom}% in <i>${wk.map(d=>DOMNAME[d]).join(", ")}</i>.`:"")}</div></div>`;
  html+=`<div class="reft">By domain</div><div class="xm-bars">${[1,2,3,4,5].map(d=>{const p=xmPct(res.dom[d]);return `<div class="xm-bar"><span class="nm">${DOMNAME[d]}<br><span style="font-weight:600;opacity:.7">${XM_DOMW[d]} of exam · ${res.dom[d][1]} pts</span></span><span class="tr" style="--gate:${XM_GATE.dom}%"><i class="${p>=XM_GATE.all?"":p>=XM_GATE.dom?"warn":"bad"}" style="width:${p}%"></i></span><span class="pc" style="color:${p>=XM_GATE.all?"var(--green)":p>=XM_GATE.dom?"var(--amber)":"var(--red)"}">${p}%</span></div>`;}).join("")}</div>`;
  html+=`<div class="reft">How good are your guesses?</div><table class="xm-tbl"><tr><th>You said</th><th style="text-align:right">Questions</th><th style="text-align:right">Right</th><th style="text-align:right">Hit rate</th></tr>${[0,1,2].map(k=>{const p=res.conf[k];const pct=p[1]?Math.round(p[0]/p[1]*100):null;return `<tr><td class="g${k}">${XM_CONF[k]}<br><span style="font-size:11px;color:var(--muted)">${XM_CONFLONG[k]}</span></td><td class="r">${p[1]}</td><td class="r">${Math.round(p[0])}</td><td class="r g${k}">${pct===null?"—":pct+"%"}</td></tr>`;}).join("")}</table>`;
  html+=`<div class="xm-note">${xmConfNote(res)}</div>`;
  html+=`<div class="xm-actions">${res.miss.length||res.guess.length?`<button class="pri" id="xmdrill">Drill the ${new Set(res.miss.concat(res.guess)).size} missed + guessed (with answers)</button>`:""}${res.miss.length?`<button class="amb" id="xmreview">Review every miss with explanations</button>`:""}<button id="xmcards">Flashcards for the weak topics</button>${fresh?"":""}<button class="ghost" id="xmhome2">Back to exams</button></div>`;
  $("#xmbody").innerHTML=html;$("#exam").scrollTop=0;
  $("#xmhome").onclick=renderExam;$("#xmhome2").onclick=renderExam;
  const dr=$("#xmdrill");if(dr)dr.onclick=()=>xmStartDrill(res);
  const rv=$("#xmreview");if(rv)rv.onclick=()=>xmReview(res);
  $("#xmcards").onclick=()=>xmCardsFor(res);
}
function xmConfNote(res){
  const s=res.conf[0],l=res.conf[1],g=res.conf[2];
  const pct=p=>p[1]?p[0]/p[1]*100:null;
  const ps=pct(s),pl=pct(l),pg=pct(g);
  const out=[];
  if(ps!==null&&ps<85)out.push(`<b>Overconfidence check:</b> you were "sure" on ${s[1]} questions but only got ${Math.round(ps)}% of them. Those are the misses to study hardest: you don't know that you don't know them.`);
  else if(ps!==null)out.push(`<b>Calibration is good:</b> when you said "sure" you were right ${Math.round(ps)}% of the time.`);
  if(pg!==null){if(pg>=50)out.push(`<b>Your guesses beat chance</b> (${Math.round(pg)}% on ${g[1]} "no clue" questions vs ~25% random). Your instincts are worth trusting on the real exam: never leave one blank.`);else out.push(`Your "no clue" guesses landed ${Math.round(pg)}% (${g[1]} questions). Around 25% is pure chance; use the explanations to learn how to eliminate distractors.`);}
  if(pl!==null)out.push(`"Leaning" answers: ${Math.round(pl)}% right on ${l[1]}. ${pl>=70?"Your lean is usually right; commit to it.":"When you lean, slow down and eliminate two options before choosing."}`);
  return out.join(" ")||"Mark your confidence on every question next time to unlock this analysis.";
}
function xmCardsFor(res){
  const cats={};res.miss.forEach(id=>{const q=xmQ(id)||xmP(id);if(q&&q.cat)cats[q.cat]=(cats[q.cat]||0)+1;});
  const order=Object.keys(cats).sort((a,b)=>cats[b]-cats[a]);
  if(!order.length){alert("No misses to build from. Nice.");return;}
  let set=[];order.forEach(c=>{set=set.concat(shuffle(CARDS.filter(cd=>cd.c===c)).slice(0,Math.max(3,Math.ceil(20*cats[c]/res.miss.length))));});
  startTodaySet(shuffle(set).slice(0,24));
}
function xmReview(res){
  show("exam");
  let html=`<div class="xm-tb"><button id="xmback">Report</button><div class="labtitle">Misses · ${res.miss.length}</div></div><p class="lead">Every miss, with why the right answer is right and why each distractor is wrong. Read it once now and again tomorrow.</p>`;
  res.miss.forEach(id=>{
    const d=res.detail.find(x=>x.id===id);
    const q=xmQ(id);
    if(q){
      html+=`<div class="xm-rev"><div class="rh"><span style="color:var(--amber)">${DOMNAME[q.d]}${q.t==="ms"?" · choose "+q.pick:""}</span><span class="st">${d&&d.conf!==undefined?XM_CONF[d.conf]:""} · missed</span></div>${q.ex?`<pre class="out">${esc(q.ex)}</pre>`:""}<div class="rq">${esc(q.q)}</div><div class="xm-opts">${q.o.map((o,i)=>`<div class="xm-opt ${o.ok?"right":(d&&d.ans&&d.ans.includes(i))?"wrong":""}" style="cursor:default"><span class="k">${o.ok?"✓":(d&&d.ans&&d.ans.includes(i))?"✗":""}</span><span>${esc(o.t)}<span class="ox">${esc(o.x)}</span></span></div>`).join("")}</div><div class="rx"><b>Remember:</b> ${esc(q.w)}</div></div>`;
    }else{
      const p=xmP(id);if(!p)return;
      html+=`<div class="xm-rev"><div class="rh"><span style="color:var(--amber)">${DOMNAME[p.d]} · PBQ</span><span class="st">${d?Math.round(d.r*100)+"%":""}</span></div><div class="rq">${esc(p.title)}</div>${p.out?`<pre class="out">${esc(p.out)}</pre>`:""}<div class="rx">${d&&d.notes?esc(d.notes.join("\n")).replace(/\n/g,"<br>"):""}${d&&d.why?`<br><br><b>Remember:</b> ${esc(d.why)}`:""}</div></div>`;
    }
  });
  $("#xmbody").innerHTML=html;$("#exam").scrollTop=0;
  $("#xmback").onclick=()=>xmShowResult(res);
}

/* ---------- drill: re-run missed + guessed with instant feedback ---------- */
function xmStartDrill(res){
  const ids=[...new Set(res.miss.concat(res.guess))].filter(id=>xmQ(id));
  const pb=[...new Set(res.miss.concat(res.guess))].filter(id=>xmP(id)).map(id=>xmP(id));
  xmMode="drill";
  XS={x:res.x,items:pb.map(p=>xmNewPbqItem(p)).concat(shuffle(ids).map(id=>{const q=xmQ(id);return {k:"q",id,ord:shuffle(q.o.map((_,i)=>i)),ans:[],conf:0,fl:false};})),i:0,elapsed:0,running:false,pauses:[],started:Date.now(),done:false,drill:true,from:res,right:0};
  xmDrillItem();
}
function xmDrillItem(){
  const it=XS.items[XS.i];const n=XS.items.length;
  let html=`<div class="xm-tb"><button id="xmpausebtn">Exit</button><span class="xm-count">Drill · ${XS.i+1} / ${n} · ${XS.right} right</span><span class="sp"></span></div>`;
  if(it.k==="q")html+=xmQuestionHtml(it);else html+=xmPbqHtml(it);
  html+=`<div id="xmfb"></div><div class="xm-nav"><button class="next" id="xmcheck">Check</button></div>`;
  $("#xmbody").innerHTML=html;$("#exam").scrollTop=0;
  $("#xmpausebtn").onclick=()=>xmDrillDone();
  if(it.k==="q")xmBindQuestion(it);else xmBindPbq(it);
  $("#xmcheck").onclick=()=>{
    let fb="";
    if(it.k==="q"){const q=xmQ(it.id);const r=xmScoreQ(it);if(r)XS.right++;
      document.querySelectorAll("#xmopts .xm-opt").forEach(b=>{const i=+b.dataset.i;const o=q.o[i];b.classList.remove("sel");if(o.ok)b.classList.add("right");else if(it.ans.includes(i))b.classList.add("wrong");b.onclick=null;const sp=document.createElement("span");sp.className="ox";sp.textContent=o.x;b.lastElementChild.appendChild(sp);});
      fb=`<div class="xm-fb"><b>${r?"Correct.":"Not quite."}</b> ${esc(q.w)}</div>`;
    }else{const s=xmScoreP(it);if(s.f>=0.999)XS.right++;fb=`<div class="xm-fb"><b>${Math.round(s.f*100)}%</b>\n${esc(s.notes.join("\n"))}${s.why?"\n\n"+esc(s.why):""}</div>`;
      document.querySelectorAll("#xmbody .mi,#xmbody .hrow,#xmbody .opt,#xmbody .xm-opt").forEach(b=>{b.onclick=null;b.disabled=true;});document.querySelectorAll("#xmbody .fi").forEach(i=>i.disabled=true);}
    $("#xmfb").innerHTML=fb;
    $("#xmcheck").textContent=XS.i===n-1?"Finish":"Next";$("#xmcheck").onclick=()=>{XS.i++;if(XS.i>=n)xmDrillDone();else xmDrillItem();};
    $("#xmfb").scrollIntoView({behavior:"smooth",block:"end"});
  };
}
function xmDrillDone(){
  const from=XS&&XS.from;const n=XS?XS.items.length:0,r=XS?XS.right:0;
  XS=null;xmMode="exam";
  if(from){bumpDay(1);saveState();
    $("#xmbody").innerHTML=`<div class="xm-tb"><button id="xmback">Report</button><div class="labtitle">Drill done</div></div><div class="xm-score"><div class="big" style="color:${n&&r/n>=.8?"var(--green)":"var(--amber)"}">${n?Math.round(r/n*100):0}%</div><div class="sub">${r} of ${n} on the second pass.</div></div><div class="xm-actions"><button class="pri" id="xmagain">Run the drill again</button><button class="ghost" id="xmback2">Back to report</button></div>`;
    $("#xmback").onclick=()=>xmShowResult(from);$("#xmback2").onclick=()=>xmShowResult(from);$("#xmagain").onclick=()=>xmStartDrill(from);
  }else renderExam();
}
