import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Article, CategoryFilter } from "../types";
import { CATEGORIES } from "../types";
import { getArticles, subscribe } from "../lib/store";
import Header from "../components/Header";
import FeaturedArticle from "../components/FeaturedArticle";
import ArticleRow from "../components/ArticleRow";
import Footer from "../components/Footer";

function isValidCategory(value: string | null): value is CategoryFilter {
  return value !== null && (CATEGORIES as readonly string[]).includes(value);
}

export default function Homepage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Category state is seeded from the URL (e.g. footer links to
  // /?category=AI) and kept in sync as the reader clicks around, so the
  // current filter is always shareable/bookmarkable.
  const [activeCategory, setActiveCategoryState] = useState<CategoryFilter>(() => {
    const fromUrl = searchParams.get("category");
    return isValidCategory(fromUrl) ? fromUrl : "All";
  });

  // The useState initializer above only runs on first mount. Clicking a
  // footer/header category link while already on Homepage updates the URL
  // but does NOT remount this component, so without this effect
  // activeCategory would silently go stale and ignore the new URL.
  useEffect(() => {
    const fromUrl = searchParams.get("category");
    const next = isValidCategory(fromUrl) ? fromUrl : "All";
    setActiveCategoryState((current) => (current === next ? current : next));
  }, [searchParams]);

  const setActiveCategory = (category: CategoryFilter) => {
    setActiveCategoryState(category);
    setSearchParams(category === "All" ? {} : { category }, { replace: true });
  };

  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Only one row can be expanded at a time. Opening a new one collapses
  // whichever was previously open.
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  // Picking a search suggestion should reliably land on that article,
  // wherever it lives — so it clears any filter that might hide it, expands
  // it in place, and scrolls it into view rather than jumping to the top.
  const handleSelectFromSearch = (article: Article) => {
    setActiveCategory("All");
    setQuery("");
    setExpandedId(article.id);
    requestAnimationFrame(() => {
      document.getElementById(`article-${article.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // Live-loaded from the shared store (localStorage-backed today, a real
  // API once the backend exists) so anything published in the admin editor
  // shows up here without hardcoding it in a second place.
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  useEffect(() => {
    const load = () => setAllArticles(getArticles().filter((a) => a.status === "PUBLISHED"));
    load();
    return subscribe(load);
  }, []);

  const filtered = useMemo(
    () =>
      allArticles.filter((a) => {
        const matchesCategory = activeCategory === "All" || a.category === activeCategory;
        const matchesQuery = a.title.toLowerCase().includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [allArticles, activeCategory, query]
  );

  // The lead story is always whichever article is flagged `featured` (falls
  // back to the first result).
  const featured = filtered.find((a) => a.featured) ?? filtered[0];

  // The hero slot only shows while nothing else is expanded. As soon as the
  // reader expands a different article, the featured article needs to fold
  // back into the regular list as a normal row (instead of disappearing),
  // so it's only excluded from `rest` while it's actually being shown above.
  const showHero = expandedId === null;
  const rest = showHero ? filtered.filter((a) => a.id !== featured?.id) : filtered;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        query={query}
        onQueryChange={setQuery}
        articles={allArticles}
        onSelectArticle={handleSelectFromSearch}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {featured && showHero && <FeaturedArticle article={featured} />}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Latest signal
          </h2>
          <span className="font-mono text-xs text-slate-400">{rest.length} stories</span>
        </div>

        <div>
          {rest.length > 0 ? (
            rest.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isHovered={hoveredId === article.id}
                onHover={setHoveredId}
                isExpanded={expandedId === article.id}
                onToggle={() => toggleExpanded(article.id)}
              />
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="font-mono text-sm text-slate-400">
                No stories match that search. Try a different keyword or category.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}