# Car Buying Helper — Spec

## Goal
Help a confused car buyer go from "I don't know what to buy" to a confident shortlist of 4 cars, each with a clear reason it fits them.

## Non-goals (deliberately cut)
- No authentication / user accounts
- No database (seeded JSON file only)
- No real-time or accurate live pricing (dataset prices are illustrative)
- No reviews, images-heavy UI, or pixel-perfect design
- No comparison/spec-sheet deep dives (could be a future add)

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS for styling
- API Route for the scoring backend
- Seeded `cars.json` (40 cars) as the data source
- Deploy: Vercel

## Data Model (`Car`)
```ts
type FuelType = "Petrol" | "Diesel" | "CNG" | "Hybrid" | "Electric";
type BodyType = "Hatchback" | "Sedan" | "SUV" | "MUV";

interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  priceLakh: number;        // ex-showroom, INR lakh
  bodyType: BodyType;
  fuelType: FuelType;
  seats: number;
  mileageCity: number | null;    // kmpl; null for EVs
  mileageHighway: number | null; // kmpl; null for EVs
  rangeKm: number | null;        // EV range; null otherwise
  safetyRating: number;          // 0-5 NCAP stars
  featureScore: number;          // 1-10 composite
  resaleScore: number;           // 1-10 composite
  highlights: string[];          // phrases used to build the "why this fits you" reason
}
```

## Questionnaire (buyer input)
- **Budget**: max price in lakh (slider or number)
- **Body type**: Hatchback / Sedan / SUV / MUV / "No preference"
- **Driving**: Mostly city / Mostly highway / Mixed
- **Fuel**: Petrol / Diesel / CNG / Hybrid / Electric / "No preference"
- **Seats**: 5 / 7+ / "No preference"
- **Top priority** (pick one): Safety / Mileage / Features / Resale value

## Scoring Logic
Input: the buyer's answers. Output: top 4 cars, each with a numeric score and a one-line reason.

1. **Hard filters (eliminate):**
   - `priceLakh` <= budget
   - bodyType matches (skip if "No preference")
   - fuelType matches (skip if "No preference")
   - seats: if "7+" require seats >= 7
2. **Score survivors (0–100):**
   - Priority weight (largest factor): map the chosen priority to its field
     - Safety -> safetyRating (out of 5)
     - Mileage -> for city use, mileageCity; for highway, mileageHighway; mixed = average; EVs get a fixed high economy score
     - Features -> featureScore
     - Resale -> resaleScore
   - Driving fit: highway use favors higher highway mileage / diesel-hybrid range; city use favors compact size & city mileage / EV
   - Budget fit: a small bonus for using budget well (not wildly under, not maxed out)
3. **Sort** by score descending, take **top 4**.
4. **Reason string:** combine the buyer's top priority with the best matching `highlight`, e.g. "5-star safety and strong build — matches your safety priority within budget."

## Pages
- `/` — questionnaire (single page, simple controls)
- `/results` — shows top 4 cards: make+model+variant, price, key spec, and the "why this fits you" reason
- Backend: `POST /api/recommend` accepts answers, returns ranked cars

## Definition of Done
- Runs locally with `npm run dev`
- Answer questionnaire -> see 4 ranked, reasoned recommendations
- Deployed live on Vercel
- README explains build, cuts, stack, AI usage, and next steps
