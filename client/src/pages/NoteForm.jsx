import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { getApiMessage, tagsToArray } from "../utils/helpers.js";

export default function NoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: "", categoryId: "", description: "", tags: "" });
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setCategories(data.categories));
    if (id) {
      api
        .get(`/notes/${id}`)
        .then(({ data }) =>
          setForm({
            title: data.note.title,
            categoryId: data.note.category_id || "",
            description: data.note.description,
            tags: tagsToArray(data.note.tags).join(", ")
          })
        )
        .catch((err) => setError(getApiMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (id) await api.put(`/notes/${id}`, form);
      else await api.post("/notes", form);
      navigate("/notes");
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader label="Loading note" />;

  return (
    <Card className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold">{id ? "Edit Note" : "Add Note"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} required />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Category</span>
          <select
            value={form.categoryId}
            onChange={(event) => update("categoryId", event.target.value)}
            className="min-h-11 w-full rounded-lg border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-electric-400"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          as="textarea"
          rows={9}
          label="Description"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          required
        />
        <Input label="Tags" placeholder="charging, usb, vbus" value={form.tags} onChange={(event) => update("tags", event.target.value)} />
        {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
        <Button type="submit" icon={Save} disabled={submitting}>
          {submitting ? "Saving..." : "Save Note"}
        </Button>
      </form>
    </Card>
  );
}
