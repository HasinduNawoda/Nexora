import { useEffect, useMemo, useRef, useState } from "react";
import type { Article } from "../types";
import Tag from "./Tag";
import searchIcon from "../assets/search.png";

interface SearchBarProps {
  articles: Article[];
  query: string;
  onQueryChange: (value: string) => void;
  /** Called when the reader picks a suggestion — Header/Homepage decide what that means. */
  onSelectArticle: (article: Article) => void;
  /** Widens the "⌘K to search" hint on desktop only; mobile stays compact. */
  showShortcutHint?: boolean;
  className?: string;
}

const MAX_SUGGESTIONS = 6;

// Wraps the substring of `text` that matches `query` in <mark> for a quick
// visual scan of why each row matched.
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (i === -1) return <>{text}</>;
  const before = text.slice(0, i);
  const match = text.slice(i, i + query.trim().length);
  const after = text.slice(i + query.trim().length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-[#3D5AFE]/15 text-[#0B0F1A]">{match}</mark>
      {after}
    </>
  );
}

export default function SearchBar({
  articles,
  query,
  onQueryChange,
  onSelectArticle,
  showShortcutHint = false,
  className = "",
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().toLowerCase();

  // Most-viewed articles, used as "Trending" suggestions when the box is
  // focused but the reader hasn't typed anything yet.
  const trending = useMemo(
    () =>
      [...articles]
        .sort((a, b) => parseFloat(b.views) - parseFloat(a.views))
        .slice(0, MAX_SUGGESTIONS),
    [articles]
  );

  const matches = useMemo(() => {
    if (!trimmed) return [];
    return articles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(trimmed) || a.excerpt.toLowerCase().includes(trimmed)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [articles, trimmed]);

  const suggestions = trimmed ? matches : trending;
  const showTrendingLabel = !trimmed && suggestions.length > 0;

  // Close on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ⌘K / Ctrl+K focuses this box from anywhere on the page. Harmless if two
  // instances mount (desktop + mobile) — a hidden input can't receive focus,
  // so only the visible one responds.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, isOpen]);

  const closeAndBlur = () => {
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const pick = (article: Article) => {
    onSelectArticle(article);
    closeAndBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") closeAndBlur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      closeAndBlur();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <label className="relative block w-full">
        <span className="sr-only">Search articles</span>
        <img
          src={searchIcon}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search articles, topics, tags…"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-slate-800 shadow-sm placeholder:text-slate-400 transition-all duration-150 hover:border-slate-300 hover:shadow focus:border-[#3D5AFE] focus:shadow-md focus:shadow-[#3D5AFE]/10 focus:outline-none focus:ring-4 focus:ring-[#3D5AFE]/15"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          showShortcutHint && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
          )
        )}
      </label>

      {isOpen && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          {showTrendingLabel && (
            <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Trending
            </p>
          )}
          {suggestions.map((article, i) => (
            <button
              key={article.id}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => pick(article)}
              className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                i === activeIndex ? "bg-slate-50" : "hover:bg-slate-50"
              }`}
            >
              <Tag category={article.category} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#0B0F1A]">
                  <HighlightedText text={article.title} query={query} />
                </span>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span>{article.readTime} read</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.views} views</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && trimmed && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-lg">
          <p className="font-mono text-xs text-slate-400">No articles match "{query.trim()}".</p>
        </div>
      )}
    </div>
  );
}
