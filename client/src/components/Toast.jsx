export default function Toast({ toast, onClose }) {
  if (!toast?.message) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  return (
    <div className={`fixed right-4 top-20 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-2xl ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <p>{toast.message}</p>
        <button className="text-current opacity-80 hover:opacity-100" onClick={onClose} aria-label="Close notification">
          x
        </button>
      </div>
    </div>
  );
}
