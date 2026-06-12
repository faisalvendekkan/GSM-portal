import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { formatDate, getApiMessage, tagsToArray } from "../utils/helpers.js";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotes(value = search) {
    setLoading(true);
    try {
      const { data } = await api.get("/notes", { params: { search: value } });
      setNotes(data.notes);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes("");
  }, []);

  async function deleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    await api.delete(`/notes/${id}`);
    setNotes((current) => current.filter((note) => note.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-electric-400">Repair notebook</p>
          <h2 className="text-2xl font-bold">Notes</h2>
        </div>
        <Link to="/notes/new">
          <Button icon={Plus} className="w-full sm:w-auto">
            Add Note
          </Button>
        </Link>
      </div>
      <Card>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            loadNotes(search);
          }}
        >
          <Input placeholder="Search notes" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" icon={Search} aria-label="Search notes" />
        </form>
      </Card>
      {error ? <Card>{error}</Card> : null}
      {loading ? <Loader label="Loading notes" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {notes.map((note) => (
          <Card key={note.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">{note.category_name || "Uncategorized"}</p>
                <h3 className="mt-1 truncate text-lg font-semibold">{note.title}</h3>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link to={`/notes/${note.id}/edit`}>
                  <Button variant="secondary" icon={Edit3} aria-label="Edit note" />
                </Link>
                <Button variant="danger" icon={Trash2} onClick={() => deleteNote(note.id)} aria-label="Delete note" />
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{note.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tagsToArray(note.tags).map((tag) => (
                <span key={tag} className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">Updated {formatDate(note.updated_at)}</p>
          </Card>
        ))}
      </div>
      {!loading && !notes.length ? <Card>No notes found.</Card> : null}
    </div>
  );
}
