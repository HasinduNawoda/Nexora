import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import type { CategoryName, ArticleStatus } from "../../types";

const CATEGORIES: CategoryName[] = ["AI", "Security", "Dev", "Hardware", "Emerging"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readTime(text: string) {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
}

interface FormState {
  title: string;
  slug: string;
  slugEdited: boolean;
  category: CategoryName;
  excerpt: string;
  body: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  status: ArticleStatus;
  imagePreview: string | null;
}

const INITIAL: FormState = {
  title: "",
  slug: "",
  slugEdited: false,
  category: "AI",
  excerpt: "",
  body: "",
  author: "",
  metaTitle: "",
  metaDescription: "",
  status: "DRAFT",
  imagePreview: null,
};

export default function ArticleEditor() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: f.slugEdited ? f.slug : slugify(value),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    set("imagePreview", url);
  };

  const handleSave = async (publishNow?: boolean) => {
    setSaving(true);
    const status: ArticleStatus = publishNow ? "PUBLISHED" : form.status;
    set("status", status);

    // --- Replace with real API call ---
    // const endpoint = isEdit ? `/api/articles/${id}` : "/api/articles";
    // const method = isEdit ? "PUT" : "POST";
    // await fetch(endpoint, {
    //   method,
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${localStorage.getItem("nexora_admin_token")}`,
    //   },
    //   body: JSON.stringify({ ...form, status }),
    // });

    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (publishNow) navigate("/admin/articles");
  };

  const wc = wordCount(form.body);
  const rt = readTime(form.body);

  return (
    <AdminLayout
      title={isEdit ? "Edit Article" : "New Article"}
      actions={
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 font-mono text-xs text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !form.title || !form.body}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Publish
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content — 2/3 */}
          <div className="space-y-5 lg:col-span-2">

            {/* Title */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article headline…"
                className="w-full rounded-md border border-zinc-200 px-3 py-2.5 font-display text-lg font-semibold text-zinc-900 placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              {/* Slug */}
              <div className="mt-3">
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-zinc-400">
                  URL slug
                </label>
                <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <span className="flex-shrink-0 font-mono text-xs text-zinc-400">/articles/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugEdited: true }))}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs text-zinc-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                Excerpt
              </label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Short summary shown in article cards and social sharing…"
                className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">
                {form.excerpt.length}/160
              </p>
            </div>

            {/* Body */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Content <span className="text-red-500">*</span>
                </label>
                <span className="font-mono text-[11px] text-zinc-400">
                  {wc} words · {rt} min read
                </span>
              </div>
              <textarea
                rows={18}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Write the full article here…"
                className="w-full resize-y rounded-md border border-zinc-200 px-3 py-2.5 text-sm leading-relaxed text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* SEO */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-zinc-900">
                <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                SEO
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Meta title
                  </label>
                  <input
                    type="text"
                    value={form.metaTitle || form.title}
                    onChange={(e) => set("metaTitle", e.target.value)}
                    className="w-full rounded-md border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">
                    {(form.metaTitle || form.title).length}/60
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Meta description
                  </label>
                  <textarea
                    rows={2}
                    value={form.metaDescription || form.excerpt}
                    onChange={(e) => set("metaDescription", e.target.value)}
                    className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">
                    {(form.metaDescription || form.excerpt).length}/160
  </p>
                </div>
              </div>

              {/* Search preview */}
              {form.title && (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Google preview
                  </p>
                  <p className="truncate text-sm font-medium text-blue-700">
                    {form.metaTitle || form.title} — Nexora
                  </p>
                  <p className="font-mono text-[11px] text-emerald-700">
                    nexora.com/articles/{form.slug || "your-slug"}
                  </p>
                  <p className="line-clamp-2 text-xs text-zinc-500">
                    {form.metaDescription || form.excerpt || "No description set."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-5">

            {/* Publish settings */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-display text-sm font-semibold text-zinc-900">Publish</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as ArticleStatus)}
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Author
                  </label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    placeholder="Author name"
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || !form.title || !form.body}
                  className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Publish now"}
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full rounded-md border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
                >
                  Save as draft
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-display text-sm font-semibold text-zinc-900">Category</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => set("category", cat)}
                    className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ring-1 ${
                      form.category === cat
                        ? "bg-indigo-600 text-white ring-indigo-600"
                        : "bg-white text-zinc-500 ring-zinc-200 hover:ring-zinc-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured image */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-display text-sm font-semibold text-zinc-900">Featured Image</h3>

              {form.imagePreview ? (
                <div className="relative">
                  <img
                    src={form.imagePreview}
                    alt="Preview"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => set("imagePreview", null)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono text-xs">Click to upload</span>
                  <span className="font-mono text-[10px] text-zinc-400">PNG, JPG up to 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
