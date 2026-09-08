// node dev/check.js a   -> validates exam/bank-a.js against _SPEC.md
const fs=require("fs"),vm=require("vm"),path=require("path");
const x=(process.argv[2]||"a").toLowerCase();
const file=path.join(__dirname,"..","exam",`bank-${x}.js`);
const src=fs.readFileSync(file,"utf8");
const ctx={};vm.createContext(ctx);
vm.runInContext(src+`;this.__B=EXAM_BANK_${x.toUpperCase()};`,ctx);
const B=ctx.__B;
const errs=[],warns=[];
const CATS=new Set(["controls","crypto","ports","actors","social","attacks","vulns","arch","netsec","data","harden","iam","ops","ir","gov","third"]);
const DG=new Set(["cia","symasym","sig","pki","dot1x","dmz","vpn","zerotrust","killchain","irlife","saml","backups","hash","fwrules","controls","risk"]);
const QUOTA={1:10,2:19,3:15,4:24,5:17};
if(!Array.isArray(B))errs.push("not an array");
if(B.length!==85)errs.push(`expected 85 questions, got ${B.length}`);
const ids=new Set(),stems=new Set();
const dom={1:0,2:0,3:0,4:0,5:0};let ms=0,ex=0;
const existing=fs.existsSync(path.join(__dirname,"existing-questions.txt"))?fs.readFileSync(path.join(__dirname,"existing-questions.txt"),"utf8").split("\n").map(s=>s.trim().toLowerCase()).filter(Boolean):[];
B.forEach((q,i)=>{
  const tag=`#${i+1} ${q.id||"?"}`;
  const want=x+String(i+1).padStart(3,"0");
  if(q.id!==want)errs.push(`${tag}: id should be ${want}`);
  if(ids.has(q.id))errs.push(`${tag}: duplicate id`);ids.add(q.id);
  if(!QUOTA[q.d])errs.push(`${tag}: bad domain ${q.d}`);else dom[q.d]++;
  if(!CATS.has(q.cat))errs.push(`${tag}: bad cat ${q.cat}`);
  if(q.dg&&!DG.has(q.dg))errs.push(`${tag}: unknown dg ${q.dg}`);
  if(!["mc","ms"].includes(q.t))errs.push(`${tag}: bad t ${q.t}`);
  if(typeof q.q!=="string"||q.q.length<20)errs.push(`${tag}: stem missing/short`);
  if(q.q&&q.q.length>420)warns.push(`${tag}: stem ${q.q.length} chars (>420)`);
  const key=(q.q||"").toLowerCase().replace(/\s+/g," ").trim();
  if(stems.has(key))errs.push(`${tag}: duplicate stem`);stems.add(key);
  if(existing.includes(key))errs.push(`${tag}: stem duplicates existing pool`);
  if(q.ex)ex++;
  if(q.t==="ms"){ms++;if(![2,3].includes(q.pick))errs.push(`${tag}: ms needs pick 2|3`);}
  if(!Array.isArray(q.o))return errs.push(`${tag}: no options`);
  const n=q.o.length,ok=q.o.filter(o=>o.ok===true).length;
  if(q.t==="mc"&&n!==4)errs.push(`${tag}: mc needs 4 options, has ${n}`);
  if(q.t==="mc"&&ok!==1)errs.push(`${tag}: mc needs exactly 1 ok, has ${ok}`);
  if(q.t==="ms"&&(n<5||n>6))errs.push(`${tag}: ms needs 5-6 options, has ${n}`);
  if(q.t==="ms"&&ok!==q.pick)errs.push(`${tag}: ms pick=${q.pick} but ${ok} ok`);
  q.o.forEach((o,k)=>{
    if(typeof o.t!=="string"||!o.t)errs.push(`${tag}: option ${k} no text`);
    if(o.t&&o.t.length>120)warns.push(`${tag}: option ${k} ${o.t.length} chars (>120)`);
    if(typeof o.ok!=="boolean")errs.push(`${tag}: option ${k} ok not boolean`);
    if(typeof o.x!=="string"||o.x.length<15)errs.push(`${tag}: option ${k} missing explanation`);
    if(o.x&&o.x.length>260)warns.push(`${tag}: option ${k} x ${o.x.length} chars (>260)`);
  });
  const texts=q.o.map(o=>o.t.toLowerCase().trim());if(new Set(texts).size!==texts.length)errs.push(`${tag}: duplicate option text`);
  if(typeof q.w!=="string"||q.w.length<15)errs.push(`${tag}: missing w`);
  if(q.w&&q.w.length>260)warns.push(`${tag}: w ${q.w.length} chars (>260)`);
});
for(const d in QUOTA)if(dom[d]!==QUOTA[d])errs.push(`domain ${d}: ${dom[d]} questions, quota ${QUOTA[d]}`);
if(ms!==8)errs.push(`multi-select count ${ms}, need 8`);
if(ex<10)errs.push(`exhibit count ${ex}, need >=10`);
// grouping check: no run of 6+ same domain
let run=1;for(let i=1;i<B.length;i++){run=B[i].d===B[i-1].d?run+1:1;if(run>=6){warns.push(`domain run of ${run} ending at #${i+1} — shuffle across domains`);break;}}
console.log(`bank-${x}: ${B.length} Qs, domains ${JSON.stringify(dom)}, ms ${ms}, exhibits ${ex}`);
warns.forEach(w=>console.log("WARN "+w));
errs.forEach(e=>console.log("ERR  "+e));
console.log(errs.length?`FAIL (${errs.length} errors)`:"PASS");
process.exit(errs.length?1:0);
