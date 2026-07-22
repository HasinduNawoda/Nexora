import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Article, CategoryFilter } from "../types";
import { fetchArticles, getArticles, subscribe } from "../lib/store";
import Header from "../components/Header";
import ArticleRow from "../components/ArticleRow";
import Footer from "../components/Footer";

export default function Homepage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Category state is seeded from the URL (e.g. footer links to
  // /?category=AI) and kept in sync as the reader clicks around, so the
  // current filter is always shareable/bookmarkable. The category list
  // itself is dynamic now (fetched live in Header/Footer), so there's no
  // fixed set to validate the URL value against — any string is accepted,
  // and simply won't match anything if it doesn't correspond to a real
  // category.
  const [activeCategory, setActiveCategoryState] = useState<CategoryFilter>(
    () => searchParams.get("category") ?? "All"
  );

  // The useState initializer above only runs on first mount. Clicking a
  // footer/header category link while already on Homepage updates the URL
  // but does NOT remount this component, so without this effect
  // activeCategory would silently go stale and ignore the new URL.
  useEffect(() => {
    const next = searchParams.get("category") ?? "All";
    setActiveCategoryState((current) => (current === next ? current : next));
  }, [searchParams]);

  const setActiveCategory = (category: CategoryFilter) => {
    setActiveCategoryState(category);
    setSearchParams(category === "All" ? {} : { category }, { replace: true });
  };

  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Clicking the logo is a full reset: back to "/", every filter cleared,
  // search box emptied. The Link inside Header handles the navigation
  // itself; this just clears the state that navigation alone wouldn't
  // touch (query text, and the category if we're already on "/").
  const handleLogoReset = () => {
    setActiveCategory("All");
    setQuery("");
  };

  // Picking a search suggestion should reliably land on that article,
  // wherever it lives — so it takes the reader straight to that article's
  // own page rather than trying to reveal it in the current list.
  const handleSelectFromSearch = (article: Article) => {
    setQuery("");
    navigate(`/articles/${article.slug ?? article.id}`);
  };

  // Live-loaded from the shared store (localStorage-backed today, a real
  // API once the backend exists) so anything published in the admin editor
  // shows up here without hardcoding it in a second place.
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  useEffect(() => {
    const load = () => setAllArticles(getArticles().filter((a) => a.status === "PUBLISHED"));
    load();
    fetchArticles();
    return subscribe(load);
  }, []);

  const filtered = useMemo(
    () =>
      allArticles.filter((a) => {
        const matchesCategory =
          activeCategory === "All" ||
          (activeCategory === "Uncategorized"
            ? !a.categoryId
            : a.category === activeCategory);
        const matchesQuery = a.title.toLowerCase().includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [allArticles, activeCategory, query]
  );

  // The lead story is always whichever article is flagged `featured` (falls
  // back to the first result). It's still shown first, but now as the same
  // uniform row size as every other story, just tagged with a "Lead story"
  // eyebrow instead of getting an oversized card.
  const featured = filtered.find((a) => a.featured) ?? filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id);
  const ordered = featured ? [featured, ...rest] : rest;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        query={query}
        onQueryChange={setQuery}
        articles={allArticles}
        onSelectArticle={handleSelectFromSearch}
        onLogoClick={handleLogoReset}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Latest signal
          </h2>
          <span className="font-mono text-xs text-slate-400">{ordered.length} stories</span>
        </div>

        <div>
          {ordered.length > 0 ? (
            ordered.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isHovered={hoveredId === article.id}
                onHover={setHoveredId}
                eyebrow={article.id === featured?.id ? "Lead story" : undefined}
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
