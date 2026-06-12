export function StatusBadge({ status }) {
  const tones = {
    active: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    inactive: "border-slate-400/30 bg-slate-500/15 text-slate-200",
    suspended: "border-red-400/30 bg-red-500/15 text-red-100"
  };

  return (
    <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${tones[status] || tones.inactive}`}>
      {status || "inactive"}
    </span>
  );
}

export function RoleBadge({ role }) {
  const tone =
    role === "admin"
      ? "border-electric-400/30 bg-electric-500/15 text-cyan-100"
      : "border-amber-400/30 bg-amber-500/15 text-amber-100";

  return <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${tone}`}>{role}</span>;
}
