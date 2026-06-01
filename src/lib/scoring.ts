import type {
  Answers,
  Car,
  DrivingPref,
  Priority,
  Recommendation,
} from "./types";

// Pure scoring module — no I/O. Given the buyer's answers and a list of cars,
// it applies the spec's hard filters, scores survivors 0-100, and returns the
// top 4 with a one-line "why this fits you" reason.

// --- Tunables (kept here so the weighting is easy to read and adjust) ---

// Sub-scores are each normalized to 0..1, then combined with these weights.
// They sum to 100, and the buyer's chosen priority is intentionally the
// largest factor.
const WEIGHT_PRIORITY = 60;
const WEIGHT_DRIVING = 25;
const WEIGHT_BUDGET = 15;

// Fixed scales used to normalize raw specs onto 0..1.
const MILEAGE_CAP_KMPL = 30; // mileage at/above this counts as "great" (1.0)
const RANGE_CAP_KM = 500; // EV range at/above this counts as "great" (1.0)
const EV_ECONOMY = 0.9; // fixed high economy score for EVs (spec)
const IDEAL_BUDGET_RATIO = 0.8; // sweet spot: ~80% of budget used

// How "city-friendly" each body type is (smaller = easier in the city).
const CITY_COMPACTNESS: Record<Car["bodyType"], number> = {
  Hatchback: 1.0,
  Sedan: 0.7,
  MUV: 0.5,
  SUV: 0.45,
};

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

// --- Hard filters (eliminate) ---

function passesFilters(car: Car, a: Answers): boolean {
  if (car.priceLakh > a.budgetLakh) return false;
  if (a.bodyType !== "No preference" && car.bodyType !== a.bodyType) return false;
  if (a.fuelType !== "No preference" && car.fuelType !== a.fuelType) return false;
  if (a.seats === "7+" && car.seats < 7) return false;
  return true;
}

// --- Sub-scores (each returns 0..1) ---

const isEV = (car: Car): boolean => car.fuelType === "Electric";

// Mileage/economy as experienced for the buyer's driving style.
function economyScore(car: Car, driving: DrivingPref): number {
  if (isEV(car)) return EV_ECONOMY;
  const city = car.mileageCity ?? 0;
  const highway = car.mileageHighway ?? 0;
  let kmpl: number;
  if (driving === "city") kmpl = city;
  else if (driving === "highway") kmpl = highway;
  else kmpl = (city + highway) / 2;
  return clamp01(kmpl / MILEAGE_CAP_KMPL);
}

// Priority weight: map the chosen priority to its field, normalized to 0..1.
function priorityScore(car: Car, a: Answers): number {
  switch (a.priority) {
    case "Safety":
      return clamp01(car.safetyRating / 5);
    case "Mileage":
      return economyScore(car, a.driving);
    case "Features":
      return clamp01(car.featureScore / 10);
    case "Resale":
      return clamp01(car.resaleScore / 10);
  }
}

// City use favors compact size & city mileage / EV.
function cityFit(car: Car): number {
  const compact = CITY_COMPACTNESS[car.bodyType];
  const economy = isEV(car) ? 1 : clamp01((car.mileageCity ?? 0) / MILEAGE_CAP_KMPL);
  return 0.5 * compact + 0.5 * economy;
}

// Highway use favors higher highway mileage / diesel-hybrid / EV range.
function highwayFit(car: Car): number {
  if (isEV(car)) return clamp01((car.rangeKm ?? 0) / RANGE_CAP_KM);
  let base = clamp01((car.mileageHighway ?? 0) / MILEAGE_CAP_KMPL);
  if (car.fuelType === "Diesel" || car.fuelType === "Hybrid") {
    base = Math.min(1, base + 0.15); // long-legged cruisers
  }
  return base;
}

function drivingFit(car: Car, driving: DrivingPref): number {
  if (driving === "city") return cityFit(car);
  if (driving === "highway") return highwayFit(car);
  return (cityFit(car) + highwayFit(car)) / 2; // mixed
}

