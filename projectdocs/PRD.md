# Tattva

## 0.  What is Tattva

> A trustworthy Ramayana interpreter that answers only text-grounded questions using Valmiki’s Ramayana, with explicit citations and clear limits.
> 

Not:

- a chatbot
- a devotional app
- a self-help app
- a kids animation app

---

## 1. What the Tattva WILL do

### A. Story & Episode Understanding

**Why:** strongest data fit, highest trust

- Epic overview
- Kanda overview
- Episode summaries (sarga-level)
- Event sequencing
- Cause–effect in story
- Key turning points

➡️ Powered almost entirely by `explanation`

---

### B. Character Understanding

**Why:** users naturally ask “why did X do Y?”

- Character identity & lineage
- Roles in the narrative
- Relationships
- Actions taken
- Duty-driven / loyalty-driven decisions

➡️ `explanation` + light `comments`

---

### C. Dharma & Ethics (TEXTUAL, NOT MODERN)

**Why:** unique differentiation if done carefully

- What is dharma *in the Ramayana*
- Royal dharma, familial dharma
- Duty vs desire
- Consequences of adharma

➡️ `explanation` + cited shlokas

---

### D. Verse Meaning & Clarification (TRUST BUILDER)

**Why:** this is where generic AI fails badly

- Meaning of a specific shloka
- Explanation in plain language
- Where it appears (kanda/sarga/shloka)

➡️ `translation` + `explanation`

---

### E. Interpretation (WITH EXPLICIT LABELS)

**Why:** allows depth without risk

- Ambiguity in text
- Multiple interpretations (from comments)
- Narrative silence (when text doesn’t say)

➡️ `comments` + “Interpretive note” badge

---

### F. Meta / Trust (NON-NEGOTIABLE)

**Why:** this is your moat

- Sources used
- Why an answer is uncertain
- Why a question is refused
- What the app does / doesn’t answer

---

## 2. What the MVP will NOT do (hard no)

These are **explicitly out of MVP**, even if users ask.

- Modern moral judgment (“Was Rama right/wrong by today’s standards”)
- Psychology / diagnosis
- Self-help or life advice
- Leadership lessons
- Historicity / archaeology
- Kids-only experiences (animations, games)
- Fan-fiction / what-if
- Devotional persuasion

👉 MVP response = **polite refusal + explanation**

This is a **feature**, not a limitation.

---

## 3.  User Experience

### User should feel like:

> “I’m talking to a calm, precise scholar — not a chatbot.”
> 

### Core UX components (minimum)

### 1️⃣ Ask a Question

- Single input box
- Placeholder copy:
    
    > “Ask about the Ramayana (story, characters, meaning of verses)”
    > 

---

### 2️⃣ Answer Card (Structured, not chatty)

Every answer has **fixed sections**:

**Answer**

- Plain-language response

**Textual Basis**

- Kanda / Sarga / Shloka reference(s)

**Explanation**

- Derived from your `explanation` field

**Interpretive Note** *(only if applicable)*

- “This is inferred based on…”

This structure prevents hallucination *by design*.

---

### 3️⃣ Refusal Card (equally important)

When refusing:

> “This app doesn’t answer this type of question.”
> 

Then:

- Why (one line)
- What it *can* help with instead

No apologies. Calm and confident.

---

## 4.  Architecture

### Step 1: Question Classification

- Use your 45**-row table**

### A. Story & Episodes (15)

1. Epic overview
2. Kanda overview
3. Sarga overview
4. Story chronology
5. Timeline sequencing
6. Major plot events
7. Minor episodes
8. Cause–effect relationships
9. Narrative turning points
10. Exile episodes
11. Abduction episode
12. Search journey episodes
13. War & battle episodes
14. Return & coronation
15. Post-war events

---

### B. Character Understanding (10)

1. Character identity
2. Character lineage
3. Character role in story
4. Character actions
5. Character relationships
6. Duty-driven decisions
7. Loyalty-driven decisions
8. Sacrificial choices
9. Consequences of actions
10. Character evolution

---

### C. Dharma & Ethics (Textual Only) (8)

1. Definition of dharma
2. Personal dharma
3. Familial dharma
4. Royal dharma
5. Duty vs desire
6. Duty vs emotion
7. Consequences of adharma
8. Moral dilemmas in text

