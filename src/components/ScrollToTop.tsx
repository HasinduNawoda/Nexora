import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation (unlike
// traditional multi-page sites), so without this, clicking a footer link
// while scrolled down leaves the reader stranded mid-page on the new
// content with no obvious way to tell it's a new page/filter.
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}