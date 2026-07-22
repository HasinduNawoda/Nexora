// Mirrors the backend's Article / Category entities (see README — Spring Boot
// + PostgreSQL). Keep this in sync with the API's DTO shape so the response
// from /api/articles can be passed straight into these components.
//
// This is the ONLY types file in the project — src/types.ts (a duplicate,
// conflicting definition previously used only by the admin pages) has been
// removed. Both "../types" and "../../types" imports now resolve here.

export type CategoryName = "AI" | "Security" | "Dev" | "Hardware" | "Emerging";

export type ArticleStatus = "DRAFT" | "PUBLISHED";

// Rich content is modeled as an ordered list of typed blocks rather than a
// single content string. This is what lets the editor interleave headings,
// paragraphs, images, video (uploaded or YouTube), and audio in any order
// the author writes them in. The backend's Article.content column (see
// SECURITY/DATABASE notes in the project brief) stores exactly this shape
// as JSON, so this stays a drop-in match for the future API response.
export interface HeadingBlock {
  id: string;
  type: "heading";
  text: string;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  /** Data URL (local upload) or remote URL. */
  url: string;
  caption?: string;
}

export interface VideoBlock {
  id: string;
  type: "video";
  source: "upload" | "youtube";
  /** Object/data URL for an upload, or a normalized YouTube embed URL. */
  url: string;
  caption?: string;
}

export interface AudioBlock {
  id: string;
  type: "audio";
  url: string;
  caption?: string;
}

export type ContentBlock = HeadingBlock | ParagraphBlock | ImageBlock | VideoBlock | AudioBlock;

export interface Article {
  id: number;
  /** Zero-padded display index, e.g. "01". Cosmetic only — not a DB field. */
  index: string;
  /** Display name of the article's category. Any admin-created category name is valid here, not just the 5 starter ones. */
  category: string;
  /** Backend Category.id — needed when saving, since the API links articles to categories by id, not by name. */
  categoryId?: number;
  title: string;
  /** URL slug, e.g. "gpt-5-6-explained" → /articles/gpt-5-6-explained */
  slug?: string;
  excerpt: string;
  /** Full body, as an ordered list of rich content blocks. */
  content: ContentBlock[];
  author?: string;
  /** ISO date string from the backend; formatted for display in the UI layer. */
  date: string;
  readTime: string;
  views: string;
  featured?: boolean;
  status?: ArticleStatus;
  imagePath?: string;
  metaTitle?: string;
  metaDescription?: string;
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
