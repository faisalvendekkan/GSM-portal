import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Loader from "../components/Loader.jsx";
import { formatDate, getApiMessage, tagsToArray } from "../utils/helpers.js";

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/articles/${slug}`)
      .then(({ data }) => setArticle(data.article))
      .catch((err) => setError(getApiMessage(err)));
  }, [slug]);

  if (error) return <Card>{error}</Card>;
  if (!article) return <Loader label="Loading article" />;

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <Link to="/articles">
        <Button variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </Link>
      <Card className="overflow-hidden p-0">
        {article.image_url ? <img src={article.image_url} alt="" className="max-h-[420px] w-full object-cover" /> : null}
        <div className="p-5 sm:p-8">
          <p className="text-sm text-electric-400">{article.category_name || "Repair article"}</p>
          <h1 className="mt-2 text-3xl font-bold">{article.title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {formatDate(article.updated_at)} {article.author_name ? `by ${article.author_name}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {tagsToArray(article.tags).map((tag) => (
              <span key={tag} className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-slate-300">
                {tag}
              </span>
            ))}
          </div>
          <div className="prose-safe mt-7">
            {article.content.split(/\n+/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {article.video_url ? (
            <a href={article.video_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex">
              <Button icon={ExternalLink}>Open Video</Button>
            </a>
          ) : null}
        </div>
      </Card>
    </article>
  );
}
