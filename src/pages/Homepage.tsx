import { useMemo, useState } from "react";
import type { CategoryFilter } from "../types";
import { ARTICLES } from "../data/articles";
import Header from "../components/Header";
import FeaturedArticle from "../components/FeaturedArticle";
import ArticleRow from "../components/ArticleRow";
import Footer from "../components/Footer";

export default function Homepage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Only one row can be expanded at a time. Opening a new one collapses
  // whichever was previously open.
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const filtered = useMemo(
    () =>
      ARTICLES.filter((a) => {
        const matchesCategory = activeCategory === "All" || a.category === activeCategory;
        const matchesQuery = a.title.toLowerCase().includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [activeCategory, query]
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
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {featured && showHero && (
           <FeaturedArticle article={featured} />
            )}
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
