import type { Article } from "../types";
import Tag from "./Tag";
import ArticleCard from "./ArticleCard";
import { CATEGORY_GRADIENT } from "../lib/categoryStyles";

interface ArticleRowProps {
  article: Article;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ArticleRow({
  article,
  isHovered,
  onHover,
  isExpanded,
  onToggle,
}: ArticleRowProps) {
  // isExpanded/onToggle come from the parent, which tracks a single
  // expandedId for the whole feed — so opening this row automatically
  // closes whichever other row was open. Toggling never moves this row,
  // never touches scroll position, and never reorders the list.
  if (isExpanded) {
    return (
      <div className="my-6">
        <ArticleCard article={article} expanded onToggle={onToggle} />
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        aria-expanded={false}
        onClick={onToggle}
        onMouseEnter={() => onHover(article.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(article.id)}
        onBlur={() => onHover(null)}
        className="group relative flex w-full gap-4 py-6 pl-5 pr-4 text-left transition-colors hover:bg-white focus:bg-white focus:outline-none sm:gap-6"
      >
        {/* pulse line — signature element */}
        <span
          aria-hidden="true"
          className={`absolute left-0 top-0 h-full w-[3px] transition-all duration-300 ${
            isHovered ? "bg-[#3D5AFE]" : "bg-transparent"
          }`}
        />
        <span
          aria-hidden="true"
          className={`mt-1 hidden font-mono text-xs sm:block ${
            isHovered ? "text-[#3D5AFE]" : "text-slate-300"
          }`}
        >
          {article.index}
        </span>

        <div
          aria-hidden="true"
          className={`hidden h-16 w-24 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br sm:flex ${CATEGORY_GRADIENT[article.category]}`}
        >
          <span className="font-display text-sm font-bold text-white/30 select-none">
            {article.index}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Tag category={article.category} />
            <span className="font-mono text-[11px] text-slate-400">{article.date}</span>
          </div>
          <h3 className="mb-1.5 font-display text-lg font-semibold leading-snug text-[#0B0F1A] transition-colors group-hover:text-[#3D5AFE] sm:text-xl">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
          <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>{article.readTime} read</span>
            <span aria-hidden="true">·</span>
            <span>{article.views} views</span>
          </div>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="mt-1.5 h-4 w-4 flex-shrink-0 text-slate-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
