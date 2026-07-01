import { useNavigate } from "react-router-dom";
import type { CategoryFilter } from "../types";
import { CATEGORIES } from "../types";

interface HeaderProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export default function Header({
  activeCategory,
  onCategoryChange,
  query,
  onQueryChange,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#F7F8FA]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <span className="h-2 w-2 rounded-full bg-[#3D5AFE] animate-pulse" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight text-[#0B0F1A]">
            NEX<span className="text-[#3D5AFE]">ORA</span>
          </span>
        </a>

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <label className="relative w-full max-w-sm">
            <span className="sr-only">Search articles</span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search articles…"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 pl-8 font-mono text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-[#3D5AFE] focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/30"
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </label>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="shrink-0 rounded-md bg-[#0B0F1A] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2238] focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/40"
        >
          Admin
        </button>
      </div>

      <div className="px-4 pb-3 md:hidden sm:px-6">
        <label className="relative block w-full">
          <span className="sr-only">Search articles</span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 pl-8 font-mono text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#3D5AFE] focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/30"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </label>
      </div>

      <nav
        aria-label="Categories"
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/40 ${
              activeCategory === cat
                ? "bg-[#0B0F1A] text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>
    </header>
  );
}
