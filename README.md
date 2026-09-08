# Sec-Study

Study app for CompTIA Security+ (SY0-701). Same engine as Net-Study; new content. Single-page PWA for GitHub Pages, progress synced through a secret Gist (its own Gist, separate from the Net+ app).

- `index.html` — flashcards with leveling/spaced repetition, PBQ Lab, twins drill, speed rounds (ports, acronyms, risk math), exam-style questions, miss list, reference sheet.
- `data/` — content: `cards-d12/d34/d45.js` (398 cards across 16 categories), `exq.js` (92 exam-style questions), `twins.js` (45 confusable pairs), `lab.js` (25 PBQ Lab items).
- `exam/` — Full exam mode: three original 90-question timed exams (`bank-a/b/c.js`, 5 PBQs + 85 questions each, weighted to the SY0-701 blueprint), scaled 100–900 scoring, confidence marking, domain breakdown against the 80%/70% gate, guess-accuracy report, miss review, drill mode.
- `dev/` — authoring specs and validators: `node dev/check-cards.js all`, `node dev/check-practice.js`, `node dev/check-bank.js a`.

Generated PBQs (hash identification, firewall rule evaluation, risk math) make a fresh problem every attempt.
