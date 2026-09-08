// node dev/check-practice.js  -> validates data/exq.js, data/twins.js, data/lab.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const errs=[],warns=[];
function load(file,name){const f=path.join(__dirname,"..","data",file);if(!fs.existsSync(f)){errs.push(`${file} missing`);return null;}const ctx={};vm.createContext(ctx);try{vm.runInContext(fs.readFileSync(f,"utf8")+`;this.__X=${name};`,ctx);}catch(e){errs.push(`${file}: ${e.message}`);return null;}return ctx.__X;}
const EXQ=load("exq.js","EXQ"),TWINS=load("twins.js","TWINS"),LAB=load("lab.js","LAB_PBQS");
if(EXQ){
  const quota={1:11,2:20,3:17,4:26,5:18},dom={1:0,2:0,3:0,4:0,5:0},stems=new Set();
  EXQ.forEach((q,i)=>{const t=`exq #${i+1} ${q.id}`;const want="x"+String(i+1).padStart(3,"0");if(q.id!==want)errs.push(`${t}: id should be ${want}`);
    if(!quota[q.d])errs.push(`${t}: bad d`);else dom[q.d]++;
    if(!q.q||q.q.length<25)errs.push(`${t}: stem`);if(q.q&&q.q.length>380)warns.push(`${t}: stem ${q.q.length}>380`);
    const k=(q.q||"").toLowerCase().trim();if(stems.has(k))errs.push(`${t}: duplicate stem`);stems.add(k);
    if(!Array.isArray(q.o)||q.o.length!==4)errs.push(`${t}: needs 4 options`);else{q.o.forEach((o,j)=>{if(o.length>100)warns.push(`${t}: option ${j} ${o.length}>100`);});if(new Set(q.o.map(o=>o.toLowerCase())).size!==4)errs.push(`${t}: duplicate options`);}
    if(!q.w||q.w.length<20)errs.push(`${t}: w`);if(!Array.isArray(q.n)||q.n.length!==3||q.n.some(x=>!x||x.length<12))errs.push(`${t}: n needs 3 explanations`);});
  for(const d in quota)if(dom[d]!==quota[d])errs.push(`exq domain ${d}: ${dom[d]} vs quota ${quota[d]}`);
  let run=1;for(let i=1;i<EXQ.length;i++){run=EXQ[i].d===EXQ[i-1].d?run+1:1;if(run>=6){warns.push(`exq domain run of ${run} at #${i+1}`);break;}}
  console.log(`exq: ${EXQ.length}`,JSON.stringify(dom));
}
if(TWINS){
  TWINS.forEach((t,i)=>{const g=`twin #${i+1} ${t.a}/${t.b}`;if(!t.a||!t.b||!t.n||t.n.length<40)errs.push(`${g}: a/b/n`);if(!Array.isArray(t.s)||t.s.length<4)errs.push(`${g}: need ≥4 statements`);else{const a=t.s.filter(x=>x[1]==="a").length,b=t.s.filter(x=>x[1]==="b").length;if(a<2||b<2)errs.push(`${g}: need ≥2 statements each side`);t.s.forEach(x=>{if(!["a","b"].includes(x[1]))errs.push(`${g}: side must be a|b`);});}});
  if(TWINS.length<40)errs.push(`twins: ${TWINS.length} (<40)`);console.log(`twins: ${TWINS.length}`);
}
if(LAB){
  const n={match:0,order:0,scenario:0},ids=new Set();
  LAB.forEach((p,i)=>{const g=`lab #${i+1} ${p.id}`;if(ids.has(p.id))errs.push(`${g}: dup id`);ids.add(p.id);if(!p.title)errs.push(`${g}: title`);
    if(p.type==="match"){n.match++;if(!/^m-/.test(p.id))errs.push(`${g}: id prefix`);if(!Array.isArray(p.pairs)||p.pairs.length<5)errs.push(`${g}: ≥5 pairs`);else{if(new Set(p.pairs.map(x=>x[1].toLowerCase())).size!==p.pairs.length)errs.push(`${g}: duplicate right-side`);if(new Set(p.pairs.map(x=>x[0].toLowerCase())).size!==p.pairs.length)errs.push(`${g}: duplicate left-side`);}}
    else if(p.type==="order"){n.order++;if(!/^o-/.test(p.id))errs.push(`${g}: id prefix`);if(!Array.isArray(p.steps)||p.steps.length<4)errs.push(`${g}: ≥4 steps`);}
    else if(p.type==="scenario"){n.scenario++;if(!/^s-/.test(p.id))errs.push(`${g}: id prefix`);if(!p.setup||!p.q||!Array.isArray(p.opts)||p.opts.length!==4||!p.why||!Array.isArray(p.no)||p.no.length!==3)errs.push(`${g}: scenario fields`);}
    else errs.push(`${g}: bad type ${p.type}`);});
  if(n.match<8||n.order<6||n.scenario<10)errs.push(`lab mix ${JSON.stringify(n)}; need match≥8 order≥6 scenario≥10`);
  console.log(`lab: ${LAB.length}`,JSON.stringify(n));
}
warns.forEach(w=>console.log("WARN "+w));errs.forEach(e=>console.log("ERR  "+e));
console.log(errs.length?`FAIL (${errs.length})`:"PASS");process.exit(errs.length?1:0);