// Small bonus for using the budget well: not wildly under, not maxed out.
// Peaks at IDEAL_BUDGET_RATIO and falls off linearly in either direction.
function budgetFit(car: Car, budgetLakh: number): number {
  if (budgetLakh <= 0) return 0;
  const ratio = car.priceLakh / budgetLakh; // <= 1 for survivors
  return clamp01(1 - Math.abs(ratio - IDEAL_BUDGET_RATIO));
}

// --- Reason string ---

// Keywords that tie a highlight back to each priority, so the reason leads with
// the most relevant highlight the car actually has.
const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  Safety: ["safe", "safety", "build", "ncap", "star", "airbag"],
  Mileage: ["mileage", "economy", "fuel", "efficien", "range", "km", "running cost", "kmpl"],
  Features: ["feature", "tech", "touchscreen", "sunroof", "audio", "loaded", "premium", "connect"],
  Resale: ["resale", "value", "reliab", "maintain", "cheap"],
};

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Two phrases say the same thing if one's normalized form contains the other's.
function nearDuplicate(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x.length > 0 && y.length > 0 && (x.includes(y) || y.includes(x));
}

// Pick the highlight that best complements the priority phrase: prefer ones
// whose wording matches the priority, but skip any that just restate `phrase`.
function bestHighlight(car: Car, priority: Priority, phrase: string): string {
  const keywords = PRIORITY_KEYWORDS[priority];
  const matches = car.highlights.filter((h) =>
    keywords.some((k) => h.toLowerCase().includes(k)),
  );
  const others = car.highlights.filter((h) => !matches.includes(h));
  const ranked = [...matches, ...others];
  return (
    ranked.find((h) => !nearDuplicate(h, phrase)) ?? ranked[0] ?? ""
  );
}

// A short phrase describing the car's strength on the buyer's priority.
function priorityPhrase(car: Car, a: Answers): string {
  switch (a.priority) {
    case "Safety":
      return `${car.safetyRating}-star safety`;
    case "Mileage":
      if (isEV(car)) return `${car.rangeKm} km range`;
      if (a.driving === "highway") return `${car.mileageHighway} kmpl highway mileage`;
      if (a.driving === "city") return `${car.mileageCity} kmpl city mileage`;
      return `${car.mileageCity}/${car.mileageHighway} kmpl city/highway mileage`;
    case "Features":
      return `${car.featureScore}/10 features`;
    case "Resale":
      return `${car.resaleScore}/10 resale value`;
  }
}

function buildReason(car: Car, a: Answers): string {
  const phrase = priorityPhrase(car, a);
  const highlight = bestHighlight(car, a.priority, phrase);
  const lead = highlight ? `${phrase} and ${lowerFirst(highlight)}` : phrase;
  return `${lead} — matches your ${a.priority.toLowerCase()} priority within budget.`;
}

// Lowercase the first letter unless the phrase starts with a number/acronym.
function lowerFirst(s: string): string {
  if (!s) return s;
  if (/^[A-Z][a-z]/.test(s)) return s[0].toLowerCase() + s.slice(1);
  return s;
}

// --- Public API ---

const TOP_N = 4;

function scoreCar(car: Car, a: Answers): number {
  const raw =
    WEIGHT_PRIORITY * priorityScore(car, a) +
    WEIGHT_DRIVING * drivingFit(car, a.driving) +
    WEIGHT_BUDGET * budgetFit(car, a.budgetLakh);
  return Math.round(clamp01(raw / 100) * 100);
}

export function recommend(answers: Answers, cars: Car[]): Recommendation[] {
  return cars
    .filter((car) => passesFilters(car, answers))
    .map((car) => ({
      car,
      score: scoreCar(car, answers),
      reason: buildReason(car, answers),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.car.priceLakh - b.car.priceLakh || // cheaper wins ties
        a.car.id.localeCompare(b.car.id), // then stable by id
    )
    .slice(0, TOP_N);
}
