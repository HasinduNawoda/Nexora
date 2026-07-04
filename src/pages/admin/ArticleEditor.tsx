import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ArticleBody from "../../components/ArticleBody";
import type { CategoryName, ArticleStatus, ContentBlock } from "../../types";
import { getArticle, saveArticle } from "../../lib/store";

const CATEGORIES: CategoryName[] = ["AI", "Security", "Dev", "Hardware", "Emerging"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function wordCount(blocks: ContentBlock[]) {
  return blocks
    .filter((b): b is Extract<ContentBlock, { text: string }> => "text" in b)
    .reduce((sum, b) => sum + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0);
}

function readTime(blocks: ContentBlock[]) {
  return Math.max(1, Math.ceil(wordCount(blocks) / 200));
}

function newBlock(type: ContentBlock["type"]): ContentBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "heading":
      return { id, type, text: "" };
    case "paragraph":
      return { id, type, text: "" };
    case "image":
      return { id, type, url: "", caption: "" };
    case "video":
      return { id, type, source: "youtube", url: "", caption: "" };
    case "audio":
      return { id, type, url: "", caption: "" };
  }
}

/** Accepts a full YouTube URL (watch, youtu.be, shorts) or an already-embed URL and normalizes to an embeddable one. */
function toYoutubeEmbed(input: string): string | null {
  try {
    const url = new URL(input.trim());
    let id = "";
    if (url.hostname.includes("youtu.be")) id = url.pathname.slice(1);
    else if (url.pathname.startsWith("/embed/")) return input.trim();
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? "";
    else id = url.searchParams.get("v") ?? "";
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface FormState {
  title: string;
  slug: string;
  slugEdited: boolean;
  category: CategoryName;
  excerpt: string;
  blocks: ContentBlock[];
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
  blocks: [{ id: crypto.randomUUID(), type: "paragraph", text: "" }],
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the existing article's content into the editor when editing.
  useEffect(() => {
    if (!isEdit || !id) return;
    const existing = getArticle(Number(id));
    if (!existing) return;
    setForm({
      title: existing.title,
      slug: existing.slug || "",
      slugEdited: true,
      category: existing.category,
      excerpt: existing.excerpt,
      blocks: existing.content.length ? existing.content : [{ id: crypto.randomUUID(), type: "paragraph", text: "" }],
      author: existing.author || "",
      metaTitle: existing.metaTitle || "",
      metaDescription: existing.metaDescription || "",
      status: existing.status || "DRAFT",
      imagePreview: existing.imagePath || null,
    });
  }, [isEdit, id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: f.slugEdited ? f.slug : slugify(value),
    }));
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    set("imagePreview", url);
  };

  // --- Block editing helpers ---

  const updateBlock = (blockId: string, patch: Partial<ContentBlock>) => {
    setForm((f) => ({
      ...f,
      blocks: f.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as ContentBlock) : b)),
    }));
  };

  const removeBlock = (blockId: string) => {
    setForm((f) => ({ ...f, blocks: f.blocks.filter((b) => b.id !== blockId) }));
  };

  const insertBlockAfter = (afterId: string | "start", type: ContentBlock["type"]) => {
    setForm((f) => {
      const block = newBlock(type);
      if (afterId === "start") return { ...f, blocks: [block, ...f.blocks] };
      const idx = f.blocks.findIndex((b) => b.id === afterId);
      const blocks = [...f.blocks];
      blocks.splice(idx + 1, 0, block);
      return { ...f, blocks };
    });
  };

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    setForm((f) => {
      const idx = f.blocks.findIndex((b) => b.id === blockId);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= f.blocks.length) return f;
      const blocks = [...f.blocks];
      [blocks[idx], blocks[swapWith]] = [blocks[swapWith], blocks[idx]];
      return { ...f, blocks };
    });
  };

  const handleBlockFileUpload = async (blockId: string, file: File, kind: "image" | "video" | "audio") => {
    // Images are small enough to persist as data URLs. Video/audio files
    // are typically too large for localStorage (~5MB cap), so they're kept
    // as session-only object URLs — they'll preview and publish now, but
    // won't survive a page refresh until real file storage (S3/backend
    // upload) exists. That limitation is surfaced in the UI below.
    if (kind === "image") {
      const dataUrl = await readFileAsDataUrl(file);
      updateBlock(blockId, { url: dataUrl } as Partial<ContentBlock>);
    } else {
      const objectUrl = URL.createObjectURL(file);
      updateBlock(blockId, { url: objectUrl } as Partial<ContentBlock>);
    }
  };

  const handleSave = async (publishNow?: boolean) => {
    setError(null);
    setSaving(true);
    const status: ArticleStatus = publishNow ? "PUBLISHED" : form.status;

    try {
      const savedArticle = saveArticle({
        id: isEdit && id ? Number(id) : undefined,
        title: form.title,
        slug: form.slug,
        category: form.category,
        excerpt: form.excerpt,
        content: form.blocks,
        author: form.author,
        status,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        imagePath: form.imagePreview,
      });
      set("status", status);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (publishNow) navigate("/admin/articles");
      else if (!isEdit) navigate(`/admin/articles/${savedArticle.id}/edit`, { replace: true });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Couldn't save the article.");
    }
  };

  const wc = wordCount(form.blocks);
  const rt = readTime(form.blocks);
  const hasBody = form.blocks.some((b) => ("text" in b && b.text.trim()) || ("url" in b && b.url));

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
            disabled={saving || !form.title || !hasBody}
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
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
              <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">{form.excerpt.length}/160</p>
            </div>

            {/* Block-based body */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Content <span className="text-red-500">*</span>
                </label>
                <span className="font-mono text-[11px] text-zinc-400">
                  {wc} words · {rt} min read
                </span>
              </div>

              <p className="mb-4 text-xs text-zinc-400">
                Write a paragraph, then use "+" to drop in a heading, image, video, or audio wherever you need it —
                then keep writing below it.
              </p>

              <BlockInserter onPick={(type) => insertBlockAfter("start", type)} label="Add block at top" />

              <div className="space-y-3">
                {form.blocks.map((block, idx) => (
                  <div key={block.id} className="group/block">
                    <BlockEditorRow
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                      onRemove={() => removeBlock(block.id)}
                      onMoveUp={idx > 0 ? () => moveBlock(block.id, -1) : undefined}
                      onMoveDown={idx < form.blocks.length - 1 ? () => moveBlock(block.id, 1) : undefined}
                      onUploadFile={(file, kind) => handleBlockFileUpload(block.id, file, kind)}
                    />
                    <BlockInserter onPick={(type) => insertBlockAfter(block.id, type)} label="Add block here" />
                  </div>
                ))}
              </div>

              {form.blocks.some((b) => "url" in b && b.url) && (
                <div className="mt-6 border-t border-zinc-100 pt-4">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400">Preview</p>
                  <ArticleBody blocks={form.blocks} />
                </div>
              )}
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

              {form.title && (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">Google preview</p>
                  <p className="truncate text-sm font-medium text-blue-700">{form.metaTitle || form.title} — Nexora</p>
                  <p className="font-mono text-[11px] text-emerald-700">nexora.com/articles/{form.slug || "your-slug"}</p>
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
                  disabled={saving || !form.title || !hasBody}
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
                  <img src={form.imagePreview} alt="Preview" className="h-36 w-full rounded-lg object-cover" />
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
                onChange={handleFeaturedImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/** The row of small "+" buttons that lets you insert a new block type at a specific point in the article. */
function BlockInserter({ onPick, label }: { onPick: (type: ContentBlock["type"]) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const options: { type: ContentBlock["type"]; label: string; icon: string }[] = [
    { type: "heading", label: "Heading", icon: "H" },
    { type: "paragraph", label: "Text", icon: "¶" },
    { type: "image", label: "Image", icon: "🖼" },
    { type: "video", label: "Video", icon: "▶" },
    { type: "audio", label: "Audio", icon: "♪" },
  ];

  if (!open) {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={label}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 opacity-0 transition-opacity hover:border-indigo-400 hover:text-indigo-600 group-hover/block:opacity-100 focus:opacity-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="my-1 flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5">
      {options.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => {
            onPick(opt.type);
            setOpen(false);
          }}
          className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-600 shadow-sm ring-1 ring-zinc-200 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200"
        >
          <span aria-hidden="true">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-md px-2 py-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-600"
      >
        Cancel
      </button>
    </div>
  );
}

/** Renders the editing UI for one block, switching on its type. */
function BlockEditorRow({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUploadFile,
}: {
  block: ContentBlock;
  onChange: (patch: Partial<ContentBlock>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUploadFile: (file: File, kind: "image" | "video" | "audio") => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const chrome = (content: React.ReactNode, badge: string) => (
    <div className="relative rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">{badge}</span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} title="Move up" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} title="Move down" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button type="button" onClick={onRemove} title="Remove" className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {content}
    </div>
  );

  if (block.type === "heading") {
    return chrome(
      <input
        type="text"
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Section heading…"
        className="w-full rounded-md border border-zinc-200 px-3 py-2 font-display text-base font-semibold text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />,
      "Heading"
    );
  }

  if (block.type === "paragraph") {
    return chrome(
      <textarea
        rows={4}
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Write a paragraph…"
        className="w-full resize-y rounded-md border border-zinc-200 px-3 py-2 text-sm leading-relaxed text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />,
      "Text"
    );
  }

  if (block.type === "image") {
    return chrome(
      <div className="space-y-2">
        {block.url ? (
          <div className="relative">
            <img src={block.url} alt="" className="max-h-64 w-full rounded-md object-cover" />
            <button
              type="button"
              onClick={() => onChange({ url: "" })}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-28 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-400 hover:border-indigo-400 hover:text-indigo-600"
          >
            Click to upload an image
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file, "image");
          }}
        />
        <input
          type="text"
          value={block.caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full rounded-md border border-zinc-200 px-3 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500"
        />
      </div>,
      "Image"
    );
  }

  if (block.type === "video") {
    return chrome(
      <div className="space-y-2">
        <div className="flex gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1">
          {(["youtube", "upload"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ source: s, url: "" })}
              className={`flex-1 rounded px-2 py-1 font-mono text-xs capitalize transition-colors ${
                block.source === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {s === "youtube" ? "YouTube link" : "Upload file"}
            </button>
          ))}
        </div>

        {block.source === "youtube" ? (
          <input
            type="text"
            defaultValue={block.url}
            onBlur={(e) => {
              const embed = toYoutubeEmbed(e.target.value);
              onChange({ url: embed || e.target.value });
            }}
            placeholder="Paste a YouTube URL (e.g. https://youtube.com/watch?v=…)"
            className="w-full rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        ) : block.url ? (
          <video src={block.url} controls className="max-h-64 w-full rounded-md" />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-28 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-400 hover:border-indigo-400 hover:text-indigo-600"
          >
            Click to upload a video from your computer
          </button>
        )}
        {block.source === "upload" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file, "video");
              }}
            />
            <p className="font-mono text-[10px] text-amber-600">
              Note: uploaded video previews for this session but won't survive a refresh yet — that needs real file
              storage on the backend. Use a YouTube link for anything that must persist today.
            </p>
          </>
        )}
        <input
          type="text"
          value={block.caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full rounded-md border border-zinc-200 px-3 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500"
        />
      </div>,
      "Video"
    );
  }

  // audio
  return chrome(
    <div className="space-y-2">
      {block.url ? (
        <audio src={block.url} controls className="w-full" />
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-400 hover:border-indigo-400 hover:text-indigo-600"
        >
          Click to upload an audio file
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadFile(file, "audio");
        }}
      />
      <p className="font-mono text-[10px] text-amber-600">
        Note: uploaded audio previews for this session but won't survive a refresh yet — that needs real file storage
        on the backend.
      </p>
      <input
        type="text"
        value={block.caption || ""}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full rounded-md border border-zinc-200 px-3 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:border-indigo-500"
      />
    </div>,
    "Audio"
  );
}
