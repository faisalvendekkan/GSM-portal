import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { getApiMessage } from "../utils/helpers.js";

const emptyForm = { name: "", slug: "", description: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/categories");
    setCategories(data.categories);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((err) => {
      setError(getApiMessage(err));
      setLoading(false);
    });
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) await api.put(`/admin/categories/${editingId}`, form);
      else await api.post("/admin/categories", form);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    }
  }

  function edit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description || "" });
  }

  async function remove(id) {
    if (!window.confirm("Delete this category? Existing notes and articles will become uncategorized.")) return;
    await api.delete(`/admin/categories/${id}`);
    setCategories((current) => current.filter((category) => category.id !== id));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <h2 className="mb-5 text-xl font-bold">{editingId ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
          <Input label="Slug" value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="auto-generated if blank" />
          <Input as="textarea" rows={4} label="Description" value={form.description} onChange={(event) => update("description", event.target.value)} />
          {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          <div className="flex gap-2">
            <Button type="submit" icon={editingId ? Save : Plus}>
              {editingId ? "Save" : "Add"}
            </Button>
            {editingId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="mb-5 text-xl font-bold">Categories</h2>
        {loading ? <Loader label="Loading categories" /> : null}
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-slate-400">{category.slug}</p>
                <p className="mt-2 text-sm text-slate-300">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" icon={Edit3} onClick={() => edit(category)} aria-label="Edit category" />
                <Button variant="danger" icon={Trash2} onClick={() => remove(category.id)} aria-label="Delete category" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
