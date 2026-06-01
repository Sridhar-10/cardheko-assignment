// Data model — mirrors SPEC.md exactly.

export type FuelType = "Petrol" | "Diesel" | "CNG" | "Hybrid" | "Electric";
export type BodyType = "Hatchback" | "Sedan" | "SUV" | "MUV";

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  priceLakh: number; // ex-showroom, INR lakh
  bodyType: BodyType;
  fuelType: FuelType;
  seats: number;
  mileageCity: number | null; // kmpl; null for EVs
  mileageHighway: number | null; // kmpl; null for EVs
  rangeKm: number | null; // EV range; null otherwise
  safetyRating: number; // 0-5 NCAP stars
  featureScore: number; // 1-10 composite
  resaleScore: number; // 1-10 composite
  highlights: string[]; // phrases used to build the "why this fits you" reason
}

// --- Questionnaire (buyer input) ---

export type BodyPref = BodyType | "No preference";
export type FuelPref = FuelType | "No preference";
export type DrivingPref = "city" | "highway" | "mixed";
export type SeatsPref = "5" | "7+" | "No preference";
export type Priority = "Safety" | "Mileage" | "Features" | "Resale";

export interface Answers {
  budgetLakh: number; // max price the buyer will pay, in INR lakh
  bodyType: BodyPref;
  driving: DrivingPref;
  fuelType: FuelPref;
  seats: SeatsPref;
  priority: Priority;
}

// --- Scoring output ---

export interface Recommendation {
  car: Car;
  score: number; // 0-100, rounded
  reason: string; // one-line "why this fits you"
}
