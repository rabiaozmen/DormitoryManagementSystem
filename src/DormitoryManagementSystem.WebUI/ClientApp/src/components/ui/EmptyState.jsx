export function EmptyState({ title, description, className = "", compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-10 text-center ${className}`}
    >
      <div className="relative mb-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-100" />
        <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-indigo-100" />
        <div className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-amber-100" />
      </div>
      <h3 className={`font-semibold text-slate-800 ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
      <p className={`mt-1 text-slate-500 ${compact ? "text-sm" : "text-sm"}`}>{description}</p>
    </div>
  );
}
