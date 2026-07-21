import type { Article, ContentBlock } from "../types";
import { api } from "./api";
import { useEffect, useState } from "react";

const CHANGE_EVENT = "nexora-articles-changed";
function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
export function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

// ---- Backend <-> Frontend shape conversion ----

interface BackendArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // JSON-encoded ContentBlock[]
  author: string;
  date: string;
  readTime: string;
  views: number;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  imagePath: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: { id: number; name: string } | null;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function toFrontend(b: BackendArticle): Article {
  let content: ContentBlock[] = [];
  try {
    content = JSON.parse(b.content);
  } catch {
    content = [{ id: crypto.randomUUID(), type: "paragraph", text: b.content }];
  }
  return {
    id: b.id,
    index: String(b.id).padStart(2, "0"),
    category: (b.category?.name ?? "AI") as Article["category"],
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    content,
    author: b.author,
    date: formatDate(b.date),
    readTime: b.readTime,
    views: formatViews(b.views),
    featured: b.featured,
    status: b.status,
    imagePath: b.imagePath ?? undefined,
    metaTitle: b.metaTitle ?? undefined,
    metaDescription: b.metaDescription ?? undefined,
  };
}

// ---- Reads ----

let cache: Article[] = [];

export async function fetchArticles(): Promise<Article[]> {
  const raw = await api.get<BackendArticle[]>("/articles");
  cache = raw.map(toFrontend).sort((a, b) => b.id - a.id);
  notifyChange();
  return cache;
}

export function getArticles(): Article[] {
  return cache;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const raw = await api.get<BackendArticle>(`/articles/${slug}`);
    return toFrontend(raw);
  } catch {
    return undefined;
  }
}

/** React hook: components use this instead of getArticles() directly. */
export function useArticles() {
  const [articles, setArticles] = useState<Article[]>(cache);
  const [loading, setLoading] = useState(cache.length === 0);

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
    return subscribe(() => setArticles(cache));
  }, []);

  return { articles, loading };
}

// ---- Writes ----

export interface ArticleInput {
  id?: number;
  title: string;
  slug?: string;
  category: Article["category"];
  excerpt: string;
  content: ContentBlock[];
  author?: string;
  status: Article["status"];
  metaTitle?: string;
  metaDescription?: string;
  imagePath?: string | null;
}

export async function saveArticle(input: ArticleInput): Promise<Article> {
  const body = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: JSON.stringify(input.content),
    author: input.author,
    status: input.status,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    imagePath: input.imagePath,
    date: new Date().toISOString().split("T")[0],
  };

  const raw = input.id
    ? await api.put<BackendArticle>(`/articles/${input.id}`, body)
    : await api.post<BackendArticle>("/articles", body);

  const result = toFrontend(raw);
  await fetchArticles();
  return result;
}

export async function deleteArticle(id: number): Promise<void> {
  await api.delete(`/articles/${id}`);
  await fetchArticles();
}