---

### D. Verse Meaning & Language (7)

1. Meaning of a specific shloka
2. Translation clarification
3. Explanation of a verse
4. Context of a verse
5. Meaning of key Sanskrit terms
6. Narrative explanation of verses
7. Clarifying popular confusions

---

### E. Interpretation (Clearly Labeled) (3)

1. Ambiguity in text
2. Multiple interpretations
3. Narrative silence

---

### F. Meta / Trust (2)

1. Source transparency
2. Why a question is refused

### Step 2: Retrieval

- Based on category:
    - shloka
    - sarga
    - kanda
- Pull:
    - `explanation` (always)
    - `translation` (if verse-focused)
    - `comments` (if interpretive)

### Step 3: Answer Assembly

- No free-form generation
- AI *summarizes and connects*
- Must cite source range internally

---

### Retrieval Granularity

| Category Group | Retrieval Unit |
| --- | --- |
| Epic / Kanda overview | Kanda |
| Sarga overview | Sarga |
| Episode / event | Sarga (range) |
| Verse meaning | Shloka |
| Dharma / ethics | Multiple shlokas (explicit) |
| Interpretation | Shloka + comments |

---

## 6. What makes this MVP strong (founder lens)

Most Ramayana/AI apps fail because they:

- answer everything
- invent philosophy
- mix devotion with fact
- collapse versions
- hallucinate confidently

Your MVP wins because:

- it knows what it **cannot** answer
- it explains *why*
- it stays close to the text
- it builds long-term trust

This is **rare**.

---

## 7. Question Categories

### A. Story & Episode (15)

1. Epic overview
2. Kanda overview
3. Sarga overview
4. Story chronology
5. Timeline sequencing
6. Major plot events
7. Minor episodes
8. Cause–effect relationships
9. Narrative turning points
10. Exile episodes
11. Abduction episode
12. Search journey episodes
13. War & battle episodes
14. Return & coronation
15. Post-war events

---

### B. Character Understanding (10)

1. Character identity
2. Character lineage
3. Character role in story
4. Character actions
5. Character relationships
6. Duty-driven decisions
7. Loyalty-driven decisions
8. Sacrificial choices
9. Consequences of actions
10. Character evolution

---

### C. Dharma & Ethics (Textual only) (8)

1. Definition of dharma
2. Personal dharma
3. Familial dharma
4. Royal dharma
5. Duty vs desire
6. Duty vs emotion
7. Consequences of adharma
8. Moral dilemmas in text

---

### D. Verse Meaning & Language (7)

1. Meaning of a specific shloka
2. Translation clarification
3. Explanation of a verse
4. Context of a verse
5. Meaning of key Sanskrit terms
6. Narrative explanation of verses
7. Clarifying popular confusions

---

### E. Interpretation (Clearly labeled) (3)

1. Ambiguity in text
2. Multiple interpretations (from comments)
3. Narrative silence

---

### F. Meta / Trust (2)

1. Source transparency
2. Why a question is refused

## 8.  Answer Template

This table is:

- deterministic
- product-safe (no ambiguity)
- future-proof (we might add new templates later, but for now the list is locked)

---

# **Answer Template Lock Table**

**Rule:**

Every response MUST use the template assigned here.

No category is allowed to “choose” a template dynamically.

---

## TEMPLATE TYPES (LOCKED)

### **T1 — Textual Answer Template**

Used when the text is explicit and explanatory.

**Structure**

- Answer
- Textual Basis (Kanda / Sarga / Shloka)
- Explanation

---

### **T2 — Interpretive Answer Template**

Used when inference or commentary is involved.

**Structure**

- Answer
- What the Text States
- Traditional Interpretations
- Limit of Certainty

---

### **T3 — Refusal Template**

Used when question is out of scope.

**Structure**

- Out-of-scope notice
- Why
- What I can help with instead

---

## 🚦 TEMPLATE MAPPING TABLE (45 MVP CATEGORIES)

