import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Article, CategoryFilter } from "../types";
import { getArticleBySlug, useArticles } from "../lib/store";
import { CATEGORY_GRADIENT } from "../lib/categoryStyles";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Tag from "../components/Tag";
import ArticleBody from "../components/ArticleBody";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Same live-loaded, store-backed list the homepage uses, so search
  // suggestions and category links from this page stay accurate too.
  const { articles } = useArticles();
  const allArticles = articles.filter((a) => a.status === "PUBLISHED");

  const [article, setArticle] = useState<Article | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setArticle(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    getArticleBySlug(slug)
      .then(setArticle)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    document.title = article ? `${article.metaTitle || article.title} — Nexora` : "Article not found — Nexora";
  }, [article]);

  const [query, setQuery] = useState("");

  const handleCategoryChange = (category: CategoryFilter) => {
    navigate(category === "All" ? "/" : `/?category=${category}`);
  };

  const handleSelectFromSearch = (a: Article) => {
    setQuery("");
    navigate(`/articles/${a.slug ?? a.id}`);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="font-mono text-sm text-slate-400">Loading...</p>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Header
          activeCategory="All"
          onCategoryChange={handleCategoryChange}
          query={query}
          onQueryChange={setQuery}
          articles={allArticles}
          onSelectArticle={handleSelectFromSearch}
        />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">404</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#0B0F1A]">
            We couldn't find that article.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            It may have been unpublished or the link is out of date.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-[#0B0F1A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2238]"
          >
            Back to homepage
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header
        activeCategory="All"
        onCategoryChange={handleCategoryChange}
        query={query}
        onQueryChange={setQuery}
        articles={allArticles}
        onSelectArticle={handleSelectFromSearch}
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-[#3D5AFE]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All stories
        </Link>

        <div
          className={`mb-8 flex h-56 items-center justify-center rounded-lg bg-gradient-to-br bg-cover bg-center sm:h-72 ${CATEGORY_GRADIENT[article.category]}`}
          style={article.imagePath ? { backgroundImage: `url(${article.imagePath})` } : undefined}
        >
          {!article.imagePath && (
            <span className="font-display text-6xl font-bold text-white/20 select-none" aria-hidden="true">
              {article.index}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Tag category={article.category} />
        </div>

        <h1 className="mb-4 font-display text-3xl font-bold leading-tight text-[#0B0F1A] sm:text-4xl">
          {article.title}
        </h1>

        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-6 font-mono text-xs text-slate-400">
          {article.author && <span className="text-slate-600">{article.author}</span>}
          {article.author && <span aria-hidden="true">·</span>}
          <span>{article.date}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readTime} read</span>
          <span aria-hidden="true">·</span>
          <span>{article.views} views</span>
        </div>

        <ArticleBody blocks={article.content} />
      </main>

      <Footer />
    </div>
  );
}
