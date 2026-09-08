// node dev/check-cards.js d12   -> validates data/cards-d12.js ; node dev/check-cards.js all -> cross-file checks
const fs=require("fs"),vm=require("vm"),path=require("path");
const CATS=new Set(["controls","crypto","ports","actors","social","attacks","vulns","arch","netsec","data","harden","iam","ops","ir","gov","third"]);
const DG=new Set(["cia","symasym","sig","pki","dot1x","dmz","vpn","zerotrust","killchain","irlife","saml","backups","hash","fwrules","controls","risk"]);
const part=(process.argv[2]||"d12").toLowerCase();
const parts=part==="all"?["d12","d34","d45"]:[part];
let all=[];const errs=[],warns=[];
for(const p of parts){
  const f=path.join(__dirname,"..","data",`cards-${p}.js`);
  if(!fs.existsSync(f)){errs.push(`${f} missing`);continue;}
  const ctx={};vm.createContext(ctx);
  try{vm.runInContext(fs.readFileSync(f,"utf8")+`;this.__C=CARDS_${p.toUpperCase()};`,ctx);}catch(e){errs.push(`${p}: parse error ${e.message}`);continue;}
  if(!Array.isArray(ctx.__C)){errs.push(`${p}: not an array`);continue;}
  ctx.__C.forEach(c=>c.__p=p);all=all.concat(ctx.__C);
}
function shortOf(c){const lines=(c.a||"").split("\n");const big=lines.find(l=>l.startsWith("#"));return (c.s||(big?big.slice(1):lines[0])||"").trim();}
const byCat={},shorts={},qs=new Set();
all.forEach((c,i)=>{
  const tag=`${c.__p}#${i+1} [${c.c}] ${(c.q||"").slice(0,40)}`;
  if(!CATS.has(c.c))errs.push(`${tag}: bad category`);
  if(typeof c.q!=="string"||c.q.length<3)errs.push(`${tag}: missing q`);
  if(c.q&&c.q.length>90)warns.push(`${tag}: q ${c.q.length} chars (>90)`);
  if(typeof c.a!=="string"||!c.a)errs.push(`${tag}: missing a`);
  if(c.a&&c.a.split("\n").length>3)warns.push(`${tag}: a has ${c.a.split("\n").length} lines (>3)`);
  if(typeof c.x!=="string"||c.x.length<200)errs.push(`${tag}: x missing or <200 chars`);
  if(c.x&&c.x.length>560)warns.push(`${tag}: x ${c.x.length} chars (>560)`);
  if(c.w&&c.w.length>120)warns.push(`${tag}: w ${c.w.length} chars (>120)`);
  if(c.v&&!DG.has(c.v))errs.push(`${tag}: unknown v ${c.v}`);
  if(c.vq&&!DG.has(c.vq))errs.push(`${tag}: unknown vq ${c.vq}`);
  const s=shortOf(c);if(s.length>60)warns.push(`${tag}: short ${s.length} chars (>60): "${s}"`);
  if(!s)errs.push(`${tag}: empty short`);
  const key=c.c+"|"+c.q+(c.vq?"|"+c.vq:"");if(qs.has(key))errs.push(`${tag}: duplicate q in category`);qs.add(key);
  const sk=c.c+"|"+s.toLowerCase();if(shorts[sk])errs.push(`${tag}: short "${s}" duplicates ${shorts[sk]}`);shorts[sk]=tag;
  if(c.c==="ports"&&!/^\d/.test(s))errs.push(`${tag}: ports short must start with a digit`);
  if(/<[a-z]+>/i.test(c.q+c.a+c.x))errs.push(`${tag}: HTML tags not allowed`);
  byCat[c.c]=(byCat[c.c]||0)+1;
});
if(part==="all"){for(const k of CATS)if((byCat[k]||0)<8)errs.push(`category ${k} has ${byCat[k]||0} cards (<8)`);}
console.log(`${parts.join("+")}: ${all.length} cards`,JSON.stringify(byCat));
warns.forEach(w=>console.log("WARN "+w));errs.forEach(e=>console.log("ERR  "+e));
console.log(errs.length?`FAIL (${errs.length})`:"PASS");process.exit(errs.length?1:0);
