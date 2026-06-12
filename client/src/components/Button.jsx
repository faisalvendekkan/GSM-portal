export default function Button({ children, icon: Icon, variant = "primary", className = "", type = "button", ...props }) {
  const variants = {
    primary: "bg-gradient-to-r from-electric-500 to-cyan-400 text-white shadow-glow hover:brightness-110",
    secondary: "border border-white/10 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]",
    danger: "border border-red-400/40 bg-red-500/[0.12] text-red-100 hover:bg-red-500/[0.18]",
    ghost: "text-slate-200 hover:bg-white/[0.08]"
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={18} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