| # | MVP Category | Locked Template |
| --- | --- | --- |
| 1 | Epic overview | T1 — Textual |
| 2 | Kanda overview | T1 — Textual |
| 3 | Sarga overview | T1 — Textual |
| 4 | Story chronology | T1 — Textual |
| 5 | Timeline sequencing | T1 — Textual |
| 6 | Major plot events | T1 — Textual |
| 7 | Minor episodes | T1 — Textual |
| 8 | Cause–effect relationships | T1 — Textual |
| 9 | Narrative turning points | T1 — Textual |
| 10 | Exile episodes | T1 — Textual |
| 11 | Abduction episode | T1 — Textual |
| 12 | Search journey episodes | T1 — Textual |
| 13 | War & battle episodes | T1 — Textual |
| 14 | Return & coronation | T1 — Textual |
| 15 | Post-war events | T1 — Textual |
| 16 | Character identity | T1 — Textual |
| 17 | Character lineage | T1 — Textual |
| 18 | Character role in story | T1 — Textual |
| 19 | Character actions | T1 — Textual |
| 20 | Character relationships | T1 — Textual |
| 21 | Duty-driven decisions | T1 — Textual |
| 22 | Loyalty-driven decisions | T1 — Textual |
| 23 | Sacrificial choices | T1 — Textual |
| 24 | Consequences of actions | T1 — Textual |
| 25 | Character evolution | T2 — Interpretive |
| 26 | Definition of dharma | T1 — Textual |
| 27 | Personal dharma | T1 — Textual |
| 28 | Familial dharma | T1 — Textual |
| 29 | Royal dharma | T1 — Textual |
| 30 | Duty vs desire | T2 — Interpretive |
| 31 | Duty vs emotion | T2 — Interpretive |
| 32 | Consequences of adharma | T1 — Textual |
| 33 | Moral dilemmas in text | T2 — Interpretive |
| 34 | Meaning of a specific shloka | T1 — Textual |
| 35 | Translation clarification | T1 — Textual |
| 36 | Explanation of a verse | T1 — Textual |
| 37 | Context of a verse | T1 — Textual |
| 38 | Meaning of key Sanskrit terms | T1 — Textual |
| 39 | Narrative explanation of verses | T1 — Textual |
| 40 | Clarifying popular confusions | T1 — Textual |
| 41 | Ambiguity in text | T2 — Interpretive |
| 42 | Multiple interpretations | T2 — Interpretive |
| 43 | Narrative silence | T2 — Interpretive |
| 44 | Source transparency | T1 — Textual |
| 45 | Why a question is refused | T3 — Refusal |

---

## 🔒 HARD CONSTRAINTS (ENGINE-LEVEL)

These rules must be enforced **before generation**:

1. **T1 may not contain speculation**
2. **T2 must include “Limit of Certainty”**
3. **T3 must never apologize**
4. **No category may switch templates**
5. **Comments field is NEVER used in T1**
6. **Every answer must cite kanda/sarga when applicable**

---

## 9. Golden Questions & Guidelines Set

---

> Global rule (applies to ALL 45 categories):
> 
> 
> If an answer cannot be grounded in `explanation`, `translation`, or explicitly-labeled `comments`, the system must **downgrade confidence or refuse**.
> 

---

## A. Story & Episode Understanding (Categories 1–15)

### ✅ Rules

- Use **only narrative facts** present in `explanation`
- Sequence events strictly by kanda → sarga order
- Summarize; do not dramatize
- Use neutral, descriptive tone
- Cite kanda/sarga wherever possible

### ❌ Do-Nots

- Do NOT embellish or add missing scenes
- Do NOT compress multiple versions into one
- Do NOT attribute motives unless shown
- Do NOT introduce symbolism here
- Do NOT moralize events

---

## B. Character Understanding (Categories 16–25)

### ✅ Rules

- Describe **what the character does**, not what they “are like” unless explicit
- Lineage, roles, and relationships must be factual
- Motivations must be labeled:
    - “The text shows…”
    - “The text implies…”
- Evolution must be grounded in actions across time

### ❌ Do-Nots

- Do NOT psychoanalyze characters
- Do NOT apply modern personality traits
- Do NOT judge characters as good/bad
- Do NOT speculate inner feelings without text
- Do NOT generalize from one event

---

## C. Dharma & Ethics (Textual Only) (Categories 26–33)

### ✅ Rules

- Define dharma **only as used in the Ramayana**
- Always tie ethics to:
    - a situation
    - a choice
    - a consequence
- Use examples, not abstractions
- Frame dilemmas as presented, not resolved by you

### ❌ Do-Nots

