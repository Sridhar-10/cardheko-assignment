import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend } from "./scoring";
import type { Answers, Car } from "./types";

// --- Fixtures: minimal, hand-built cars so expectations are deterministic ---

function car(overrides: Partial<Car>): Car {
  return {
    id: "x",
    make: "Make",
    model: "Model",
    variant: "V",
    priceLakh: 10,
    bodyType: "Hatchback",
    fuelType: "Petrol",
    seats: 5,
    mileageCity: 18,
    mileageHighway: 22,
    rangeKm: null,
    safetyRating: 3,
    featureScore: 5,
    resaleScore: 5,
    highlights: ["A solid all-rounder"],
    ...overrides,
  };
}

const baseAnswers: Answers = {
  budgetLakh: 15,
  bodyType: "No preference",
  driving: "mixed",
  fuelType: "No preference",
  seats: "No preference",
  priority: "Safety",
};

// --- Hard filters ---

test("filters out cars over budget", () => {
  const cars = [car({ id: "cheap", priceLakh: 10 }), car({ id: "pricey", priceLakh: 20 })];
  const recs = recommend({ ...baseAnswers, budgetLakh: 15 }, cars);
  assert.deepEqual(recs.map((r) => r.car.id), ["cheap"]);
});

test("body type filter eliminates non-matches; 'No preference' keeps all", () => {
  const cars = [car({ id: "hatch", bodyType: "Hatchback" }), car({ id: "suv", bodyType: "SUV" })];
  assert.deepEqual(
    recommend({ ...baseAnswers, bodyType: "SUV" }, cars).map((r) => r.car.id),
    ["suv"],
  );
  assert.equal(recommend({ ...baseAnswers, bodyType: "No preference" }, cars).length, 2);
});

test("fuel type filter eliminates non-matches", () => {
  const cars = [car({ id: "petrol", fuelType: "Petrol" }), car({ id: "ev", fuelType: "Electric", mileageCity: null, mileageHighway: null, rangeKm: 400 })];
  assert.deepEqual(
    recommend({ ...baseAnswers, fuelType: "Electric" }, cars).map((r) => r.car.id),
    ["ev"],
  );
});

test("seats '7+' requires seats >= 7; '5' / 'No preference' do not", () => {
  const cars = [car({ id: "five", seats: 5 }), car({ id: "seven", seats: 7 })];
  assert.deepEqual(
    recommend({ ...baseAnswers, seats: "7+" }, cars).map((r) => r.car.id),
    ["seven"],
  );
  assert.equal(recommend({ ...baseAnswers, seats: "No preference" }, cars).length, 2);
});

// --- Scoring behavior ---

test("returns at most the top 4", () => {
  const cars = Array.from({ length: 10 }, (_, i) => car({ id: `c${i}`, safetyRating: (i % 5) + 1 }));
  assert.equal(recommend(baseAnswers, cars).length, 4);
});

test("scores are bounded 0..100", () => {
  const cars = [
    car({ id: "min", safetyRating: 0, featureScore: 1, resaleScore: 1, mileageCity: 5, mileageHighway: 5, priceLakh: 1, bodyType: "SUV" }),
    car({ id: "max", safetyRating: 5, featureScore: 10, resaleScore: 10, mileageCity: 30, mileageHighway: 30, priceLakh: 12 }),
  ];
  for (const r of recommend({ ...baseAnswers, budgetLakh: 15 }, cars)) {
    assert.ok(r.score >= 0 && r.score <= 100, `score ${r.score} out of range`);
  }
});

test("chosen priority dominates the ranking", () => {
  // The safe car wins under Safety; the feature-rich car wins under Features.
  const safe = car({ id: "safe", safetyRating: 5, featureScore: 2 });
  const featured = car({ id: "featured", safetyRating: 1, featureScore: 10 });
  const cars = [safe, featured];
  assert.equal(recommend({ ...baseAnswers, priority: "Safety" }, cars)[0].car.id, "safe");
  assert.equal(recommend({ ...baseAnswers, priority: "Features" }, cars)[0].car.id, "featured");
});

test("EVs get a fixed high economy score under Mileage priority", () => {
  // A mediocre-mileage EV should still rank well on Mileage thanks to the fixed score.
  const ev = car({ id: "ev", fuelType: "Electric", mileageCity: null, mileageHighway: null, rangeKm: 450, bodyType: "SUV" });
  const thirsty = car({ id: "thirsty", fuelType: "Petrol", mileageCity: 12, mileageHighway: 15 });
  const recs = recommend({ ...baseAnswers, priority: "Mileage", driving: "city" }, [thirsty, ev]);
  assert.equal(recs[0].car.id, "ev");
});

test("city driving favors compact hatchback over a large SUV (same specs)", () => {
  const hatch = car({ id: "hatch", bodyType: "Hatchback" });
  const suv = car({ id: "suv", bodyType: "SUV" });
  const recs = recommend({ ...baseAnswers, driving: "city" }, [suv, hatch]);
  assert.equal(recs[0].car.id, "hatch");
});

test("highway driving rewards higher highway mileage", () => {
  const cruiser = car({ id: "cruiser", mileageHighway: 28 });
  const sipper = car({ id: "sipper", mileageHighway: 16 });
  const recs = recommend({ ...baseAnswers, driving: "highway" }, [sipper, cruiser]);
  assert.equal(recs[0].car.id, "cruiser");
});

test("budget fit prefers a well-priced car over one maxing out the budget (all else equal)", () => {
  // budget 20: one at ~80% (ideal), one at 100% (maxed).
  const wellPriced = car({ id: "well", priceLakh: 16 });
  const maxed = car({ id: "maxed", priceLakh: 20 });
  const recs = recommend({ ...baseAnswers, budgetLakh: 20 }, [maxed, wellPriced]);
  assert.equal(recs[0].car.id, "well");
});

// --- Reason string ---

test("reason combines priority phrase, a matching highlight, and the priority", () => {
  const c = car({ id: "s", safetyRating: 5, highlights: ["Solid build", "Big boot"] });
  const reason = recommend({ ...baseAnswers, priority: "Safety" }, [c])[0].reason;
  assert.match(reason, /5-star safety/);
  assert.match(reason, /solid build/i); // safety-matching highlight chosen
  assert.match(reason, /safety priority within budget\.$/);
});

test("reason skips a highlight that merely restates the priority phrase", () => {
  // "5-star safety rating" restates "5-star safety"; pick the complementary one.
  const c = car({ id: "s", safetyRating: 5, highlights: ["5-star safety rating", "Strong build quality"] });
  const reason = recommend({ ...baseAnswers, priority: "Safety" }, [c])[0].reason;
  assert.match(reason, /5-star safety and strong build quality/i);
  assert.doesNotMatch(reason, /safety and 5-star safety/i);
});

test("reason falls back to the first highlight when none match the priority", () => {
  const c = car({ id: "r", resaleScore: 9, highlights: ["Zippy engine"] });
  const reason = recommend({ ...baseAnswers, priority: "Resale" }, [c])[0].reason;
  assert.match(reason, /9\/10 resale value/);
  assert.match(reason, /zippy engine/i);
});

// --- Edge cases ---

test("returns an empty list when nothing survives the filters", () => {
  const cars = [car({ priceLakh: 50 })];
  assert.deepEqual(recommend({ ...baseAnswers, budgetLakh: 10 }, cars), []);
});
