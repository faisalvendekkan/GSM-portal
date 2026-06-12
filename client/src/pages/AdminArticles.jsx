import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { getApiMessage, tagsToArray } from "../utils/helpers.js";

const emptyForm = {
  title: "",
  slug: "",
  categoryId: "",
  content: "",
  imageUrl: "",
  videoUrl: "",
  tags: ""
};

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [articlesResponse, categoriesResponse] = await Promise.all([
      api.get("/admin/articles"),
      api.get("/admin/categories")
    ]);
    setArticles(articlesResponse.data.articles);
    setCategories(categoriesResponse.data.categories);
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
      if (editingId) await api.put(`/admin/articles/${editingId}`, form);
      else await api.post("/admin/articles", form);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    }
  }

  function edit(article) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      categoryId: article.category_id || "",
      content: article.content,
      imageUrl: article.image_url || "",
      videoUrl: article.video_url || "",
      tags: tagsToArray(article.tags).join(", ")
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!window.confirm("Delete this article?")) return;
    await api.delete(`/admin/articles/${id}`);
    setArticles((current) => current.filter((article) => article.id !== id));
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-5 text-xl font-bold">{editingId ? "Edit Article" : "Add Article"}</h2>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} required />
          <Input label="Slug" value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="auto-generated if blank" />
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
          <Input label="Tags" value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="display, oled, safety" />
          <Input label="Image URL" value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} />
          <Input label="Video URL" value={form.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} />
          <div className="lg:col-span-2">
            <Input as="textarea" rows={8} label="Content" value={form.content} onChange={(event) => update("content", event.target.value)} required />
          </div>
          {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100 lg:col-span-2">{error}</div> : null}
          <div className="flex gap-2 lg:col-span-2">
            <Button type="submit" icon={editingId ? Save : Plus}>
              {editingId ? "Save Article" : "Add Article"}
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
        <h2 className="mb-5 text-xl font-bold">Articles</h2>
        {loading ? <Loader label="Loading articles" /> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-3">Title</th>
                <th>Category</th>
                <th>Slug</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="py-3 font-medium">{article.title}</td>
                  <td>{article.category_name || "-"}</td>
                  <td>{article.slug}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="secondary" icon={Edit3} onClick={() => edit(article)} aria-label="Edit article" />
                      <Button variant="danger" icon={Trash2} onClick={() => remove(article.id)} aria-label="Delete article" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
