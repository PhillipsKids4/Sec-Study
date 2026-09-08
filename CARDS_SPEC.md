# Flashcard authoring spec — Sec+ Gym Cards (SY0-701)

You are writing ONE file `data/cards-<part>.js` defining a single global array and nothing else:

```js
/* Sec+ Gym Cards — part <part> */
const CARDS_<PART> = [
 {c:"crypto",q:"…",a:"…",x:"…"},
 …
];
```

Validate with `node dev/check-cards.js <part>` from the repo root until it prints PASS.

## Card object

```js
{
  c:"crypto",              // category key from dev/CATS.md (required)
  q:"Symmetric encryption — the one-line definition",   // FRONT of the card: a prompt, term, or question. ≤ 90 chars.
  a:"#One shared key\nSame key encrypts and decrypts — fast, but the key must be distributed securely",
                           // BACK: lines separated by \n. A line starting with # renders BIG (the headline answer). 1–3 lines total.
  s:"One shared key encrypts and decrypts",   // OPTIONAL short form used as the multiple-choice option text. ≤ 60 chars.
                           // If omitted, the # line (or first line) is used. The short MUST be unique within its category
                           // and must read as a plausible multiple-choice option on its own.
  x:"Explanation paragraph…",   // REQUIRED: 2–4 sentences (200–520 chars). Teaches the concept, why it matters on the exam,
                           // how it's distinguished from its neighbors, and the exam keyword that signals it.
  w:"Hook…",               // OPTIONAL memory hook / mnemonic (≤ 120 chars). Use on ~25% of cards where a hook genuinely helps.
  v:"symasym",             // OPTIONAL diagram key shown on the BACK (see dev/CATS.md list).
  vq:"controls",           // OPTIONAL diagram key shown on the FRONT (question is about the picture). Rare.
  g:"ctrltype"             // OPTIONAL distractor group: cards sharing g draw MC distractors only from each other
                           // (use for tight sets like control types, backup types, SLE/ALE terms, cloud models).
}
```

## Rules

1. **Original text.** Use `dev/source/*.txt` for coverage and facts; never copy sentences.
2. **SY0-701 truth.** Every fact must be correct for the current exam. When the 601 course and 701 differ, 701 wins.
3. **Atomic cards.** One fact per card. If a term has two testable facets, make two cards with different `q`.
4. **Distinct shorts.** Within a category, no two cards may share a `short` (the `s`, or the # line, or the first `a` line). The checker enforces it. Shorts are the multiple-choice options, so they must differentiate: "TCP 49, encrypts whole payload" not "an AAA protocol".
5. **Exam-keyword aware.** The `x` should name the phrase the exam uses to signal this answer (e.g., "the word *unauthorized changes* points to integrity").
6. **Card counts per category are in your assignment.** Each category needs ≥ 8 cards so multiple choice has distractors.
7. Escape `"` inside strings as `\"` (or use single quotes in prose). No HTML. Use `\n` for line breaks in `a` only.
8. Ports category format: `q` = protocol name, `a` = `#<port>\n<one-line note>`, `s` = the port number(s) as text (e.g. `"636"`, `"1812/1813"`), so the speed round and reference sheet work. Port shorts must START with a digit.

## Style example (do not copy into the bank)

```js
{c:"controls",q:"Compensating control",a:"#Substitute control\nUsed when the primary control can't be applied — still reduces the risk",s:"Substitute when the primary control isn't feasible",g:"ctrltype",
 x:"A compensating control is an alternative that provides comparable protection when the intended control cannot be implemented, such as network segmentation and enhanced logging around a legacy system that cannot be patched. On the exam, 'cannot patch / legacy / not feasible' plus 'what should be put in place instead' signals compensating. It is a control TYPE; categories (technical, managerial, operational, physical) are a separate axis.",
 w:"Compensate = make up for what you can't do."},
```
