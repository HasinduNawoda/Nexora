// Single source of truth for articles across the whole app (public site +
// admin). Every page — Homepage, ArticleList, AdminDashboard, ArticleEditor
// — reads and writes through this module instead of keeping its own copy.
//
// THIS IS A STAND-IN FOR THE REAL BACKEND. It persists to localStorage so
// the CMS actually works end-to-end today (create/edit/delete/publish all
// survive a refresh), but it is intentionally written as a thin API-shaped
// wrapper: getArticles/saveArticle/deleteArticle. When the Spring Boot API
// exists, swap the bodies of these functions for `fetch("/api/articles")`
// calls and nothing else in the app needs to change.
//
// Known limitation: localStorage caps out around 5MB per origin. Large
// uploaded video/audio files are stored as object URLs that only last for
// the current browser session (see ArticleEditor) rather than being
// persisted, because there is no real file storage yet. Images are small
// enough to persist as data URLs. This is called out in the editor UI.

import type { Article, ContentBlock } from "../types";

const STORAGE_KEY = "nexora_articles_v1";

// Fires whenever the store changes so any mounted component (e.g. the
// homepage open in another tab, or a dashboard stat card) can re-read.
const CHANGE_EVENT = "nexora-articles-changed";

function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function textBlock(text: string): ContentBlock {
  return { id: crypto.randomUUID(), type: "paragraph", text };
}

