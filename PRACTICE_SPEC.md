# Practice content spec — Sec+ Gym Cards (SY0-701)

Three files, each a plain JS file defining exactly one global constant. Validate with `node dev/check-practice.js` until PASS. Read `dev/CATS.md` first (categories, domains, diagram keys, source material rules). All text original; SY0-701 facts.

## 1. `data/exq.js` — exam-style questions pool (92 questions)

```js
const EXQ=[
{id:"x001",d:4,q:"Scenario stem… Which of the following is the MOST likely…?",
 o:["Correct option","Wrong 1","Wrong 2","Wrong 3"],      // FIRST option is always correct; the app shuffles
 w:"Why the correct answer is correct (1–3 sentences).",
 n:["Why Wrong 1 is wrong here.","Why Wrong 2 is wrong here.","Why Wrong 3 is wrong here."]},
…
];
```
Quotas by domain (d): 1 → 11, 2 → 20, 3 → 17, 4 → 26, 5 → 18 (= 92). Single-answer only. Options ≤ 100 chars, stems ≤ 380 chars, each `n` and `w` 1–2 sentences, scenario-specific. Mix domains (no runs of 6+). CompTIA voice: MOST / BEST / FIRST. Cover the same breadth as the domain checklists in `dev/EXAM_SPEC.md`. Every stem must differ from every other.

## 2. `data/twins.js` — confusable twins (45 pairs)

```js
const TWINS=[
{a:"Vulnerability scan",b:"Penetration test",n:"One paragraph contrasting the two (2–3 sentences).",
 s:[["Statement that is true of A","a"],["Statement true of B","b"], … 4–6 statements, at least 2 of each]},
…
];
```
Pick pairs the exam deliberately confuses. Required pairs (add more to reach 45): symmetric vs asymmetric; hashing vs encryption; encryption vs encoding; digital signature vs HMAC (or MAC); certificate revocation CRL vs OCSP; key escrow vs key stretching; TPM vs HSM; tokenization vs masking; data masking vs encryption; steganography vs obfuscation; IDS vs IPS; WAF vs NGFW; proxy vs reverse proxy; load balancer vs cluster; hot vs warm vs cold site (do as hot vs warm and warm vs cold); RTO vs RPO; MTTR vs MTBF; full vs incremental vs differential (two pairs); snapshot vs replication; authentication vs authorization; identification vs authentication; SAML vs OAuth; OAuth vs OpenID Connect (if you can keep it accurate; otherwise SAML vs LDAP); RADIUS vs TACACS+; MAC vs DAC; RBAC (role) vs ABAC; rule-based vs role-based; MFA factors: something you have vs something you are; hard token vs soft token; phishing vs spear phishing; vishing vs smishing; pretexting vs impersonation; whaling vs BEC; worm vs virus; trojan vs rootkit; logic bomb vs backdoor; spyware vs bloatware; XSS vs CSRF (forgery); SQL injection vs command injection; buffer overflow vs race condition; DoS vs DDoS; amplified vs reflected DDoS; on-path vs replay; brute force vs password spraying; downgrade vs collision; false positive vs false negative; CVE vs CVSS; risk vs vulnerability vs threat (do as threat vs vulnerability, and risk vs threat); qualitative vs quantitative risk; risk appetite vs risk tolerance; transfer vs avoid; accept vs mitigate; exemption vs exception; SLA vs MOU; MSA vs SOW; NDA vs BPA; policy vs standard; standard vs procedure; guideline vs policy; data owner vs data custodian; controller vs processor; tabletop vs simulation; internal vs external audit; attestation vs assessment; known vs unknown environment pen test; passive vs active reconnaissance; preventive vs deterrent; detective vs corrective; compensating vs directive; managerial vs operational control; zero trust control plane vs data plane; fail-open vs fail-closed; inline vs tap; agent vs agentless; SIEM vs SOAR; EDR vs XDR; DLP vs FIM; SPF vs DKIM; DKIM vs DMARC; NAC vs 802.1X; VPN split vs full tunnel; IPSec AH vs ESP; TLS vs IPSec; SD-WAN vs SASE; containerization vs virtualization; IaC vs serverless; microservices vs monolith; air gap vs logical segmentation; jump server vs bastion? (skip if unsure) ; legal hold vs chain of custody; e-discovery vs forensics; containment vs eradication; recovery vs lessons learned; threat hunting vs vulnerability scanning; sanitization vs destruction; provisioning vs de-provisioning; identity proofing vs attestation; JIT access vs password vaulting; input validation vs code signing; static vs dynamic analysis; sandboxing vs isolation; secure cookie vs session token. (That is more than 45; choose the 45 most exam-relevant, keep every fact correct.)

## 3. `data/lab.js` — PBQ Lab static items (24 items)

```js
const LAB_PBQS=[
{id:"m-ctrl",type:"match",title:"Match the control to its TYPE",prompt:"Tap an item on the left, then its match on the right. Tap a matched item to undo.",pairs:[["Left","Right"],…6–8 pairs]},
{id:"o-ir",type:"order",title:"Order the incident response process",prompt:"Tap the steps in order. Undo removes the last tap.",steps:["…",…4–7 steps]},
{id:"s-siem",type:"scenario",title:"Exhibit: …",setup:"Situation in 1–2 sentences.",out:"monospace exhibit text\nwith \\n line breaks (optional)",q:"Question?",opts:["Correct","Wrong 1","Wrong 2","Wrong 3"],why:"Why correct (2–3 sentences).",no:["Why wrong 1","Why wrong 2","Why wrong 3"]},
…
];
```
Required mix: **8 match** (control category vs type; attack → indicator; attack → mitigation; agreement type → purpose; risk strategy → example; SSO/auth protocol → description; malware → behavior; data state → protection method), **6 order** (IR process; digital forensics acquisition order of volatility; change management flow; risk assessment steps; PKI certificate issuance flow; zero-trust access decision flow), **10 scenario** exhibits (firewall rule table read; SIEM/auth log impossible travel; web log SQL injection attempt; email header with failed SPF/DKIM; nmap scan output — what to fix; vulnerability scan finding with CVSS — prioritize; ransomware note plus symptoms — FIRST step; risk register row — compute ALE; certificate error screenshot description — cause; `ls -l` / permissions or a script with hard-coded credentials — vulnerability). Ids: `m-…`, `o-…`, `s-…`.

Escape double quotes inside strings. No HTML tags. Keep every fact 701-correct.
