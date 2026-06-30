// Mirrors the backend's Article / Category entities (see README — Spring Boot
// + PostgreSQL). Keep this in sync with the API's DTO shape so the response
// from /api/articles can be passed straight into these components.

export type CategoryName = "AI" | "Security" | "Dev" | "Hardware" | "Emerging";

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface Article {
  id: number;
  /** Zero-padded display index, e.g. "01". Cosmetic only — not a DB field. */
  index: string;
  category: CategoryName;
  title: string;
  excerpt: string;
  /** Full body, as paragraphs — shown inline when a reader expands the row. */
  content: string[];
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
