# Nexora

AI & Technology news platform — frontend (React + TypeScript + Tailwind CSS).

Built as the V1 MVP frontend for an AI/Tech news site, paired with a Spring Boot
backend and PostgreSQL database.

## Stack

- React 19 + Vite, written in TypeScript
- Tailwind CSS v4
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (metadata)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project structure

```
src/
  components/   shared UI pieces — Header, Tag, FeaturedArticle, ArticleRow, Footer
  pages/        top-level pages (Homepage, ArticlePage, Admin, ...)
  data/         placeholder data, shaped like the future API response
  types/        shared TypeScript types (Article, CategoryName, ...)
  lib/          small shared helpers (category-to-gradient mapping, etc.)
  App.tsx       app entry / routing
  main.tsx      React DOM mount
  index.css     Tailwind import + font setup
```

## Pages

- [x] Homepage — featured story, category filter, search, article feed
- [ ] Article page
- [ ] Admin login
- [ ] Admin article CRUD
- [ ] Category management

## Design system

- Colors: paper `#F7F8FA`, ink `#0B0F1A`, signal blue `#3D5AFE`, alert orange `#FF6B35`
- Category tags are color-coded: AI (violet), Security (red), Dev (green), Hardware (amber), Emerging (blue)
- Signature element: the "pulse line" — a thin blue bar that appears next to whichever
  article row is hovered or focused, reinforcing the "signal/feed" concept the whole
  layout is built around
- Selecting an article expands it in place — directly below where it sits in the
  feed — instead of opening elsewhere on the page or force-scrolling. The lead
  story slot at the top is independent of the feed and never reshuffles when a
  reader opens a row below it. Once the feed holds dozens of stories, that's the
  difference between "expand and keep reading" and "lose your spot and scroll
  back to find it."

## Backend

Not included in this repo. Expected to be a separate Spring Boot + PostgreSQL service
exposing a REST API (e.g. `/api/articles`, `/api/categories`). Replace `ARTICLES` in
`src/data/articles.ts` with a fetch against that API once it's live — `Article` in
`src/types/index.ts` is already shaped to match the planned DTO.
