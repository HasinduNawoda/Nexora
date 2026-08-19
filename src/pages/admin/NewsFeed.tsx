import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import GmailConnectionPanel from "../../components/admin/GmailConnectionPanel";
import { CATEGORY_STYLES } from "../../lib/categoryStyles";
import {
  fetchNewsFeed,
  setNewsItemRead,
  dismissNewsItem,
  bulkSetRead,
  bulkDismiss,
  type NewsItem,
} from "../../lib/newsFeed";

type ReadFilter = "all" | "unread" | "read";

function formatReceivedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNewsFeed({
        query: query || undefined,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        read: readFilter,
        page,
        size: 20,
      });
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the news feed.");
    } finally {
      setLoading(false);
    }
  }, [query, sourceFilter, categoryFilter, readFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 0 whenever a filter (not the page itself) changes.
  useEffect(() => {
    setPage(0);
  }, [query, sourceFilter, categoryFilter, readFilter]);

  // Distinct sources/categories seen so far, for the filter dropdowns — the
  // API contract has no "list sources/categories" endpoint, so these are
  // derived from loaded items rather than fetched separately.
  const sources = Array.from(new Set(items.map((i) => i.source))).sort();
  const categories = Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c))).sort();

  // Date range is applied client-side to the current page only, since the
  // backend contract doesn't expose date params — see assumptions in the
  // implementation report.
  const visibleItems = items.filter((item) => {
    if (dateFrom && item.receivedAt < dateFrom) return false;
    if (dateTo && item.receivedAt > `${dateTo}T23:59:59`) return false;
    return true;
  });

  const allSelected = visibleItems.length > 0 && visibleItems.every((i) => selected.has(i.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleItems.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRead = async (item: NewsItem) => {
    setRowBusyId(item.id);
    try {
      const read = await setNewsItemRead(item.id, !item.read);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read } : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update item.");
    } finally {
      setRowBusyId(null);
    }
  };

  const handleOpen = async (item: NewsItem) => {
    setExpandedId((prev) => (prev === item.id ? null : item.id));
    if (!item.read) {
      try {
        await setNewsItemRead(item.id, true);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      } catch {
        // Non-critical — the row just won't flip to "read" until the next load.
      }
    }
  };

  const handleDismiss = async (id: number) => {
    setRowBusyId(id);
    try {
      await dismissNewsItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to dismiss item.");
    } finally {
      setRowBusyId(null);
    }
  };

  const handleBulkMarkRead = async (read: boolean) => {
    setBulkBusy(true);
    try {
      await bulkSetRead(Array.from(selected), read);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDismiss = async () => {
    setBulkBusy(true);
    try {
      await bulkDismiss(Array.from(selected));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk dismiss failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  return (
    <AdminLayout title="News Feed">
      <GmailConnectionPanel onSynced={load} />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news feed…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pl-8 font-mono text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-1 rounded-md border border-zinc-200 bg-white p-1">
            {(["all", "unread", "read"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setReadFilter(r)}
                className={`rounded px-3 py-1 font-mono text-xs font-medium capitalize transition-colors ${
                  readFilter === r ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="font-mono text-xs text-zinc-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2.5">
          <p className="font-mono text-xs font-medium text-indigo-700">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkMarkRead(true)}
              disabled={bulkBusy}
              className="rounded-md border border-indigo-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              Mark read
            </button>
            <button
              onClick={() => handleBulkMarkRead(false)}
              disabled={bulkBusy}
              className="rounded-md border border-indigo-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              Mark unread
            </button>
            <button
              onClick={handleBulkDismiss}
              disabled={bulkBusy}
              className="rounded-md border border-red-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="font-mono text-xs text-indigo-500 hover:text-indigo-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Feed list */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={visibleItems.length === 0}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-sm text-zinc-400">Loading…</div>
        ) : visibleItems.length === 0 ? (
          <div className="py-16 text-center font-mono text-sm text-zinc-400">
            No news items found.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {visibleItems.map((item) => (
              <li key={item.id} className="group">
                <div className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 ${!item.read ? "bg-indigo-50/30" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1.5 h-3.5 w-3.5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  {/* Unread dot */}
                  <span
                    className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-indigo-500"}`}
                    aria-hidden
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpen(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpen(item);
                      }
                    }}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${item.read ? "font-medium text-zinc-600" : "font-semibold text-zinc-900"}`}>
                        {item.title}
                      </p>
                      {item.category && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ring-1 ${CATEGORY_STYLES[item.category]}`}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                      {item.source} · {formatReceivedAt(item.receivedAt)}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{item.preview}</p>

                    {expandedId === item.id && (
                      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                        <p className="mb-3 text-sm text-zinc-600">{item.preview}</p>
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                          >
                            Open original article
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <p className="font-mono text-xs text-zinc-400">No link could be extracted from this email.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open original article"
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {item.sourceUrl && (
                      <button
                        onClick={() => handleCopyLink(item.sourceUrl!)}
                        title="Copy link"
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleRead(item)}
                      disabled={rowBusyId === item.id}
                      title={item.read ? "Mark unread" : "Mark read"}
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDismiss(item.id)}
                      disabled={rowBusyId === item.id}
                      title="Dismiss"
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && visibleItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
            <p className="font-mono text-xs text-zinc-400">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-xs text-zinc-500 hover:bg-zinc-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-xs text-zinc-500 hover:bg-zinc-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
