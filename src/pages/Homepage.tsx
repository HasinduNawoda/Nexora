import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Article, CategoryFilter } from "../types";
import { fetchArticles, getArticles, subscribe } from "../lib/store";
import Header from "../components/Header";
import ArticleRow from "../components/ArticleRow";
import Footer from "../components/Footer";
import loadingGif from "../assets/loading.gif";
import emptyStateGif from "../assets/empty-state.gif";

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
  //
  // isLoading starts true only when the cache is genuinely empty (first
  // ever load in this browser session) — if we're navigating back here
  // after the cache is already warm, there's no fetch to wait on, so we
  // skip straight to the real content instead of flashing a loading state.
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(() => getArticles().length === 0);
  useEffect(() => {
    const load = () => {
      setAllArticles(getArticles().filter((a) => a.status === "PUBLISHED"));
    };
    // If the cache already has data (e.g. we're navigating back here from
    // an article page within the same session), show it immediately with
    // no loading flash — there's nothing to wait on.
    if (getArticles().length > 0) {
      load();
      setIsLoading(false);
    }
    // Otherwise this is the genuine first load: keep isLoading true until
    // the real network request actually settles, not before.
    fetchArticles()
      .then(load)
      .finally(() => setIsLoading(false));
    return subscribe(load);
  }, []);

  const filtered = useMemo(
    () =>
      allArticles.filter((a) => {
        const matchesCategory =
          activeCategory === "All" ||
          (activeCategory === "Uncategorized"
            ? a.categoryIds.length === 0
            : a.categories.includes(activeCategory));
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
          {isLoading ? (
            <div data-state="loading" className="py-16 text-center">
              <img src={loadingGif} alt="Loading" className="mx-auto h-16 w-16" />
              <p className="mt-3 font-mono text-sm text-slate-400">Loading stories…</p>
            </div>
          ) : ordered.length > 0 ? (
            ordered.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isHovered={hoveredId === article.id}
                onHover={setHoveredId}
                eyebrow={article.id === featured?.id ? "Lead story" : undefined}
              />
            ))
          ) : allArticles.length === 0 ? (
            // Genuinely no published articles anywhere yet (fresh site).
            <div data-state="no-articles" className="py-16 text-center">
              <img src={emptyStateGif} alt="No articles yet" className="mx-auto h-32 w-32" />
              <p className="font-mono text-sm text-slate-400">
                No stories published yet. Check back soon.
              </p>
            </div>
          ) : (
            // Articles exist, just none match the current search/category.
            <div data-state="no-matches" className="py-16 text-center">
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
