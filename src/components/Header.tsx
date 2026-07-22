import { useNavigate } from "react-router-dom";
import type { Article, CategoryFilter } from "../types";
import { useCategories } from "../lib/categories";
import SearchBar from "./SearchBar";
import Logo from "./Logo";

interface HeaderProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  /** Extra reset logic to run when the logo is clicked (e.g. clearing a search box), on top of the navigation to "/". Optional — the Link always navigates home regardless. */
  onLogoClick?: () => void;
}

export default function Header({
  activeCategory,
  onCategoryChange,
  query,
  onQueryChange,
  articles,
  onSelectArticle,
  onLogoClick,
}: HeaderProps) {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const navTabs: CategoryFilter[] = ["All", ...categories.map((c) => c.name), "Uncategorized"];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#F7F8FA]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo onClick={onLogoClick} />

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <SearchBar
            articles={articles}
            query={query}
            onQueryChange={onQueryChange}
            onSelectArticle={onSelectArticle}
            showShortcutHint
            className="max-w-xl"
          />
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
        <SearchBar
          articles={articles}
          query={query}
          onQueryChange={onQueryChange}
          onSelectArticle={onSelectArticle}
        />
      </div>

      <nav
        aria-label="Categories"
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
      >
        {navTabs.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => onCategoryChange(cat)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/40 ${
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
