import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import Loader from "../components/Loader.jsx";
import { formatDate, getApiMessage, tagsToArray } from "../utils/helpers.js";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadArticles(value = search) {
    setLoading(true);
    try {
      const { data } = await api.get("/articles", { params: { search: value } });
      setArticles(data.articles);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles("");
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-electric-400">Repair knowledge</p>
        <h2 className="text-2xl font-bold">Articles</h2>
      </div>
      <Card>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            loadArticles(search);
          }}
        >
          <Input placeholder="Search articles" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" icon={Search} aria-label="Search articles" />
        </form>
      </Card>
      {error ? <Card>{error}</Card> : null}
      {loading ? <Loader label="Loading articles" /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Link key={article.id} to={`/articles/${article.slug}`}>
            <Card className="h-full overflow-hidden p-0 transition hover:border-electric-400/60">
              {article.image_url ? (
                <img src={article.image_url} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="h-44 bg-gradient-to-br from-electric-500/30 to-emerald-400/20" />
              )}
              <div className="p-5">
                <p className="text-sm text-slate-400">{article.category_name || "Repair article"}</p>
                <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{article.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tagsToArray(article.tags).map((tag) => (
                    <span key={tag} className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">{formatDate(article.updated_at)}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {!loading && !articles.length ? <Card>No articles found.</Card> : null}
    </div>
  );
}
