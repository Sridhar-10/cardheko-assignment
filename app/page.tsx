"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Answers,
  BodyPref,
  DrivingPref,
  FuelPref,
  Priority,
  SeatsPref,
} from "@/src/lib/types";
import {
  BODY_VALUES,
  DRIVING_VALUES,
  FUEL_VALUES,
  PRIORITY_VALUES,
  SEATS_VALUES,
} from "@/src/lib/validate";
import { ANSWERS_KEY, RECS_KEY } from "@/src/lib/session";
import ProgressStepper from "@/src/components/ProgressStepper";
import OptionGroup from "@/src/components/OptionGroup";

// Display labels for values that aren't self-explanatory. Options themselves
// come from the validator's exported lists so the UI can't drift from the API.
const DRIVING_LABELS: Record<DrivingPref, string> = {
  city: "Mostly city",
  highway: "Mostly highway",
  mixed: "Mixed",
};
const SEATS_LABELS: Record<SeatsPref, string> = {
  "5": "5 seats",
  "7+": "7 or more",
  "No preference": "No preference",
};

function toOptions<T extends string>(
  values: readonly T[],
  labels?: Record<T, string>,
): { value: T; label: string }[] {
  return values.map((v) => ({ value: v, label: labels ? labels[v] : v }));
}

const STEPS = [
  { title: "Budget", question: "What's your maximum budget?", help: "Ex-showroom price, in INR lakh." },
  { title: "Body type", question: "Any body style in mind?", help: "Pick a shape or leave it open." },
  { title: "Driving", question: "Where will you drive most?", help: "Helps us weigh mileage and size." },
  { title: "Fuel", question: "Preferred fuel type?", help: "Pick one or leave it open." },
  { title: "Seats", question: "How many seats do you need?", help: "7+ filters to genuine 7-seaters." },
  { title: "Priority", question: "What matters most to you?", help: "We weight this the heaviest." },
] as const;

const STEP_TITLES = STEPS.map((s) => s.title);

const DEFAULTS: Answers = {
  budgetLakh: 12,
  bodyType: "No preference",
  driving: "mixed",
  fuelType: "No preference",
  seats: "No preference",
  priority: "Safety",
};

const BUDGET_MIN = 5;
const BUDGET_MAX = 30;

export default function Home() {
  const router = useRouter();

  // Prefill from a previous session so "Refine answers" keeps the buyer's input.
  const [answers, setAnswers] = useState<Answers>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(ANSWERS_KEY);
      if (saved) {
        try {
          return { ...DEFAULTS, ...(JSON.parse(saved) as Partial<Answers>) };
        } catch {
          /* fall through to defaults */
        }
      }
    }
    return DEFAULTS;
  });

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === STEPS.length - 1;

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
      sessionStorage.setItem(RECS_KEY, JSON.stringify(data.recommendations));
      router.push("/results");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Car Buying Helper</h1>
        <p className="mt-1 text-sm text-slate-600">
          Answer six quick questions and get a shortlist of four cars that fit you.
        </p>
      </header>

      <ProgressStepper titles={STEP_TITLES} current={step} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{STEPS[step].question}</h2>
        <p className="mt-1 text-sm text-slate-500">{STEPS[step].help}</p>

        <div className="mt-5">
          {step === 0 && (
            <div>
              <div className="mb-4 text-center text-3xl font-bold text-indigo-700">
                ₹{answers.budgetLakh} lakh
              </div>
              <input
                type="range"
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={0.5}
                value={answers.budgetLakh}
                onChange={(e) => set("budgetLakh", Number(e.target.value))}
                className="w-full accent-indigo-600"
                aria-label="Maximum budget in lakh"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>₹{BUDGET_MIN} lakh</span>
                <span>₹{BUDGET_MAX} lakh</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <OptionGroup
              options={toOptions<BodyPref>(BODY_VALUES)}
              value={answers.bodyType}
              onChange={(v) => set("bodyType", v)}
            />
          )}

          {step === 2 && (
            <OptionGroup
              options={toOptions<DrivingPref>(DRIVING_VALUES, DRIVING_LABELS)}
              value={answers.driving}
              onChange={(v) => set("driving", v)}
            />
          )}

          {step === 3 && (
            <OptionGroup
              options={toOptions<FuelPref>(FUEL_VALUES)}
              value={answers.fuelType}
              onChange={(v) => set("fuelType", v)}
            />
          )}

          {step === 4 && (
            <OptionGroup
              options={toOptions<SeatsPref>(SEATS_VALUES, SEATS_LABELS)}
              value={answers.seats}
              onChange={(v) => set("seats", v)}
            />
          )}

          {step === 5 && (
            <OptionGroup
              options={toOptions<Priority>(PRIORITY_VALUES)}
              value={answers.priority}
              onChange={(v) => set("priority", v)}
            />
          )}
        </div>
      </section>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 enabled:hover:bg-slate-100 disabled:opacity-40"
        >
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Finding cars…" : "See my recommendations"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Next
          </button>
        )}
      </div>
    </main>
  );
}
