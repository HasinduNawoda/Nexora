import { Link } from "react-router-dom";
import { CATEGORIES } from "../types";
import { SITE, SOCIAL_LINKS, CONTACT_LINKS } from "../lib/siteConfig";

// Simplified, generic glyphs (not exact brand marks) — enough to be
// instantly recognizable without reproducing anyone's trademarked logo art.
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.97 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16.6 2h-3.2v13.6a2.9 2.9 0 11-2.9-2.9c.27 0 .53.03.78.09V9.5a6.1 6.1 0 00-.78-.05A6.1 6.1 0 1016.6 15.5V8.3a8.3 8.3 0 004.9 1.6V6.7a5.1 5.1 0 01-4.9-4.7z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M21.6 7.2a2.9 2.9 0 00-2-2C17.9 4.7 12 4.7 12 4.7s-5.9 0-7.6.5a2.9 2.9 0 00-2 2A30 30 0 002 12a30 30 0 00.4 4.8 2.9 2.9 0 002 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.9 2.9 0 002-2A30 30 0 0022 12a30 30 0 00-.4-4.8zM9.8 15.3V8.7l5.7 3.3z" />
    </svg>
  );
}

const SOCIALS = [
  { key: "facebook", label: "Facebook", url: SOCIAL_LINKS.facebook, Icon: FacebookIcon },
  { key: "instagram", label: "Instagram", url: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", url: SOCIAL_LINKS.tiktok, Icon: TikTokIcon },
  { key: "youtube", label: "YouTube", url: SOCIAL_LINKS.youtube, Icon: YouTubeIcon },
].filter((s) => s.url.trim() !== "");

const CATEGORY_LINKS = CATEGORIES.filter((c) => c !== "All");

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-[#0B0F1A] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Brand + social */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3D5AFE]" aria-hidden="true" />
              <span className="font-display text-lg font-bold text-white">
                NEX<span className="text-[#3D5AFE]">ORA</span>
              </span>
            </Link>
            <p className="mt-2 font-mono text-xs text-slate-500">{SITE.tagline}</p>
          </div>

          {SOCIALS.length > 0 && (
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ key, label, url, Icon }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-[#3D5AFE] hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="my-8 border-t border-slate-800" />

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {CATEGORY_LINKS.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/?category=${cat}`}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
              Company
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-sm text-slate-300 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href={CONTACT_LINKS.email}
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  Email
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
              Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/privacy" className="text-sm text-slate-300 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-300 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 border-t border-slate-800" />

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-3 font-mono text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
