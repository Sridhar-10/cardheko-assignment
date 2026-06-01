# Car Buying Helper

A guided web app that takes a confused car buyer from _"I don't know what to buy"_ to a confident shortlist of four cars — each with a plain-language reason it fits them.

**Live URL:** https://cardheko-assignment.vercel.app/
**Screen recording:** https://drive.google.com/file/d/1WrY8gEUT7nDfsB608Fj_zR3L8qxojdSr/view?usp=sharing

---

## What I built and why

The brief was deliberately vague, so the first decision was _what not to build_. A confused buyer isn't helped by yet another catalog with filters — that assumes they already know what they want. The highest-value thing is a short guided flow that asks what they care about and does the thinking for them.

So I built:

1. A **6-step questionnaire** — budget, body type, driving (city/highway/mixed), fuel, seats, and top priority (safety / mileage / features / resale).
2. A **scoring engine** that hard-filters cars by the buyer's constraints, then scores the survivors on a 0–100 scale weighted heavily toward their stated priority.
3. A **results page** showing the top 4 cars, each with a one-line _"why this fits you"_ reason tied to that priority.

The result is a buyer answering six quick questions and getting a reasoned shortlist — which is the entire brief.

## What I deliberately cut

- **No authentication / accounts** — irrelevant to the core job.
- **No database** — 40 curated cars live in a seeded JSON file; a DB would be setup overhead with zero added value at this scale.
- **No real-time pricing** — dataset prices are illustrative. Live pricing is an integration problem, not a product-thesis problem.
- **No reviews, comparison tables, or pixel-perfect design** — all candidates for "later," none essential to proving the idea works.

I'd rather ship a tight, opinionated MVP that does one thing well than a half-finished kitchen sink.

## Tech stack and why

- **Next.js (App Router) + TypeScript** — frontend and backend in one repo, so "full-stack" is satisfied without running two servers. Types caught mistakes early.
- **API route (`/api/recommend`)** — the non-trivial backend: it validates input and computes a ranked, reasoned result. Real computation, not a static page.
- **Pure scoring module (`lib/`)** — the scoring logic is a side-effect-free function, kept out of the route so it's unit-testable in isolation.
- **Tailwind CSS** — fast, clean styling without hand-writing CSS.
- **Vitest** — quick unit tests for the scoring and validation logic.
- **Vercel** — one-click deploy from GitHub for a live URL.

## Architecture at a glance

```
app/
  page.tsx               # questionnaire (6 steps)
  results/page.tsx       # top-4 results
  api/recommend/route.ts # validates input, calls recommend(), returns ranked cars
lib/
  scoring.ts             # pure scoring engine (filter -> score -> top 4 + reason)
  validateAnswers.ts     # input validation + shared allowed-value lists
data/
  cars.json              # 40 seeded cars
```

The scoring flow: **hard filters** (price, body, fuel, seats) eliminate non-matches → survivors are **scored 0–100** (priority weighted highest, then driving fit, then budget fit) → **sorted, top 4** → a **reason string** is built from the best priority-matching highlight.

## What I delegated to AI vs did manually

I used Claude Code in a **spec-driven, phased** workflow: I wrote the spec first, then had it build in four reviewable phases — data, scoring, API, UI — pausing after each so I could check the output before continuing.

**The AI did:** nearly all the code-writing — scaffolding, the scoring implementation, the API route, the React UI, and the test suites.

**I did:** the product and scoping decisions (guided flow over a filter catalog, what to cut), the spec, the phasing, and reviewing/correcting output at each checkpoint.

**Where the tools helped most:** raw speed on boilerplate and test scaffolding, and turning a clear spec into working code fast. Splitting the validator into its own module (so the UI could reuse the allowed-value lists) was a good suggestion I accepted.

**Where I had to steer / they got in the way:**

- The first version generated a _misleading_ recommendation reason — pairing an unrelated highlight with the buyer's priority (e.g. "long range — matches your safety priority"). I caught it and changed it to neutral wording when nothing matches, because a misleading reason undercuts buyer trust, which is the whole point of the product.
- A pinned Tailwind version broke the build; I had the tool bump it to a matched pair to fix it.
- I had to be explicit about keeping scoring logic out of the API route so it stayed testable.
- A few times the agent wanted to do more than the phase asked — I held it to one phase at a time.

<!-- TODO: tweak the two paragraphs above to match your real experience and voice. Be honest — that's what's being evaluated. -->

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

Run the tests:

```bash
npm test
```

## If I had another 4 hours

- **Natural-language input** — let the buyer type "safe family SUV under 15 lakh, mostly city" and use an LLM call to parse it into the structured answers. This is the most on-brief AI-native addition.
- **Side-by-side compare** for the shortlisted cars.
- **Explain the score** — show _why_ each car ranked where it did, not just the headline reason.
- **A real dataset** with live pricing and more cars.
- **Save/share a shortlist** via a URL.

---

_Built as a take-home for the AI-Native Software Engineer role. Time-boxed to ~2.5 hours._
