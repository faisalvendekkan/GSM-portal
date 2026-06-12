export default function Input({ label, error, className = "", as = "input", ...props }) {
  const Component = as;
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span> : null}
      <Component
        className={`min-h-11 w-full rounded-lg border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-electric-400 focus:ring-2 focus:ring-electric-500/25 ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
