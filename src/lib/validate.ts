import type {
  Answers,
  BodyPref,
  DrivingPref,
  FuelPref,
  Priority,
  SeatsPref,
} from "./types";

// Pure input validation for the questionnaire. Mirrors the allowed values in
// SPEC.md. Collects every bad/missing field rather than failing on the first.

export const BODY_VALUES: BodyPref[] = ["Hatchback", "Sedan", "SUV", "MUV", "No preference"];
export const FUEL_VALUES: FuelPref[] = ["Petrol", "Diesel", "CNG", "Hybrid", "Electric", "No preference"];
export const DRIVING_VALUES: DrivingPref[] = ["city", "highway", "mixed"];
export const SEATS_VALUES: SeatsPref[] = ["5", "7+", "No preference"];
export const PRIORITY_VALUES: Priority[] = ["Safety", "Mileage", "Features", "Resale"];

export type FieldErrors = Record<string, string>;

export type ValidationResult =
  | { ok: true; value: Answers }
  | { ok: false; errors: FieldErrors };

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function parseAnswers(input: unknown): ValidationResult {
  const errors: FieldErrors = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { _root: "Request body must be a JSON object." } };
  }
  const o = input as Record<string, unknown>;

  // budgetLakh: positive, finite number.
  if (typeof o.budgetLakh !== "number" || !Number.isFinite(o.budgetLakh) || o.budgetLakh <= 0) {
    errors.budgetLakh = "Must be a positive number (max price in lakh).";
  }

  if (!isOneOf(o.bodyType, BODY_VALUES)) {
    errors.bodyType = `Must be one of: ${BODY_VALUES.join(", ")}.`;
  }
  if (!isOneOf(o.driving, DRIVING_VALUES)) {
    errors.driving = `Must be one of: ${DRIVING_VALUES.join(", ")}.`;
  }
  if (!isOneOf(o.fuelType, FUEL_VALUES)) {
    errors.fuelType = `Must be one of: ${FUEL_VALUES.join(", ")}.`;
  }
  if (!isOneOf(o.seats, SEATS_VALUES)) {
    errors.seats = `Must be one of: ${SEATS_VALUES.join(", ")}.`;
  }
  if (!isOneOf(o.priority, PRIORITY_VALUES)) {
    errors.priority = `Must be one of: ${PRIORITY_VALUES.join(", ")}.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // All checks passed — safe to assert the shape.
  return {
    ok: true,
    value: {
      budgetLakh: o.budgetLakh as number,
      bodyType: o.bodyType as BodyPref,
      driving: o.driving as DrivingPref,
      fuelType: o.fuelType as FuelPref,
      seats: o.seats as SeatsPref,
      priority: o.priority as Priority,
    },
  };
}
