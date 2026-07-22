import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { getArticles, deleteArticle, subscribe } from "../../lib/store";

const CATEGORY_DOT_MAP: Record<string, string> = {
  AI: "bg-indigo-500",
  Security: "bg-red-500",
  Dev: "bg-emerald-500",
  Hardware: "bg-amber-500",
  Emerging: "bg-sky-500",
};
const CATEGORY_DOT = new Proxy(CATEGORY_DOT_MAP, {
  get: (target, prop: string) => target[prop] ?? "bg-zinc-400",
});

export default function ArticleList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PUBLISHED" | "DRAFT">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [articles, setArticles] = useState(() => getArticles());

  // Re-read from the store whenever it changes (e.g. after publishing a new
  // article from the editor) and whenever this list mounts, so the list is
  // never showing a stale snapshot.
  useEffect(() => {
    const load = () => setArticles(getArticles());
    load();
    return subscribe(load);
  }, []);

  const filtered = articles.filter((a) => {
    const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const confirmDelete = () => {
    if (deleteTargetId === null) return;
    deleteArticle(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <AdminLayout
      title="Articles"
      actions={
        <button
          onClick={() => navigate("/admin/articles/new")}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </button>
      }
    >
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pl-8 font-mono text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {(["all", "PUBLISHED", "DRAFT"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded px-3 py-1 font-mono text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400">Title</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 sm:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 lg:table-cell">Author</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 lg:table-cell">Date</th>
                <th className="hidden px-4 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-zinc-400 xl:table-cell">Views</th>
                <th className="px-5 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center font-mono text-sm text-zinc-400">
                    No articles found.
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="group hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-900">{article.title}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">/{article.slug}</p>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[article.category]}`} />
                        <span className="font-mono text-xs text-zinc-500">{article.category}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ring-1 ${
                          article.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {article.status?.toLowerCase()}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <span className="text-sm text-zinc-500">{article.author}</span>
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <span className="font-mono text-xs text-zinc-400">{article.date}</span>
                    </td>
                    <td className="hidden px-4 py-4 text-right xl:table-cell">
                      <span className="font-mono text-xs text-zinc-400">{article.views}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(article.id)}
                          className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="border-t border-zinc-100 px-5 py-3">
            <p className="font-mono text-xs text-zinc-400">
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="mb-1 font-display text-base font-semibold text-zinc-900">Delete article?</h3>
            <p className="mb-5 text-sm text-zinc-500">
              This action cannot be undone. The article will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
