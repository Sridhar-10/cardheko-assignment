import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAnswers } from "./validate";

const valid = {
  budgetLakh: 12,
  bodyType: "SUV",
  driving: "city",
  fuelType: "Petrol",
  seats: "5",
  priority: "Safety",
};

test("accepts a fully valid payload", () => {
  const r = parseAnswers(valid);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, valid);
});

test("rejects a non-object body", () => {
  for (const bad of [null, 42, "hi", [valid]]) {
    const r = parseAnswers(bad);
    assert.equal(r.ok, false);
  }
});

test("reports every invalid field, not just the first", () => {
  const r = parseAnswers({
    budgetLakh: -1,
    bodyType: "Coupe",
    driving: "offroad",
    fuelType: "Nuclear",
    seats: "2",
    priority: "Looks",
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.deepEqual(
      Object.keys(r.errors).sort(),
      ["bodyType", "budgetLakh", "driving", "fuelType", "priority", "seats"],
    );
  }
});

test("reports missing fields", () => {
  const r = parseAnswers({ budgetLakh: 10 });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.bodyType);
    assert.ok(r.errors.priority);
    assert.ok(!r.errors.budgetLakh); // this one was valid
  }
});

test("budget must be a positive finite number", () => {
  for (const b of [0, -5, "10", NaN, Infinity, undefined]) {
    const r = parseAnswers({ ...valid, budgetLakh: b });
    assert.equal(r.ok, false, `budgetLakh=${String(b)} should fail`);
  }
});

test("accepts 'No preference' where allowed", () => {
  const r = parseAnswers({
    ...valid,
    bodyType: "No preference",
    fuelType: "No preference",
    seats: "No preference",
  });
  assert.equal(r.ok, true);
});
