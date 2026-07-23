import { Link } from "react-router-dom";
import type { Article } from "../types";
import Tag from "./Tag";
import { CATEGORY_GRADIENT, primaryCategory, displayCategories } from "../lib/categoryStyles";

interface ArticleCardProps {
  article: Article;
  /** Small orange label next to the tag, e.g. "Lead story". Omit for regular rows. */
  eyebrow?: string;
  /** Hide the trailing arrow for cards that aren't meant to signal "open this". */
  showChevron?: boolean;
}

// The single visual format for "a fully previewed article" — same gradient
// block, same title scale, same meta row. The lead story slot and the
// article list both render through this component. Clicking anywhere on
// the card navigates to that article's own page rather than expanding
// content in place.
export default function ArticleCard({ article, eyebrow, showChevron = true }: ArticleCardProps) {
  const href = `/articles/${article.slug ?? article.id}`;

  return (
    <Link
      to={href}
      className="group block overflow-hidden rounded-lg border border-slate-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5AFE]/40"
    >
      <div className="flex flex-col md:flex-row">
        <div
          className={`flex h-48 items-center justify-center bg-gradient-to-br bg-cover bg-center md:h-auto md:w-2/5 ${CATEGORY_GRADIENT[primaryCategory(article.categories)]}`}
          style={article.imagePath ? { backgroundImage: `url(${article.imagePath})` } : undefined}
        >
          {!article.imagePath && (
            <span className="font-display text-5xl font-bold text-white/20 select-none" aria-hidden="true">
              {article.index}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {displayCategories(article.categories).map((name) => (
              <Tag key={name} category={name} />
            ))}
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
                className="ml-auto h-4 w-4 flex-shrink-0 -rotate-90 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
