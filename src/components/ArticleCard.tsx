import type { Article } from "../types";
import Tag from "./Tag";
import { CATEGORY_GRADIENT } from "../lib/categoryStyles";
import ArticleBody from "./ArticleBody";

interface ArticleCardProps {
  article: Article;
  expanded: boolean;
  onToggle: () => void;
  /** Small orange label next to the tag, e.g. "Lead story". Omit for regular rows. */
  eyebrow?: string;
  /** Hide the chevron for cards that aren't part of the expand/collapse flow. */
  showChevron?: boolean;
}

// The single visual format for "a fully previewed article" — same gradient
// block, same title scale, same meta row. The lead story slot and an
// expanded list row both render through this component, so expanding row
// #07 looks exactly like the "01" card at the top, just in place at #07.
export default function ArticleCard({
  article,
  expanded,
  onToggle,
  eyebrow,
  showChevron = true,
}: ArticleCardProps) {
  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5AFE]/40"
      >
        <div className="flex flex-col md:flex-row">
          <div
            className={`flex h-48 items-center justify-center bg-gradient-to-br bg-cover bg-center md:h-auto md:w-2/5 ${CATEGORY_GRADIENT[article.category]}`}
            style={article.imagePath ? { backgroundImage: `url(${article.imagePath})` } : undefined}
          >
            {!article.imagePath && (
              <span className="font-display text-5xl font-bold text-white/20 select-none" aria-hidden="true">
                {article.index}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-2">
              <Tag category={article.category} />
              {eyebrow && (
                <span className="font-mono text-[11px] uppercase tracking-wide text-[#FF6B35]">
                  {eyebrow}
                </span>
              )}
            </div>
            <h2 className="mb-3 font-display text-2xl font-bold leading-tight text-[#0B0F1A] transition-colors group-hover:text-[#3D5AFE] sm:text-3xl">
              {article.title}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span>{article.date}</span>
              <span aria-hidden="true">·</span>
              <span>{article.readTime} read</span>
              <span aria-hidden="true">·</span>
              <span>{article.views} views</span>
              {showChevron && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className={`ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                    expanded ? "rotate-180" : ""
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-200 px-6 py-6 sm:px-8">
          <ArticleBody blocks={article.content} />
        </div>
      )}
    </div>
  );
}
