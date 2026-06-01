// Six-step progress indicator. Per-step segments on desktop, a single fill bar
// on small screens.
export default function ProgressStepper({
  titles,
  current,
}: {
  titles: string[];
  current: number;
}) {
  const pct = ((current + 1) / titles.length) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Step {current + 1} of {titles.length}
        </span>
        <span className="font-medium text-slate-700">{titles[current]}</span>
      </div>

      {/* Desktop: one segment per step */}
      <div className="mt-3 hidden gap-2 sm:flex">
        {titles.map((t, i) => (
          <div key={t} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= current ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
            <div
              className={`mt-1.5 text-xs ${
                i === current
                  ? "font-semibold text-indigo-700"
                  : "text-slate-400"
              }`}
            >
              {t}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: single fill bar */}
      <div className="mt-3 h-1.5 rounded-full bg-slate-200 sm:hidden">
        <div
          className="h-1.5 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
