import type { CategoryName } from "../types";
import { CATEGORY_STYLES } from "../lib/categoryStyles";

interface TagProps {
  category: CategoryName;
}

export default function Tag({ category }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wide ring-1 ${CATEGORY_STYLES[category]}`}
    >
      {category}
    </span>
  );
}
