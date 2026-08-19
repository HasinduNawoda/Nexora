import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// ============================================================================
// Gmail connection status
// ============================================================================
// App-level connection (single admin account) — not per-user. Mirrors the
// module-level cache + window-event pub-sub pattern used in store.ts /
// categories.ts so any component can subscribe without prop drilling.

export interface GmailStatus {
  connected: boolean;
  email?: string;
  lastSyncedAt?: string;
}

const GMAIL_CHANGE_EVENT = "nexora-gmail-status-changed";
function notifyGmailChange() {
  window.dispatchEvent(new Event(GMAIL_CHANGE_EVENT));
}
function subscribeGmail(callback: () => void): () => void {
  window.addEventListener(GMAIL_CHANGE_EVENT, callback);
  return () => window.removeEventListener(GMAIL_CHANGE_EVENT, callback);
}

let gmailCache: GmailStatus = { connected: false };

export async function fetchGmailStatus(): Promise<GmailStatus> {
  gmailCache = await api.get<GmailStatus>("/admin/gmail/status");
  notifyGmailChange();
  return gmailCache;
}

export function getGmailStatus(): GmailStatus {
  return gmailCache;
}

/** React hook: connection panel uses this instead of hitting the API directly. */
export function useGmailStatus() {
  const [status, setStatus] = useState<GmailStatus>(gmailCache);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchGmailStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Gmail connection status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return subscribeGmail(() => setStatus(gmailCache));
  }, [refresh]);

  return { status, loading, error, refresh };
}

/** Kicks off the OAuth flow — redirect the browser, don't fetch(). */
export async function getGmailAuthUrl(): Promise<string> {
  const { authUrl } = await api.get<{ authUrl: string }>("/admin/gmail/auth-url");
  return authUrl;
}

export async function disconnectGmail(): Promise<void> {
  await api.post("/admin/gmail/disconnect");
  await fetchGmailStatus();
}

export interface SyncResult {
  imported: number;
  skipped: number;
  lastSyncedAt: string;
}

export async function syncGmailNow(): Promise<SyncResult> {
  const result = await api.post<SyncResult>("/admin/gmail/sync");
  await fetchGmailStatus();
  return result;
}

// ============================================================================
// News feed items
// ============================================================================
// Read-only feed of imported newsletter/news emails. No connection to the
// Article/ArticleEditor publishing flow. Paginated + filtered server-side, so
// (unlike articles/categories) there's no full-list module cache here — the
// page component owns the current page of results and calls these functions
// directly. If the real backend response shape differs, this is the one file
// to change.

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  receivedAt: string; // ISO
  category: string | null;
  preview: string;
  sourceUrl: string | null;
  read: boolean;
}

export interface NewsFeedQuery {
  query?: string;
  source?: string;
  category?: string;
  read?: "all" | "read" | "unread";
  page?: number; // 0-based
  size?: number;
}

export interface NewsFeedPage {
  items: NewsItem[];
  page: number;
  totalPages: number;
}

function buildNewsQueryString(q: NewsFeedQuery): string {
  const params = new URLSearchParams();
  if (q.query) params.set("query", q.query);
  if (q.source) params.set("source", q.source);
  if (q.category) params.set("category", q.category);
  if (q.read && q.read !== "all") params.set("read", q.read === "read" ? "true" : "false");
  params.set("page", String(q.page ?? 0));
  params.set("size", String(q.size ?? 20));
  return params.toString();
}

export async function fetchNewsFeed(q: NewsFeedQuery = {}): Promise<NewsFeedPage> {
  return api.get<NewsFeedPage>(`/admin/news?${buildNewsQueryString(q)}`);
}

/** Fetching a single item marks it read server-side (per API contract). */
export async function fetchNewsItem(id: number): Promise<NewsItem> {
  return api.get<NewsItem>(`/admin/news/${id}`);
}

export async function setNewsItemRead(id: number, read: boolean): Promise<boolean> {
  const result = await api.patch<{ read: boolean }>(`/admin/news/${id}/read`, { read });
  return result.read;
}

/** Dismiss only hides the item from this feed — never touches the Gmail message. */
export async function dismissNewsItem(id: number): Promise<void> {
  await api.delete(`/admin/news/${id}`);
}

export async function bulkSetRead(ids: number[], read: boolean): Promise<void> {
  await Promise.all(ids.map((id) => setNewsItemRead(id, read)));
}

export async function bulkDismiss(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => dismissNewsItem(id)));
}