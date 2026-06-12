import { Bot, FileText, Link as LinkIcon, Newspaper, Search, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getApiMessage } from "../utils/helpers.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(getApiMessage(err)));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      const { data: payload } = await api.get("/dashboard/search", { params: { q: query } });
      setResults(payload);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  if (error) return <Card>{error}</Card>;
  if (!data) return <Loader label="Loading dashboard" />;

  const stats = [
    { label: "Notes", value: data.stats.notes, icon: FileText, tone: "text-cyan-300" },
    { label: "Saved Links", value: data.stats.savedLinks, icon: LinkIcon, tone: "text-emerald-300" },
    { label: "AI Chats", value: data.stats.aiChats, icon: Bot, tone: "text-electric-400" },
    { label: "Articles", value: data.stats.articles, icon: Newspaper, tone: "text-amber-300" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm text-electric-400">Welcome back</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{user?.name}</h2>
        </div>
        <Link to="/ai">
          <Button icon={Bot} className="w-full sm:w-auto">
            AI Repair Assistant
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-bold">{item.value}</p>
              </div>
              <item.icon className={item.tone} size={30} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <Input
          label="Quick search"
          placeholder="Search notes, links, articles, or categories"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {results ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Notes", results.notes, "/notes"],
              ["Links", results.links, "/links"],
              ["Articles", results.articles, "/articles"],
              ["Categories", results.categories, "/dashboard"]
            ].map(([label, items, base]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Search size={15} />
                  {label}
                </div>
                <div className="space-y-2">
                  {items.length ? (
                    items.map((item) => (
                      <Link
                        key={`${label}-${item.id}`}
                        to={label === "Articles" ? `/articles/${item.slug}` : base}
                        className="block truncate text-sm text-slate-300 hover:text-white"
                      >
                        {item.title || item.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No matches</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h3 className="mb-4 font-semibold">Recent Notes</h3>
          <div className="space-y-3">
            {data.recentNotes.map((note) => (
              <Link key={note.id} to={`/notes/${note.id}/edit`} className="block rounded-lg bg-white/5 p-3 hover:bg-white/[0.08]">
                <p className="font-medium">{note.title}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(note.updated_at)}</p>
              </Link>
            ))}
            {!data.recentNotes.length ? <p className="text-sm text-slate-400">No notes yet.</p> : null}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Saved Repair Links</h3>
          <div className="space-y-3">
            {data.recentLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-white/5 p-3 hover:bg-white/[0.08]">
                <p className="font-medium">{link.title}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{link.url}</p>
              </a>
            ))}
            {!data.recentLinks.length ? <p className="text-sm text-slate-400">No links saved.</p> : null}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Latest Articles</h3>
          <div className="space-y-3">
            {data.latestArticles.map((article) => (
              <Link key={article.id} to={`/articles/${article.slug}`} className="block rounded-lg bg-white/5 p-3 hover:bg-white/[0.08]">
                <p className="font-medium">{article.title}</p>
                <p className="mt-1 text-xs text-slate-400">{article.category_name || "Repair article"}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Wrench size={18} />
          Repair Categories
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="font-medium">{category.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{category.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
