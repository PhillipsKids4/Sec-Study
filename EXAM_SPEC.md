# Exam bank authoring spec — CompTIA Security+ SY0-701

You are writing ONE exam bank file: `exam/bank-<X>.js` (X = a, b, or c). It must be
a plain JS file that defines a single global constant and nothing else:

```js
/* Exam <X> — Sec+ SY0-701 — 85 original questions */
const EXAM_BANK_<X_UPPER> = [
  { ... }, { ... }, ...
];
```

No imports, no exports, no trailing code. It is loaded with a plain `<script src>`.
Run `node -e "require('vm').runInNewContext(require('fs').readFileSync('exam/bank-<x>.js','utf8')+';JSON.stringify(EXAM_BANK_<X>)')"` (or the check script `node dev/check-bank.js <x>`) — it must parse and pass the checks.

## Absolute rules

1. **Original content only.** Do not copy or closely paraphrase Dion Training, Messer, CompTIA sample questions, or any published practice exam. Write fresh scenarios. Also do NOT reuse any stem in the app's exam-style pool `data/exq.js` (the app's existing pool).
2. **Technically correct.** Every answer must be defensible against the SY0-701 objectives. If unsure about a fact, pick a different question. No trick questions that hinge on vendor quirks.
3. **One clearly best answer** for `mc`. Distractors must be plausible (same category of thing) but wrong for a stated reason. No "all of the above", no joke options.
4. **Exam voice.** CompTIA style: a short scenario, then "Which of the following is the MOST likely cause / BEST solution / FIRST step?" Use MOST, BEST, FIRST, LEAST in caps where applicable. 2–4 sentences max per stem.
5. **Every option gets an explanation** (`x`). For the right option: why it's right. For each wrong option: specifically why it's wrong *in this scenario* (not just a definition). 1–2 sentences each. These are the "why the distractors were wrong" notes the student studies from — make them teach.
6. Neutral, professional tone. No real company names. Use RFC 5737 / RFC 1918 addresses (192.0.2.x, 198.51.100.x, 203.0.113.x, 10.x, 172.16–31.x, 192.168.x).

## Question object schema

```js
{
  id: "a017",            // exam letter + 3-digit index, 001–085, in order
  d: 3,                  // domain 1–5 (see quotas)
  cat: "svc",            // one card category key (below) — used to link to flashcards
  t: "mc",               // "mc" (single answer) | "ms" (multi-select)
  pick: 2,               // ONLY for "ms": how many to choose (2 or 3). Omit for mc.
  q: "Stem text…",       // the question
  ex: "…",               // OPTIONAL exhibit: CLI output / config / table shown in monospace above the stem. Use \n for lines. ~12 lines max.
  dg: "vlan",            // OPTIONAL diagram key (below) shown above the stem
  o: [                   // 4 options for mc (exactly 4). 5–6 options for ms.
    { t: "Option text", ok: true,  x: "Why this is correct." },
    { t: "Option text", ok: false, x: "Why this is wrong here." },
    ...
  ],
  w: "One or two sentence overall takeaway / rule to remember."
}
```

- Put options in any order; the engine shuffles. For `mc` exactly ONE option has `ok:true`. For `ms` exactly `pick` options have `ok:true`.
- Option text ≤ 110 characters. Stems ≤ 420 characters. `x` ≤ 260 characters. `w` ≤ 260 characters.
- The engine escapes HTML; write plain text. Use straight quotes inside strings carefully (escape `"` as `\"`) — or just use single quotes inside text.

### Card category keys (`cat`)
`controls` · `crypto` · `ports` · `actors` · `social` · `attacks` · `vulns` · `arch` · `netsec` · `data` · `harden` · `iam` · `ops` · `ir` · `gov` · `third` (see dev/CATS.md for what each covers)

### Diagram keys (`dg`) available
`cia`, `symasym`, `sig`, `pki`, `dot1x`, `dmz`, `vpn`, `zerotrust`, `killchain`, `irlife`, `saml`, `backups`, `hash`, `fwrules`, `controls`, `risk`. Use a diagram only when it genuinely helps (≈4–8 per exam).

## Quotas per bank (85 questions total)

| Domain | Name | Count |
|---|---|---|
| 1 | General Security Concepts | 10 |
| 2 | Threats, Vulnerabilities & Mitigations | 19 |
| 3 | Security Architecture | 15 |
| 4 | Security Operations | 24 |
| 5 | Security Program Management & Oversight | 17 |

