// Mirrors the backend's Article / Category entities (see README — Spring Boot
// + PostgreSQL). Keep this in sync with the API's DTO shape so the response
// from /api/articles can be passed straight into these components.
//
// This is the ONLY types file in the project — src/types.ts (a duplicate,
// conflicting definition previously used only by the admin pages) has been
// removed. Both "../types" and "../../types" imports now resolve here.

export type CategoryName = "AI" | "Security" | "Dev" | "Hardware" | "Emerging";

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface Article {
  id: number;
  /** Zero-padded display index, e.g. "01". Cosmetic only — not a DB field. */
  index: string;
  category: CategoryName;
  title: string;
  /** URL slug, e.g. "gpt-5-6-explained" → /articles/gpt-5-6-explained */
  slug?: string;
  excerpt: string;
  /** Full body, as paragraphs — shown inline when a reader expands the row. */
  content: string[];
  author?: string;
  /** ISO date string from the backend; formatted for display in the UI layer. */
  date: string;
  readTime: string;
  views: string;
  featured?: boolean;
  status?: ArticleStatus;
  imagePath?: string;
}

export const CATEGORIES: readonly ("All" | CategoryName)[] = [
  "All",
  "AI",
  "Security",
  "Dev",
  "Hardware",
  "Emerging",
];

export type CategoryFilter = (typeof CATEGORIES)[number];

// Admin: category management. Deliberately typed with a plain `name: string`
// rather than CategoryName — the whole point of the category manager is
// letting an admin create categories beyond the fixed starter set.
export interface CategoryItem {
  id: number;
  name: string;
  articleCount: number;
}

export interface AdminUser {
  username: string;
  token: string;
}