- Do NOT apply modern moral frameworks
- Do NOT say “right” or “wrong” in absolute terms
- Do NOT give life advice
- Do NOT universalize lessons
- Do NOT turn dharma into self-help

---

## D. Verse Meaning & Language (Categories 34–40)

### ✅ Rules

- Treat the verse as the **primary authority**
- Use:
    - `translation` for meaning
    - `explanation` for clarity
- Keep Sanskrit quotations short
- Always provide context (who/when/why)

### ❌ Do-Nots

- Do NOT invent meanings
- Do NOT over-interpret individual words
- Do NOT detach verses from context
- Do NOT merge verses unless explicitly asked
- Do NOT claim philosophical intent from a single shloka

---

## E. Interpretation (Clearly Labeled) (Categories 41–43)

### ✅ Rules

- Explicitly separate:
    - “What the text states”
    - “How it is interpreted”
- Use `comments` carefully and label them
- Acknowledge ambiguity openly
- End with limits of certainty

### ❌ Do-Nots

- Do NOT resolve ambiguity forcefully
- Do NOT pick sides between interpretations
- Do NOT invent commentary
- Do NOT imply divine intent where unstated
- Do NOT sound conclusive

---

## F. Meta / Trust (Categories 44–45)

### ✅ Rules

- Be transparent and calm
- Explain refusals as **scope limits**, not policy excuses
- Redirect user to allowed question types
- Maintain consistent language across refusals

### ❌ Do-Nots

- Do NOT apologize excessively
- Do NOT blame the user
- Do NOT cite “AI policy” vaguely
- Do NOT sound defensive
- Do NOT provide partial answers after refusing

---

# 🔒 CATEGORY-SPECIFIC HARD CONSTRAINTS (ENGINE-LEVEL)

These must be enforced **before generation**:

| Category Type | Mandatory Enforcement |
| --- | --- |
| Story / Episode | No speculation flag |
| Character | Motivation label required |
| Dharma | Example citation required |
| Verse meaning | Context block required |
| Interpretation | “Limit of certainty” required |
| Refusal | Redirect suggestions required |

---

## 🧠 Why this matters (founder lens)

Most AI failures come from:

- **tone drift**
- **category leakage**
- **unlabeled inference**

You’ve now:

- eliminated silent inference
- made uncertainty explicit
- encoded scholarly restraint

This is how you build **credible AI**, not flashy AI.

---

## 10. Public “About & Limits” Page

## 4️⃣ PUBLIC “ABOUT & LIMITS” PAGE (Draft)

You should ship this **with the MVP**.

> What this app does
> 
> 
> This app explains the Ramayana strictly based on Valmiki’s text, using verse translations, explanations, and traditional commentary.
> 

> What this app does not do
> 
> 
> It does not apply modern psychology, politics, self-help frameworks, or moral judgments to the epic.
> 

> Why this matters
> 
> 
> Ancient texts deserve careful interpretation. When the text is silent or ambiguous, we say so clearly instead of guessing.
> 

> Our principle
> 
> 
> If the text does not support an answer, the app will not invent one.
> 

## 11. Final PRD Lock Statement (Recommended)

> PRD LOCK — v1
> 
> 
> This PRD defines the complete and final scope of the MVP.
> 
> Any new feature, category, or behavior must be evaluated against:
> 
> 1. Textual grounding in Valmiki Ramayana
> 2. The 45-category MVP cut
> 3. The locked answer templates (T1 / T2 / T3)
> 
> If a change violates these constraints, it is out of scope for v1.
> 

This prevents scope creep and “one small exception” syndrome.

## 11. Non-Goals Section

> Non-Goals (v1)
> 
> - Coverage of non-Valmiki Ramayana
> - Moral evaluation frameworks
> - Personal advice or prescriptions
> - Multimedia / kids experiences

## 12. Rules & Do-Nots (Global)

### Must Do

- Cite kanda/sarga/shloka when applicable
- Label inference and interpretation clearly
- Prefer explanation over translation for narrative
- Be neutral, calm, and non-preachy

**Answer Confidence States (Internal)**

- Explicit
- Inferred
- Interpretive

Every answer must be tagged internally with one of these states.

### Must Not Do

- No speculation
- No modern frameworks
- No psychoanalysis
- No moral verdicts
- No invented details