// Seed data — same articles that used to be hardcoded in three different
// files. Now they live in exactly one place and are loaded into storage
// once, the first time the app runs.
const SEED_ARTICLES: Article[] = [
  {
    id: 1, index: "01", category: "AI",
    title: "Inside the architecture choices behind the next wave of small language models",
    slug: "architecture-choices-small-language-models",
    excerpt: "Why teams are trading raw parameter count for retrieval, tool use, and tighter context — and what that means for anyone shipping AI features in 2026.",
    content: [
      textBlock("The headline number on a model card used to be parameter count. That's no longer the metric teams optimize for. The newest generation of small language models — in the 1B to 8B range — are closing the gap with much larger predecessors by leaning on retrieval, structured tool calls, and longer effective context rather than raw scale."),
      textBlock("That shift changes what 'shipping AI' looks like day to day. Instead of choosing the biggest model your budget allows, teams are increasingly choosing the smallest model that can reliably call the right tool at the right time, then leaning on retrieval to fill in anything the model itself doesn't know."),
      textBlock("The practical upshot for anyone building product features in 2026: latency and cost both drop sharply, but the engineering burden moves elsewhere — into retrieval quality, tool schemas, and evaluation harnesses that catch silent failures before they reach users."),
    ],
    author: "Maya Lindqvist", date: "Jun 29, 2026", readTime: "6 min", views: "12.4k", featured: true, status: "PUBLISHED",
  },
  {
    id: 2, index: "02", category: "Security",
    title: "A new class of supply-chain attack is hiding inside CI/CD caching layers",
    slug: "supply-chain-attack-cicd-caching",
    excerpt: "Researchers disclose a technique that poisons build caches rather than packages themselves, evading most existing dependency-scanning tools.",
    content: [
      textBlock("Most dependency-scanning tools watch the package registry. A technique disclosed this week sidesteps that entirely by targeting the build cache layer that CI/CD systems use to speed up repeated builds — a layer almost nothing currently audits."),
      textBlock("Because the poisoned artifact never touches the public registry, signature checks and registry-level scanning both pass clean. The attack only surfaces once a build pulls a cached layer that was tampered with during a prior run, which makes it both quiet and hard to reproduce."),
      textBlock("Mitigation guidance so far centers on treating build caches as a trust boundary: signing cache entries, scoping cache access per-repository, and rotating cache keys on a schedule rather than relying on default CI provider behavior."),
    ],
    author: "Devon Okafor", date: "Jun 29, 2026", readTime: "4 min", views: "8.1k", status: "PUBLISHED",
  },
  {
    id: 3, index: "03", category: "Dev",
    title: "Spring Boot 4 quietly changed how it handles virtual threads — here's what breaks",
    slug: "spring-boot-4-virtual-threads",
    excerpt: "A practical migration guide for teams moving high-throughput services onto the new default executor model.",
    content: [
      textBlock("Spring Boot 4 switches the default request-handling executor to virtual threads, which sounds like a free performance win until you hit the handful of patterns that quietly assumed platform threads — particularly ThreadLocal-heavy security contexts and connection pools tuned for a fixed thread count."),
      textBlock("The most common breakage teams are reporting is connection pool exhaustion: pools sized for a small number of platform threads get overwhelmed once thousands of virtual threads can be in flight simultaneously, even though each one is individually cheap."),
      textBlock("The migration path that's worked well in practice: audit anything using ThreadLocal for request state, move it to context propagation utilities instead, and re-tune pool sizes against actual concurrent load rather than thread count."),
    ],
    author: "Priya Raman", date: "Jun 28, 2026", readTime: "7 min", views: "5.6k", status: "PUBLISHED",
  },
  {
    id: 4, index: "04", category: "Hardware",
    title: "On-device inference chips are getting cheap enough to matter for indie developers",
    slug: "on-device-inference-chips-indie",
    excerpt: "A look at the new generation of sub-$50 NPUs and what they unlock for offline-first mobile apps.",
    content: [
      textBlock("A wave of new NPU modules has crossed the $50 price point this year, putting on-device inference within reach of small teams who previously had no realistic path to it outside flagship phone hardware."),
      textBlock("For offline-first apps — field tools, accessibility software, anything that can't assume a connection — that price drop matters more than the raw performance numbers. It's now plausible to ship a local model as a default feature rather than a premium add-on."),
      textBlock("The catch is tooling: quantization and deployment workflows for these chips are still fragmented across vendors, so teams should expect to spend real time on the conversion pipeline before celebrating the hardware savings."),
    ],
    author: "Tom Whitfield", date: "Jun 27, 2026", readTime: "5 min", views: "3.9k", status: "DRAFT",
  },
  {
    id: 5, index: "05", category: "Emerging",
    title: "What 'agentic' actually means once you strip the marketing away",
    slug: "what-agentic-actually-means",
    excerpt: "A grounded technical breakdown of planning, memory, and tool-calling loops — and where today's agents still fall over.",
    content: [
      textBlock("Strip away the marketing and an 'agent' is just a loop: the model plans a step, calls a tool, reads the result, and decides what to do next. Everything else — memory, multi-agent orchestration, autonomy levels — is built on top of that basic loop."),
      textBlock("Where today's agents still fall over is mostly the same handful of places: losing track of long-running goals across many tool calls, recovering badly from a tool returning an unexpected error, and overestimating how much it actually accomplished in a given step."),
      textBlock("The teams shipping agents successfully right now tend to keep the loop short and heavily instrumented, rather than chasing fully autonomous long-horizon behavior — reliability beats ambition for anything customer-facing."),
    ],
    author: "Maya Lindqvist", date: "Jun 26, 2026", readTime: "9 min", views: "15.2k", status: "PUBLISHED",
  },
  {
    id: 6, index: "06", category: "Dev",
    title: "Why typed APIs are winning the argument against REST-by-convention",
    slug: "typed-apis-vs-rest-by-convention",
    excerpt: "A look at how contract-first tooling is changing the default starting point for new backend services.",
    content: [
      textBlock("REST-by-convention always relied on documentation staying in sync with the code, and it usually didn't. Contract-first tooling flips that: the schema is the source of truth, and both client and server types are generated from it."),
      textBlock("That shift is becoming the default starting point for new services rather than an opt-in extra, mostly because it eliminates a whole category of integration bugs before they happen, and the codegen tooling has gotten good enough to stop being a chore."),
      textBlock("The trade-off teams are weighing is flexibility: a strict contract is harder to evolve casually, which is a feature for stability but friction during early-stage product iteration."),
    ],
    author: "Priya Raman", date: "Jun 25, 2026", readTime: "5 min", views: "4.2k", status: "PUBLISHED",
  },
  {
    id: 7, index: "07", category: "Security",
    title: "Passkeys cleared their last major adoption hurdle this quarter",
    slug: "passkeys-cross-device-sync",
    excerpt: "Cross-device sync finally works reliably across major platforms — here's what that unlocks for teams still on passwords.",
    content: [
      textBlock("The biggest blocker to passkey adoption was never the cryptography — it was the experience of losing access when you switched devices. Cross-platform sync has now matured to the point where that failure mode is rare rather than common."),
      textBlock("For teams still running password-only auth, that removes the last credible objection to migration. The remaining work is mostly UX: giving users a clear fallback path and not assuming every user's device ecosystem looks the same."),
      textBlock("Early adopters are reporting meaningful drops in account-takeover support tickets, which is likely to accelerate adoption among teams that were waiting for real-world proof rather than vendor claims."),
    ],
    author: "Devon Okafor", date: "Jun 24, 2026", readTime: "4 min", views: "6.8k", status: "PUBLISHED",
  },
  {
    id: 8, index: "08", category: "AI",
    title: "Benchmark fatigue is real, and labs are starting to admit it",
    slug: "benchmark-fatigue-task-specific-evals",
    excerpt: "As leaderboard scores converge, researchers are leaning harder on task-specific evals that are far harder to game.",
    content: [
      textBlock("Leaderboard scores across major benchmarks have converged enough that small differences no longer tell you much about real-world capability, and several labs have started saying so publicly rather than continuing to lead with those numbers."),
      textBlock("The response has been a move toward task-specific evals built around actual product use cases, which are slower and more expensive to build but far harder to overfit to than a public benchmark."),
      textBlock("For teams evaluating models, the practical advice converging across the industry is consistent: build a small eval set from your own real traffic before trusting any public leaderboard to predict performance on your task."),
    ],
    author: "Tom Whitfield", date: "Jun 23, 2026", readTime: "8 min", views: "11.0k", status: "PUBLISHED",
  },
];