Formats within the 85: **8 multi-select (`ms`)** spread across domains; **≥10 with an `ex` exhibit** (firewall rule tables, web-server / auth / syslog / SIEM log lines, nmap output, a suspicious email header, a vulnerability-scan finding with a CVSS score, a certificate summary, a shell command line or script snippet, a risk register row with AV/EF/ARO, a policy excerpt, `netstat`/`ps`/`ls -l` output, a DMARC/SPF record, an IOC list); the rest plain `mc`.

Order the questions **shuffled across domains** (not grouped by domain) — the real exam mixes them.

## Topic coverage checklist (cover ALL of these across the bank; several get 2+ questions)

**Domain 1 (General Security Concepts):** control categories (technical, managerial, operational, physical) × control types (preventive, deterrent, detective, corrective, compensating, directive); CIA + non-repudiation; AAA (authenticating people/systems, authorization models, accounting); gap analysis; zero trust (control plane: adaptive identity, threat scope reduction, policy-driven access control, policy administrator, policy engine; data plane: implicit trust zones, subject/system, policy enforcement point); physical security (bollards, access control vestibule, fencing, video surveillance, guards, badges, lighting, sensors: infrared/pressure/microwave/ultrasonic); deception (honeypot, honeynet, honeyfile, honeytoken); change management (approval, ownership, stakeholders, impact analysis, test results, backout plan, maintenance window, SOP; technical implications: allow/deny lists, restricted activities, downtime, service/application restart, legacy apps, dependencies; documentation, version control); cryptography (PKI: public/private key, key escrow; encryption levels: full-disk, partition, file, volume, database, record; transport/communication; asymmetric vs symmetric; key exchange; algorithms; key length; tools: TPM, HSM, KMS, secure enclave; obfuscation: steganography, tokenization, data masking; hashing; salting; digital signatures; key stretching; blockchain/open public ledger; certificates: CA, CRL, OCSP, self-signed, third-party, root of trust, CSR generation, wildcard).

**Domain 2 (Threats, Vulnerabilities, Mitigations):** threat actors (nation-state, unskilled attacker, hacktivist, insider threat, organized crime, shadow IT) and attributes (internal/external, resources, sophistication) and motivations (data exfiltration, espionage, service disruption, blackmail, financial gain, philosophical/political, ethical, revenge, disruption/chaos, war); threat vectors and attack surfaces (message-based: email/SMS/IM; image-based; file-based; voice call; removable device; vulnerable software: client-based vs agentless; unsupported systems; unsecure networks: wireless/wired/Bluetooth; open service ports; default credentials; supply chain: MSP/vendors/suppliers); social engineering (phishing, vishing, smishing, misinformation/disinformation, impersonation, business email compromise, pretexting, watering hole, brand impersonation, typosquatting); vulnerability types (application: memory injection, buffer overflow, race conditions TOC/TOU, malicious update; OS-based; web-based: SQLi, XSS; hardware: firmware, end-of-life, legacy; virtualization: VM escape, resource reuse; cloud-specific; supply chain: service/hardware/software provider; cryptographic; misconfiguration; mobile device: side loading, jailbreaking; zero-day); malicious activity indicators (malware: ransomware, trojan, worm, spyware, bloatware, virus, keylogger, logic bomb, rootkit; physical: brute force, RFID cloning, environmental; network: DDoS amplified/reflected, DNS attacks, wireless, on-path, credential replay, malicious code; application: injection, buffer overflow, replay, privilege escalation, forgery, directory traversal; cryptographic: downgrade, collision, birthday; password: spraying, brute force; indicators: account lockout, concurrent session usage, blocked content, impossible travel, resource consumption, resource inaccessibility, out-of-cycle logging, published/documented, missing logs); mitigation techniques (segmentation, access control ACL/permissions, application allow list, isolation, patching, encryption, monitoring, least privilege, configuration enforcement, decommissioning, hardening: encryption, installation of endpoint protection, host-based firewall, HIPS, disabling ports/protocols, default password changes, removal of unnecessary software).