## 13. Evaluation & Quality Gates (v1)

### Purpose

The purpose of evaluations in this MVP is **not to measure model intelligence**, but to **enforce product behavior** as defined by this PRD.

Evaluations act as **quality gates** to ensure:

- trustworthiness
- scope discipline
- absence of hallucination
- consistency with textual grounding

---

### Evaluation Philosophy

> For Trusted Ramayana AI, correctness is defined by behavior, not by fluency or creativity.
> 

An answer is considered correct **only if** it:

- follows the correct category routing
- applies the correct answerability decision
- adheres to the locked response template
- remains grounded in the canonical data

---

### Evaluation Types (v1)

The MVP will implement the following four evaluation types:

### 1. Category Routing Evaluation

**Goal:**

Verify that user questions are classified into the correct MVP category.

**Pass Criteria:**

- ≥ 95% correct routing on the Golden Questions set
- 0 misclassifications into broader or less-restrictive categories

---

### 2. Answerability Decision Evaluation

**Goal:**

Verify that the system correctly chooses between:

- Answer
- Answer with Constraints
- Refusal

**Pass Criteria:**

- 100% correctness on refusal cases
- ≥ 95% correctness on constrained vs direct answers

---

### 3. Template Compliance Evaluation

**Goal:**

Ensure strict adherence to locked response templates.

**Checks:**

- T1 answers contain no interpretation language
- T2 answers always include a “Limit of Certainty” section
- T3 refusals do not include apologies or partial answers

**Pass Criteria:**

- 0 missing mandatory template sections
- 0 template mixing

---

### 4. Grounding & Citation Evaluation

**Goal:**

Ensure all factual claims are grounded in the Ramayana data.

**Checks:**

- Presence of kanda / sarga / shloka references when required
- No fabricated verses or references
- Commentary-based interpretations are clearly labeled

**Pass Criteria:**

- ≥ 95% of answers include valid textual grounding
- 0 fabricated citations

---

### Evaluation Dataset

The **Golden Questions Set** (defined in this PRD) serves as the primary evaluation dataset.

This dataset:

- covers all 45 MVP categories
- includes normal, ambiguous, and refusal-triggering questions
- functions as acceptance criteria for MVP launch

---

### Operational Use

Evaluations must be run:

- before MVP launch
- after any prompt or routing changes
- after any data updates

Failure to meet pass criteria blocks release.

---

### Explicit Non-Goals (v1)

The following are **not evaluation goals** for this MVP:

- language fluency scoring
- creativity or stylistic quality
- user satisfaction prediction
- open-ended “helpfulness” ratings
- generic LLM benchmark scores

---

> Principle:
> 
> 
> If an answer passes all quality gates, it is considered acceptable — even if it refuses to answer.
> 

---

**Golden Questions → Expected Behavior Eval Sheet**

---

> Purpose:
> 
> 
> This sheet defines, for each golden question, **what “correct behavior” means**, independent of answer wording.
> 

---

## Golden Questions Evaluation Sheet (v1)