function readRaw(): Article[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES));
      return SEED_ARTICLES;
    }
    return JSON.parse(raw) as Article[];
  } catch {
    return SEED_ARTICLES;
  }
}

function writeRaw(articles: Article[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    notifyChange();
  } catch (err) {
    // Quota exceeded is the realistic failure mode here — usually caused by
    // an embedded video/audio data URL. Surface it instead of silently
    // dropping the save.
    throw new Error(
      "Couldn't save — the article is too large for browser storage (usually an embedded video/audio file). " +
        "Try a YouTube link instead of uploading video, or a smaller image."
    );
  }
}

export function getArticles(): Article[] {
  return readRaw().sort((a, b) => b.id - a.id);
}

export function getArticle(id: number): Article | undefined {
  return readRaw().find((a) => a.id === id);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return readRaw().find((a) => a.slug === slug);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function uniqueSlug(base: string, existing: Article[], ignoreId?: number) {
  const taken = new Set(existing.filter((a) => a.id !== ignoreId).map((a) => a.slug));
  let candidate = base || "untitled";
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

export interface ArticleInput {
  id?: number;
  title: string;
  slug?: string;
  category: Article["category"];
  excerpt: string;
  content: ContentBlock[];
  author?: string;
  status: Article["status"];
  metaTitle?: string;
  metaDescription?: string;
  imagePath?: string | null;
}

function wordCount(blocks: ContentBlock[]) {
  return blocks
    .filter((b): b is Extract<ContentBlock, { text: string }> => "text" in b)
    .reduce((sum, b) => sum + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0);
}

/** Creates a new article, or updates an existing one if `input.id` is set. Always persists. */
export function saveArticle(input: ArticleInput): Article {
  const all = readRaw();
  const rt = Math.max(1, Math.ceil(wordCount(input.content) / 200));

  if (input.id) {
    const existing = all.find((a) => a.id === input.id);
    if (!existing) throw new Error("Article not found");
    const updated: Article = {
      ...existing,
      title: input.title,
      slug: input.slug ? uniqueSlug(slugify(input.slug), all, input.id) : existing.slug,
      category: input.category,
      excerpt: input.excerpt,
      content: input.content,
      author: input.author,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      imagePath: input.imagePath ?? existing.imagePath,
      readTime: `${rt} min`,
    };
    writeRaw(all.map((a) => (a.id === input.id ? updated : a)));
    return updated;
  }

  const nextId = all.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  const created: Article = {
    id: nextId,
    index: String(nextId).padStart(2, "0"),
    title: input.title,
    slug: uniqueSlug(slugify(input.slug || input.title), all),
    category: input.category,
    excerpt: input.excerpt,
    content: input.content,
    author: input.author,
    date: todayLabel(),
    readTime: `${rt} min`,
    views: "0",
    status: input.status,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    imagePath: input.imagePath ?? undefined,
  };
  writeRaw([...all, created]);
  return created;
}

export function deleteArticle(id: number): void {
  const all = readRaw();
  writeRaw(all.filter((a) => a.id !== id));
}