**Domain 3 (Security Architecture):** architecture models (cloud: responsibility matrix, hybrid, third-party vendors; IaC; serverless; microservices; network infrastructure: physical isolation/air-gapped, logical segmentation, SDN; on-premises; centralized vs decentralized; containerization; virtualization; IoT; ICS/SCADA; RTOS; embedded systems; high availability) and considerations (availability, resilience, cost, responsiveness, scalability, ease of deployment, risk transference, ease of recovery, patch availability, inability to patch, power, compute); secure infrastructure (device placement, security zones, attack surface, connectivity, failure modes fail-open/fail-closed, device attribute active vs passive / inline vs tap-monitor; network appliances: jump server, proxy, IPS/IDS, load balancer, sensors; port security: 802.1X, EAP; firewall types: WAF, UTM, NGFW, layer 4/7; secure communication: VPN, remote access, tunneling TLS/IPSec, SD-WAN, SASE; selection of effective controls); data protection (data types: regulated, trade secret, IP, legal, financial, human/non-human readable; classifications: sensitive, confidential, public, restricted, private, critical; general considerations: data states at rest/in transit/in use, data sovereignty, geolocation; methods: geographic restrictions, encryption, hashing, masking, tokenization, obfuscation, segmentation, permission restrictions); resilience and recovery (high availability: load balancing vs clustering; site considerations: hot/cold/warm/geographic dispersion; platform diversity; multi-cloud; continuity of operations; capacity planning: people/technology/infrastructure; testing: tabletop, failover, simulation, parallel processing; backups: onsite/offsite, frequency, encryption, snapshots, recovery, replication, journaling; power: generators, UPS).

**Domain 4 (Security Operations):** secure baselines (establish, deploy, maintain); hardening targets (mobile devices, workstations, switches, routers, cloud infrastructure, servers, ICS/SCADA, embedded, RTOS, IoT); wireless devices (site surveys, heat maps); mobile solutions (MDM; deployment models BYOD/COPE/CYOD; connection methods cellular/Wi-Fi/Bluetooth); wireless security (WPA3, AAA/RADIUS, cryptographic protocols, authentication protocols); application security (input validation, secure cookies, static code analysis, code signing); sandboxing; monitoring; asset management (acquisition/procurement, assignment/ownership, classification, monitoring/asset tracking: inventory, enumeration; disposal/decommissioning: sanitization, destruction, certification, data retention); vulnerability management (identification: vulnerability scan, application analysis static/dynamic, package monitoring, threat feeds OSINT/proprietary/ISACs/dark web, penetration testing, responsible disclosure/bug bounty, system/process audit; analysis: confirmation false positive/false negative, prioritize, CVSS, CVE, vulnerability classification, exposure factor, environmental variables, industry/organizational impact, risk tolerance; response: patching, insurance, segmentation, compensating controls, exceptions and exemptions; validation: rescanning, audit, verification; reporting); alerting and monitoring (computing resources: systems, applications, infrastructure; activities: log aggregation, alerting, scanning, reporting, archiving, alert response and remediation/validation: quarantine, alert tuning; tools: SCAP, benchmarks, agents/agentless, SIEM, antivirus, DLP, SNMP traps, NetFlow, vulnerability scanners); enterprise security capabilities (firewall: rules, access lists, ports/protocols, screened subnets; IDS/IPS: trends, signatures; web filter: agent-based, centralized proxy, URL scanning, content categorization, block rules, reputation; OS security: Group Policy, SELinux; secure protocols: protocol selection, port selection, transport method; DNS filtering; email security: DMARC, DKIM, SPF, gateway; FIM; DLP; NAC; EDR/XDR; user behavior analytics); IAM (provisioning/de-provisioning; permission assignments; identity proofing; federation; SSO: LDAP, OAuth, SAML; interoperability; attestation; access controls: mandatory, discretionary, role-based, rule-based, attribute-based, time-of-day, least privilege; MFA: biometrics, hard/soft tokens, security keys; factors: something you know/have/are, somewhere you are; password concepts: length, complexity, reuse, expiration, age; password managers; passwordless; privileged access management: just-in-time, password vaulting, ephemeral credentials); automation and orchestration (use cases: user provisioning, resource provisioning, guard rails, security groups, ticket creation, escalation, enabling/disabling services, continuous integration and testing, integrations and APIs; benefits; other considerations: complexity, cost, single point of failure, technical debt, ongoing supportability); incident response (process: preparation, detection, analysis, containment, eradication, recovery, lessons learned; training; testing: tabletop, simulation; root cause analysis; threat hunting; digital forensics: legal hold, chain of custody, acquisition, reporting, preservation, e-discovery); data sources (log data: firewall, application, endpoint, OS-specific, IPS/IDS, network, metadata; other: vulnerability scans, automated reports, dashboards, packet captures).

