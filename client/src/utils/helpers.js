export function tagsToArray(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function getApiMessage(error) {
  const data = error.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    const details = data.errors.map((item) => `${item.field}: ${item.message}`).join(" ");
    return `${data.message || "Please check the form fields."} ${details}`;
  }
  return data?.message || "Something went wrong. Please try again.";
}
