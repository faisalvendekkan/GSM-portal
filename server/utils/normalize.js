function normalizeEmail(value, fallback = "") {
  const raw = String(value || fallback || "").trim().toLowerCase();
  const match = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return (match?.[0] || raw).trim().toLowerCase();
}

module.exports = {
  normalizeEmail
};
