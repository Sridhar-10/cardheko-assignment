"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Car, Recommendation } from "@/src/lib/types";
import { RECS_KEY } from "@/src/lib/session";

type Status = "loading" | "nodata" | "ready";

// The single "key spec" shown on each card: range for EVs, mileage otherwise.
function keySpec(car: Car): string {
  if (car.fuelType === "Electric" && car.rangeKm != null) {
    return `${car.rangeKm} km range`;
  }
  if (car.mileageCity != null && car.mileageHighway != null) {
    return `${car.mileageCity}–${car.mileageHighway} kmpl`;
  }
  return `${car.seats} seats`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(RECS_KEY);
    if (saved == null) {
      setStatus("nodata");
      return;
    }
    try {
      setRecs(JSON.parse(saved) as Recommendation[]);
      setStatus("ready");
    } catch {
      setStatus("nodata");
    }
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your shortlist</h1>
          <p className="mt-1 text-sm text-slate-600">
            {status === "ready" && recs.length > 0
              ? "Four cars that best match your answers."
              : "Recommendations based on your answers."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
        >
          Refine answers
        </button>
      </header>

      {status === "loading" && (
        <p className="text-sm text-slate-500">Loading…</p>
      )}

      {status === "nodata" && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-700">No recommendations yet.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Start the questionnaire
          </button>
        </div>
      )}

      {status === "ready" && recs.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="font-medium text-amber-900">No cars matched your filters.</p>
          <p className="mt-2 text-sm text-amber-800">
            Try widening your budget or switching one preference to “No preference.”
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Adjust answers
          </button>
        </div>
      )}

      {status === "ready" && recs.length > 0 && (
        <ol className="space-y-4">
          {recs.map((rec, i) => {
            const { car } = rec;
            return (
              <li
                key={car.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      #{i + 1}
                    </div>
                    <h2 className="mt-0.5 text-lg font-semibold leading-tight">
                      {car.make} {car.model}{" "}
                      <span className="font-normal text-slate-500">{car.variant}</span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₹{car.priceLakh} lakh</div>
                    <div className="text-xs font-medium text-indigo-600">
                      {rec.score}% match
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge>{keySpec(car)}</Badge>
                  <Badge>{car.bodyType}</Badge>
                  <Badge>{car.fuelType}</Badge>
                  <Badge>{car.seats} seats</Badge>
                  <Badge>{car.safetyRating}★ safety</Badge>
                </div>

                <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Why this fits you: </span>
                  {rec.reason}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
      {children}
    </span>
  );
}
