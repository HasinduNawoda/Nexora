// Used for thumbnail/cover placeholders until real featured images come
// from the backend (article.imagePath).
// Keyed by category name for the 5 starter categories. Admins can create
// additional categories at runtime (see CategoryManager), so lookups here
// fall back to a neutral style rather than assuming one of these 5 exists.
const GRADIENT_MAP: Record<string, string> = {
  AI: "from-violet-600 to-indigo-900",
  Security: "from-red-600 to-rose-900",
  Dev: "from-green-600 to-emerald-900",
  Hardware: "from-amber-500 to-orange-900",
  Emerging: "from-blue-600 to-slate-900",
};
const DEFAULT_GRADIENT = "from-zinc-600 to-zinc-900";

const STYLE_MAP: Record<string, string> = {
  AI: "text-violet-700 bg-violet-50 ring-violet-200",
  Security: "text-red-700 bg-red-50 ring-red-200",
  Dev: "text-green-800 bg-green-50 ring-green-200",
  Hardware: "text-amber-800 bg-amber-50 ring-amber-200",
  Emerging: "text-blue-800 bg-blue-50 ring-blue-200",
};
const DEFAULT_STYLE = "text-zinc-700 bg-zinc-50 ring-zinc-200";

export const CATEGORY_GRADIENT = new Proxy(GRADIENT_MAP, {
  get: (target, prop: string) => target[prop] ?? DEFAULT_GRADIENT,
});

export const CATEGORY_STYLES = new Proxy(STYLE_MAP, {
  get: (target, prop: string) => target[prop] ?? DEFAULT_STYLE,
});
