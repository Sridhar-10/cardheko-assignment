# Car Buying Helper

Helps a confused car buyer go from *"I don't know what to buy"* to a confident
shortlist of **four cars**, each with a clear reason it fits them. Answer six
short questions, get ranked, reasoned recommendations.

Built to [SPEC.md](SPEC.md).

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** for styling
- **API Route** (`POST /api/recommend`) for the scoring backend
- Seeded **`data/cars.json`** (40 cars) as the only data source — no database
- Deploy target: **Vercel**

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

> If `npm install` fails with an `EACCES` cache error, your global npm cache has
> root-owned files. Either fix it once with `sudo chown -R $(id -u):$(id -g) ~/.npm`,
> or install with a local cache: `npm install --cache /tmp/npm-cache`.

Other scripts:

```bash
npm run build        # production build
npm test             # unit tests (scoring + validation)
```

## How it works

1. **Questionnaire** (`/`) — a six-step stepper: budget (slider), body type,
   driving, fuel, seats, priority. Option values are generated from the API
   validator's exported allowed-value lists, so the UI can't drift from what the
   backend accepts.
2. **API** (`POST /api/recommend`) — validates the answers against the allowed
   values (returns `400` with per-field errors on bad/missing input) and
   delegates ranking. Returns `200 { recommendations: [...] }`, or an empty array
   when nothing passes the filters.
3. **Scoring** (`src/lib/scoring.ts`) — a pure, testable module:
   - **Hard filters:** price ≤ budget, body match, fuel match, `seats ≥ 7` when "7+".
   - **0–100 weighted score:** the buyer's chosen **priority is the largest factor**
     (60), plus **driving fit** (25) and a **budget-fit bonus** (15) that peaks at
     ~80% of budget.
   - Sort descending, take the **top 4**, and build a one-line *"why this fits you"*
     reason from the priority and the best-matching highlight.
4. **Results** (`/results`) — top-4 cards with make + model + variant, price, a key
   spec, and the reason. Friendly empty-state when nothing matches.

## Project structure

```
app/
  page.tsx                 # questionnaire (6-step stepper)
  results/page.tsx         # top-4 result cards
  api/recommend/route.ts   # POST /api/recommend — validates + delegates
src/
  lib/
    types.ts               # Car + questionnaire/answer types
    cars.ts                # loads & types data/cars.json
    scoring.ts             # pure scoring logic (+ scoring.test.ts)
    validate.ts            # pure input validation (+ validate.test.ts)
    session.ts             # sessionStorage keys shared by the two pages
  components/
    ProgressStepper.tsx    # step progress indicator
    OptionGroup.tsx        # single-select option buttons
data/cars.json             # seeded dataset (40 cars)
```

## Deliberate cuts

Following the spec's non-goals, and to keep the build focused:

- No authentication / accounts and no database — the seeded JSON is the source of truth.
- Prices are **illustrative**, not live or accurate.
- No reviews, image-heavy UI, or pixel-perfect design.
- No comparison / spec-sheet deep dives.
- State is passed between pages via `sessionStorage` rather than a global store —
  simplest thing that works for a two-page flow.

## AI usage

Built with **Claude Code** (Anthropic). The work was done in reviewable phases —
scaffold, scoring module, API route, then UI — pausing for review between each.
AI handled scaffolding, the scoring/validation logic and their unit tests, the
API route, and the React/Tailwind UI. A couple of decisions worth noting that
came out of that process: bumping Next.js off the originally pinned version after
npm flagged a CVE, and fixing a redundant reason string (e.g. *"5-star safety and
5-star safety rating"*) by skipping highlights that merely restate the priority.
All scoring rules, filters, and allowed values follow [SPEC.md](SPEC.md); the
dataset was used as-is.

## Next steps

- Persist or share results via a URL (encode answers in the query string) instead
  of `sessionStorage`, so a shortlist is linkable.
- Add the comparison / spec-sheet view that was cut.
- Real pricing and inventory from a live source.
- Tune scoring weights against real buyer feedback; expose "why not" for filtered-out cars.
- More dataset coverage (more makes, variants, and body types).