**Domain 5 (Program Management & Oversight):** governance (guidelines; policies: AUP, information security, business continuity, disaster recovery, incident response, SDLC, change management; standards: password, access control, physical security, encryption; procedures: change management, onboarding/offboarding, playbooks; external considerations: regulatory, legal, industry, local/regional/national/global; monitoring and revision; governance structures: boards, committees, government entities, centralized/decentralized; roles for data: owners, controllers, processors, custodians/stewards); risk management (identification; assessment: ad hoc, recurring, one-time, continuous; analysis: qualitative, quantitative, SLE, ALE, ARO, probability, likelihood, exposure factor, impact; risk register: key risk indicators, risk owners, risk threshold; risk tolerance; risk appetite: expansionary, conservative, neutral; strategies: transfer, accept (exemption, exception), avoid, mitigate; reporting; BIA: RPO, RTO, MTTR, MTBF); third-party risk (vendor assessment: penetration testing, right-to-audit clause, evidence of internal audits, independent assessments, supply chain analysis; vendor selection: due diligence, conflict of interest; agreement types: SLA, MOA, MOU, MSA, WO/SOW, NDA, BPA; vendor monitoring; questionnaires; rules of engagement); compliance (reporting internal/external; consequences: fines, sanctions, reputational damage, loss of license, contractual impacts; monitoring: due diligence/care, attestation and acknowledgement, internal and external, automation; privacy: legal implications local/regional/national/global, data subject, controller vs processor, ownership, data inventory and retention, right to be forgotten); audits and assessments (attestation; internal: compliance, audit committee, self-assessments; external: regulatory, examinations, assessment, independent third-party audit; penetration testing: physical, offensive, defensive, integrated, known/partially known/unknown environment, reconnaissance passive vs active); security awareness (phishing campaigns and recognition, anomalous behavior recognition, user guidance and training: policy/handbooks, situational awareness, insider threat, password management, removable media, social engineering, operational security, hybrid/remote work; reporting and monitoring initial/recurring; development; execution).

## Style examples (do NOT copy these into the bank)

```js
{id:"a001",d:4,cat:"ops",t:"mc",
 q:"A SOC analyst sees the SIEM alert below for a finance user. The user's badge shows they entered the Cincinnati office at 08:02. Which of the following is the MOST likely explanation?",
 ex:"08:05  Successful login  user=jmarsh  src=203.0.113.44 (Cincinnati, US)\n08:19  Successful login  user=jmarsh  src=198.51.100.7 (Lagos, NG)\n08:20  Mailbox rule created: forward all to external address",
 o:[
  {t:"The account is compromised; the second login is impossible travel and the forwarding rule is exfiltration",ok:true,x:"Two logins 14 minutes apart from continents apart is the impossible-travel indicator, and an auto-forward rule to an outside address is a classic BEC persistence step. Disable the account and remove the rule."},
  {t:"The user is connected to the corporate VPN, which changes the geolocation",ok:false,x:"A VPN would make every login appear from the VPN exit, not one from the office and one from Lagos, and it doesn't explain the forwarding rule."},
  {t:"The SIEM's geolocation feed is stale and needs updating",ok:false,x:"A data-quality issue would not also produce a suspicious mailbox rule within a minute of the second login."},
  {t:"The user is traveling and checked mail from a hotel",ok:false,x:"The badge log places the user in the office at 08:02; nobody reaches Lagos by 08:19."}
 ],
 w:"Impossible travel plus a new external forwarding rule = account takeover. Contain first (disable, kill sessions, remove the rule), then investigate."}
```

```js
{id:"a002",d:5,cat:"gov",t:"ms",pick:2,
 q:"An organization calculates that a warehouse fire would destroy $400,000 of inventory, that such a fire happens about once every 20 years, and that a sprinkler system costing $15,000 per year would cut the loss to $50,000. Which TWO of the following are correct?",
 o:[
  {t:"The current ALE is $20,000",ok:true,x:"SLE = $400,000 and ARO = 1/20 = 0.05, so ALE = 400,000 × 0.05 = $20,000."},
  {t:"The sprinkler system is not cost-justified because it costs more than it saves per year",ok:true,x:"With sprinklers, ALE drops to 50,000 × 0.05 = $2,500, a saving of $17,500 per year, which is less than the $15,000... no: 17,500 > 15,000, so it IS justified. (Author: fix this option so it is genuinely wrong or right before shipping.)"},
  {t:"The exposure factor before sprinklers is 20%",ok:false,x:"EF is the fraction of the asset lost; the scenario gives the loss as a dollar SLE, and 20 years is the frequency, not an exposure factor."},
  {t:"The ARO is 20",ok:false,x:"ARO is how many times per year the event is expected: once in 20 years is 0.05, not 20."},
  {t:"The SLE after sprinklers is $2,500",ok:false,x:"$2,500 is the post-control ALE (50,000 × 0.05). The post-control SLE is $50,000."}
 ],
 w:"ALE = SLE × ARO. A control is worth it when (ALE before − ALE after) exceeds its annual cost."}
```
(The second example deliberately contains an authoring mistake in one explanation so you see what NOT to ship: every `ok` flag and every `x` must agree with the math. Check your numbers.)
