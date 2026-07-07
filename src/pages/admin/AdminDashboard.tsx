import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import type { CategoryName } from "../../types";
import { getArticles, deleteArticle, subscribe } from "../../lib/store";

const CATEGORY_DOT: Record<CategoryName, string> = {
  AI: "bg-indigo-500",
  Security: "bg-red-500",
  Dev: "bg-emerald-500",
  Hardware: "bg-amber-500",
  Emerging: "bg-sky-500",
};

function StatCard({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-zinc-900">{value}</p>
      <p className={`mt-1 flex items-center gap-1 font-mono text-xs ${up ? "text-emerald-600" : "text-amber-600"}`}>
        {up ? (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {delta}
      </p>
    </div>
  );
}

function parseViews(v: string) {
  const n = parseFloat(v);
  if (v.toLowerCase().includes("k")) return n * 1000;
  return n || 0;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState(() => getArticles());
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    const load = () => setArticles(getArticles());
    load();
    return subscribe(load);
  }, []);

  const confirmDelete = () => {
    if (deleteTargetId === null) return;
    deleteArticle(deleteTargetId);
    setDeleteTargetId(null);
  };

  const published = articles.filter((a) => a.status === "PUBLISHED");
  const drafts = articles.filter((a) => a.status === "DRAFT");
  const totalViews = articles.reduce((sum, a) => sum + parseViews(a.views), 0);

  const STATS = [
    { label: "Total Articles", value: String(articles.length), delta: `${articles.length} total`, up: true },
    {
      label: "Published",
      value: String(published.length),
      delta: articles.length ? `${Math.round((published.length / articles.length) * 100)}% of total` : "—",
      up: true,
    },
    { label: "Drafts", value: String(drafts.length), delta: drafts.length ? "Needs review" : "All clear", up: drafts.length === 0 },
    {
      label: "Total Views",
      value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : String(totalViews),
      delta: "Across all articles",
      up: true,
    },
  ];

  const RECENT_ARTICLES = articles.slice(0, 5);

  return (
    <AdminLayout
      title="Dashboard"
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
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent articles */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-zinc-900">Recent Articles</h2>
          <button
            onClick={() => navigate("/admin/articles")}
            className="font-mono text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400">Title</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 sm:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-400 lg:table-cell">Date</th>
                <th className="hidden px-4 py-3 text-right font-mono text-[11px] uppercase tracking-widest text-zinc-400 lg:table-cell">Views</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {RECENT_ARTICLES.map((article) => (
                <tr key={article.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="line-clamp-1 text-sm font-medium text-zinc-900">{article.title}</p>
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
                    <span className="font-mono text-xs text-zinc-400">{article.date}</span>
                  </td>
                  <td className="hidden px-4 py-4 text-right lg:table-cell">
                    <span className="font-mono text-xs text-zinc-400">{article.views}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(article.id)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
