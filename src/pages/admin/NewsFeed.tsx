import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchGmailNewsBySenders, type GmailFetchedEmail } from "../../lib/newsFeed";

interface Sender {
  id: string;
  name: string;
  handle: string;
}

const SENDERS_STORAGE_KEY = "nexora-news-senders";

const DEFAULT_SENDERS: Sender[] = [
  { id: crypto.randomUUID(), name: "OpenAI", handle: "@openai.com" },
  { id: crypto.randomUUID(), name: "TechCrunch", handle: "@techcrunch.com" },
];

/** Reads the persisted sender list from localStorage. Falls back to the
 * built-in defaults if nothing is stored yet, or if the stored value is
 * missing/corrupt — this must never throw, since it runs during initial
 * render. */
function loadStoredSenders(): Sender[] {
  try {
    const raw = window.localStorage.getItem(SENDERS_STORAGE_KEY);
    if (!raw) return DEFAULT_SENDERS;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (s) => s && typeof s.id === "string" && typeof s.name === "string" && typeof s.handle === "string"
      )
    ) {
      return parsed as Sender[];
    }
    return DEFAULT_SENDERS;
  } catch {
    return DEFAULT_SENDERS;
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function NewsFeed() {
  const [senders, setSenders] = useState<Sender[]>(() => loadStoredSenders());
  const [showSenders, setShowSenders] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [formError, setFormError] = useState("");

  const [emails, setEmails] = useState<GmailFetchedEmail[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await fetchGmailNewsBySenders(senders.map((s) => s.handle));
      setEmails(result);
      setLastFetched(new Date());
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }, [senders]);

  // Initial load only — re-fetching on every sender edit would fire a live
  // Gmail query per keystroke/add/remove. The explicit "Fetch news" button
  // (and re-opening this page) is the trigger, matching the prototype.
  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSender = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    const handle = handleInput.trim();

    if (!name || !handle) {
      setFormError("Enter both a name and an email or domain.");
      return;
    }
    if (!handle.includes("@")) {
      setFormError("Email or domain should include an @, e.g. @openai.com");
      return;
    }
    setSenders((prev) => [...prev, { id: crypto.randomUUID(), name, handle }]);
    setNameInput("");
    setHandleInput("");
    setFormError("");
  };

  const removeSender = (id: string) => {
    setSenders((prev) => prev.filter((s) => s.id !== id));
  };

  // Persist to localStorage on every add/remove so the list survives a
  // refresh. Wrapped in try/catch: storage can be unavailable (private
  // browsing, quota exceeded) and that must never crash the page.
  useEffect(() => {
    try {
      window.localStorage.setItem(SENDERS_STORAGE_KEY, JSON.stringify(senders));
    } catch {
      // Non-fatal: worst case the list just won't persist this time.
    }
  }, [senders]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <AdminLayout title="News Feed">

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[13px] font-semibold uppercase tracking-widest text-zinc-400">
          News feed
        </h2>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="font-mono text-xs text-zinc-400">
              updated {formatTime(lastFetched)}
            </span>
          )}
          <button
            onClick={() => setShowSenders(true)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Manage senders ({senders.length})
          </button>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Fetching…" : "Fetch news"}
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Gmail-style list */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {emails.length} item{emails.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading && emails.length === 0 && !fetchError ? (
          <div className="py-16 text-center font-mono text-sm text-zinc-400">Loading emails…</div>
        ) : emails.length === 0 && !fetchError ? (
          <div className="py-16 text-center font-mono text-sm text-zinc-400">
            No emails found for the current senders.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {emails.map((email) => {
              const expanded = expandedId === email.id;
              return (
                <li key={email.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onClick={() => toggleExpand(email.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(email.id);
                      }
                    }}
                    className="flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-zinc-50"
                  >
                    <svg
                      className={`mt-1 h-3.5 w-3.5 flex-shrink-0 text-zinc-400 transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="truncate text-sm font-semibold text-zinc-900">{email.sender}</p>
                        <p className="truncate text-sm text-zinc-500">{email.subject}</p>
                      </div>

                      {expanded && (
                        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-sm leading-relaxed text-zinc-600">{email.snippet}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Manage senders modal */}
      {showSenders && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setShowSenders(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-zinc-900">Manage senders</h3>
              <button
                onClick={() => setShowSenders(false)}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={addSender} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="OpenAI"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Email or domain
                </label>
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="@openai.com"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Add sender
              </button>
            </form>

            {senders.length === 0 ? (
              <p className="mt-4 py-6 text-center font-mono text-sm text-zinc-400">
                No senders yet. Add one above.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
                {senders.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-700">{s.name}</p>
                      <p className="truncate font-mono text-xs text-zinc-400">{s.handle}</p>
                    </div>
                    <button
                      onClick={() => removeSender(s.id)}
                      className="flex-shrink-0 font-mono text-xs font-medium text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
