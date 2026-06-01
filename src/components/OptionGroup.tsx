// Single-select group of large tappable option buttons.
export default function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              active
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
