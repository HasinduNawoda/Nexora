import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import type { CategoryItem } from "../../types";

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 1, name: "AI", articleCount: 12 },
  { id: 2, name: "Security", articleCount: 5 },
  { id: 3, name: "Dev", articleCount: 4 },
  { id: 4, name: "Hardware", articleCount: 2 },
  { id: 5, name: "Emerging", articleCount: 1 },
];

const CATEGORY_GRADIENT: Record<string, string> = {
  AI: "from-indigo-500 to-indigo-700",
  Security: "from-red-500 to-red-700",
  Dev: "from-emerald-500 to-emerald-700",
  Hardware: "from-amber-500 to-amber-700",
  Emerging: "from-sky-500 to-sky-700",
};

export default function CategoryManager() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const next: CategoryItem = {
      id: Date.now(),
      name: trimmed as CategoryItem["name"],
      articleCount: 0,
    };
    setCategories((prev) => [...prev, next]);
    setNewName("");
  };

  const handleEdit = (id: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editValue.trim() as CategoryItem["name"] } : c))
    );
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = () => {
    if (deleteTargetId === null) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  return (
    <AdminLayout title="Categories">
      <div className="mx-auto max-w-2xl">

        {/* Add new */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-display text-sm font-semibold text-zinc-900">Add Category</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Category name…"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Category list */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h3 className="font-display text-sm font-semibold text-zinc-900">
              All Categories
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-500">
                {categories.length}
              </span>
            </h3>
          </div>

          <ul className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-4 px-5 py-4">
                {/* Color swatch */}
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${
                    CATEGORY_GRADIENT[cat.name] ?? "from-zinc-400 to-zinc-600"
                  }`}
                >
                  <span className="font-mono text-[11px] font-bold">
                    {cat.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Name / edit inline */}
                <div className="flex-1">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEdit(cat.id);
                          if (e.key === "Escape") { setEditingId(null); setEditValue(""); }
                        }}
                        autoFocus
                        className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button
                        onClick={() => handleEdit(cat.id)}
                        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditValue(""); }}
                        className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-zinc-900">{cat.name}</p>
                      <p className="font-mono text-xs text-zinc-400">
                        {cat.articleCount} {cat.articleCount === 1 ? "article" : "articles"}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingId !== cat.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditValue(cat.name); }}
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(cat.id)}
                      disabled={cat.articleCount > 0}
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      title={cat.articleCount > 0 ? "Remove all articles first" : "Delete"}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="border-t border-zinc-100 px-5 py-3">
            <p className="font-mono text-xs text-zinc-400">
              Categories with articles cannot be deleted. Reassign articles first.
            </p>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="mb-1 font-display text-base font-semibold text-zinc-900">Delete category?</h3>
            <p className="mb-5 text-sm text-zinc-500">
              This will permanently remove the category.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
