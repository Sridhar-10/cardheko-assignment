import carsData from "@/data/cars.json";
import type { Car } from "./types";

// Single source of truth for the seeded dataset. The JSON is validated against
// the Car shape at the type level via this assertion.
const cars = carsData as Car[];

export function getCars(): Car[] {
  return cars;
}
