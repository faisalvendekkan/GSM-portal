import { Edit3, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { formatDate, getApiMessage } from "../utils/helpers.js";

export default function Links() {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLinks(value = search) {
    setLoading(true);
    try {
      const { data } = await api.get("/links", { params: { search: value } });
      setLinks(data.links);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks("");
  }, []);

  async function deleteLink(id) {
    if (!window.confirm("Delete this saved link?")) return;
    await api.delete(`/links/${id}`);
    setLinks((current) => current.filter((link) => link.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-electric-400">Repair references</p>
          <h2 className="text-2xl font-bold">Saved Links</h2>
        </div>
        <Link to="/links/new">
          <Button icon={Plus} className="w-full sm:w-auto">
            Add Link
          </Button>
        </Link>
      </div>
      <Card>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            loadLinks(search);
          }}
        >
          <Input placeholder="Search links" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" icon={Search} aria-label="Search links" />
        </form>
      </Card>
      {error ? <Card>{error}</Card> : null}
      {loading ? <Loader label="Loading links" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {links.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">{item.category_name || "Uncategorized"}</p>
                <h3 className="mt-1 truncate text-lg font-semibold">{item.title}</h3>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={item.url} target="_blank" rel="noreferrer">
                  <Button variant="secondary" icon={ExternalLink} aria-label="Open link" />
                </a>
                <Link to={`/links/${item.id}/edit`}>
                  <Button variant="secondary" icon={Edit3} aria-label="Edit link" />
                </Link>
                <Button variant="danger" icon={Trash2} onClick={() => deleteLink(item.id)} aria-label="Delete link" />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{item.description || item.url}</p>
            <p className="mt-4 text-xs text-slate-500">Updated {formatDate(item.updated_at)}</p>
          </Card>
        ))}
      </div>
      {!loading && !links.length ? <Card>No links found.</Card> : null}
    </div>
  );
}
