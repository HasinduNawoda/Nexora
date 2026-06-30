import type { CategoryName } from "../types";

// Used for thumbnail/cover placeholders until real featured images come
// from the backend (article.imagePath).
export const CATEGORY_GRADIENT: Record<CategoryName, string> = {
  AI: "from-violet-600 to-indigo-900",
  Security: "from-red-600 to-rose-900",
  Dev: "from-green-600 to-emerald-900",
  Hardware: "from-amber-500 to-orange-900",
  Emerging: "from-blue-600 to-slate-900",
};

export const CATEGORY_STYLES: Record<CategoryName, string> = {
  AI: "text-violet-700 bg-violet-50 ring-violet-200",
  Security: "text-red-700 bg-red-50 ring-red-200",
  Dev: "text-green-800 bg-green-50 ring-green-200",
  Hardware: "text-amber-800 bg-amber-50 ring-amber-200",
  Emerging: "text-blue-800 bg-blue-50 ring-blue-200",
};