| # | Golden Question | MVP Category | Expected Answerability | Expected Template | Retrieval Scope | Mandatory Checks |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | What is the Ramayana about? | Epic overview | Answer | T1 | Kanda | Neutral summary, no interpretation |
| 2 | What happens in Bala Kanda? | Kanda overview | Answer | T1 | Kanda | Covers main arc only |
| 3 | What is described in Bala Kanda, Sarga 1? | Sarga overview | Answer | T1 | Sarga | No content outside sarga |
| 4 | Why was Rama exiled? | Cause–effect | Answer | T1 | Sarga range | Cause clearly stated |
| 5 | What role did Kaikeyi’s boons play? | Cause–effect | Answer | T1 | Sarga range | No moral judgment |
| 6 | How was Sita abducted? | Abduction episode | Answer | T1 | Sarga range | Sequence accurate |
| 7 | What happened to Jatayu? | Minor episode | Answer | T1 | Sarga | No dramatization |
| 8 | How did Hanuman find Sita? | Search journey | Answer | T1 | Sarga range | Events only |
| 9 | What were the key events of the war? | War episodes | Answer | T1 | Sarga range | High-level summary |
| 10 | What happens after Ravana is defeated? | Return & coronation | Answer | T1 | Sarga range | No post-text inference |
| 11 | Who is Rama? | Character identity | Answer | T1 | Multi-shloka | No divinity claims beyond text |
| 12 | Who were Rama’s parents? | Character lineage | Answer | T1 | Shloka | Factual only |
| 13 | Why did Bharata refuse the throne? | Duty-driven decision | Answer | T1 | Sarga | Duty framed explicitly |
| 14 | How did Hanuman show loyalty? | Loyalty-driven decision | Answer | T1 | Multi-sarga | Examples cited |
| 15 | How does Rama change during exile? | Character evolution | Answer w/ Constraints | T2 | Multi-sarga | Inference labeled |
| 16 | What does dharma mean in the Ramayana? | Definition of dharma | Answer | T1 | Multi-shloka | Textual framing only |
| 17 | What is royal dharma? | Royal dharma | Answer | T1 | Multi-shloka | Example-based |
| 18 | Where does duty conflict with desire? | Duty vs desire | Answer w/ Constraints | T2 | Multi-sarga | No modern framing |
| 19 | What happens when dharma is violated? | Consequences of adharma | Answer | T1 | Multi-sarga | Cause–effect only |
| 20 | What moral dilemmas does Rama face? | Moral dilemmas | Answer w/ Constraints | T2 | Multi-sarga | No verdicts |
| 21 | What does this shloka mean? | Shloka meaning | Answer | T1 | Shloka | Context included |
| 22 | Explain this verse simply | Verse explanation | Answer | T1 | Shloka | No extrapolation |
| 23 | What is the context of this verse? | Verse context | Answer | T1 | Shloka | Before/after explained |
| 24 | What does “vanavasa” mean here? | Sanskrit term | Answer | T1 | Shloka | Contextual meaning |
| 25 | Is this event actually in Valmiki Ramayana? | Popular confusion | Answer | T1 | Canon check | Clear yes/no |
| 26 | Does the text explicitly say this? | Ambiguity | Answer w/ Constraints | T2 | Shloka | Explicit vs inferred |
| 27 | Are there different interpretations of this event? | Multiple interpretations | Answer w/ Constraints | T2 | Shloka + comments | Views labeled |
| 28 | Why is the text silent here? | Narrative silence | Answer w/ Constraints | T2 | Shloka | Silence acknowledged |
| 29 | Which Ramayana is this based on? | Source transparency | Answer | T1 | Meta | Valmiki only |
| 30 | Why won’t you answer this question? | Refusal | Refuse | T3 | None | Calm, redirect |

> ⚠️ Rule:
> 
> 
> If *any* Mandatory Check fails → **eval fails**, regardless of answer quality.
> 

---

# Manual v0 Evaluation Checklist (Pre-Automation)

> Purpose:
> 
> 
> Used by founders / PM / reviewer **before launch** or after major changes.
> 

This is deliberately **binary (Yes/No)** to prevent subjective drift.

---

## Manual Evaluation Checklist (v0)

### A. Routing & Scope

- [ ]  Question routed to correct MVP category
- [ ]  Category is within the 45-category MVP cut
- [ ]  Out-of-scope questions are refused, not answered

---

### B. Answerability Decision

- [ ]  Correct choice made: Answer / Answer with Constraints / Refusal
- [ ]  No answering when refusal is required
- [ ]  No refusal when an answer is allowed

---

### C. Template Compliance

- [ ]  Correct template used (T1 / T2 / T3)
- [ ]  No missing mandatory sections
- [ ]  No template mixing

---

### D. Grounding & Accuracy

- [ ]  All factual claims trace back to text
- [ ]  No fabricated shloka, sarga, or kanda references
- [ ]  Commentary is clearly labeled as interpretation

---

### E. Inference Discipline

- [ ]  Explicit vs inferred clearly separated
- [ ]  Interpretive answers include “Limit of Certainty”
- [ ]  No silent speculation

---

### F. Tone & Trust

- [ ]  Neutral, calm, non-preachy tone
- [ ]  No modern moral judgment
- [ ]  No psychological or self-help framing

---

### G. Refusal Quality (if applicable)

- [ ]  Refusal is clear and confident
- [ ]  No apology language
- [ ]  Redirects user to allowed question types

---

### Final Gate

- [ ]  Would I trust this answer if I were reading the Ramayana seriously?

If **any box is unchecked → fix required before release**.

---