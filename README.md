# AOYO — Archive of Your Own

A local-first writing application inspired by [Archive of Our Own](https://archiveofourown.org). Built for academic and creative writing with citations, math typesetting, and multi-format export. No server, no accounts — your data stays in your browser.

## Features

- **Rich text editor** — TipTap-based WYSIWYG with full formatting toolbar (bold, italic, headings, lists, tables, images, code blocks)
- **Academic writing** — KaTeX math equations (inline & block), bibliography management, citations with APA 7th and OSCOLA styles
- **Research library** — Search papers via OpenAlex, manage PDFs, track source references in your text
- **Multi-format export** — Markdown, HTML, LaTeX, Word (.docx), PDF (print-to-PDF)
- **Word import** — Import .docx files directly into the editor
- **Three editor views** — Edit (WYSIWYG), LaTeX source, and reading preview
- **Local-first storage** — SQLite via OPFS (sqlocal) — all data lives in your browser
- **AO3-inspired UI** — Tagging system, work metadata, filtering, familiar layout and typography
- **Save points** — Manual snapshots with history, restore, and auto-pruning (max 50 per chapter)
- **Backup & restore** — Full database backup/restore from the tools menu

## Quick Start

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)

```bash
git clone https://github.com/aoyo-writer/aoyo.git
cd aoyo
bun install    # or: npm install
bun run dev    # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Tech Stack

[React 19](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite 8](https://vite.dev) · [MUI 7](https://mui.com) · [TipTap 3](https://tiptap.dev) · [SQLite (sqlocal)](https://github.com/nicksenger/sqlocal) · [KaTeX](https://katex.org) · [CodeMirror 6](https://codemirror.net)

## Project Structure

```
src/
├── components/
│   ├── Layout/           # Header, Footer
│   ├── WorkEditor/       # Editor page, toolbar, bibliography, citations,
│   │                       save points, LaTeX view, preview
│   ├── WorkListing/      # Work listing, filters, blurb cards
│   └── tools/            # Research library, PDF tools, backup, diagnostics
├── db/
│   ├── sqlite.ts         # SQLite instance + schema
│   ├── useWorks.ts       # All CRUD operations + reactive hooks
│   └── migrate.ts        # One-time Dexie → SQLite migration
├── extensions/           # TipTap extensions (math, citations, source refs)
├── hooks/                # Custom React hooks
└── utils/                # Export, import, citation formatting, API clients
```

## Development

```bash
bun run dev       # Start dev server
bun run build     # Type-check + production build
bun run lint      # Run ESLint
bun run preview   # Preview production build locally
```

### NixOS

All commands need to run through nix-shell:

```bash
nix-shell -p bun --run "bun run dev"
```

### Architecture Notes

- **Database**: SQLite via [sqlocal](https://github.com/nicksenger/sqlocal) using the OPFS backend. Schema is created in `src/db/sqlite.ts` via `onInit`. JSON columns for arrays, INTEGER for booleans, BLOB for PDFs. Foreign keys use `ON DELETE CASCADE`.
- **Editor extensions**: All TipTap extensions are registered in `src/extensions/index.ts`. Custom extensions include inline math, block math, citations, and source reference marks.
- **COEP headers**: Required by sqlocal for SharedArrayBuffer access. The sqlocal Vite plugin handles this automatically in dev. For production deployment, your host must serve pages with `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers.
- **Citation styles**: APA 7th and OSCOLA are implemented. Style is set per-work and propagated via React Context through TipTap NodeViews.
- **External APIs**: Paper search uses [OpenAlex](https://openalex.org) (no API key required). DOI verification uses [CrossRef](https://www.crossref.org) (no API key required).

## Deployment

AOYO is a static site. Build with `bun run build` and deploy the `dist/` directory to any static host.

### GitHub Pages

This repo includes a GitHub Actions workflow that automatically deploys to GitHub Pages on push to `main`. The site is available at [https://aoyo-writer.github.io/aoyo](https://aoyo-writer.github.io/aoyo).

### COEP Headers

sqlocal requires specific HTTP headers for SharedArrayBuffer. Most static hosts handle this differently:

- **GitHub Pages** — Use the sqlocal service worker shim (included in build)
- **Cloudflare Pages** — Add a `_headers` file
- **Vercel** — Add headers in `vercel.json`
- **Nginx** — Add `add_header` directives

See [sqlocal deployment docs](https://github.com/nicksenger/sqlocal#deployment) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style guidelines, and how to submit changes.

## Acknowledgments

- Design inspired by [Archive of Our Own](https://archiveofourown.org) (AO3). **Not affiliated with the Organization for Transformative Works.**
- Built with [TipTap](https://tiptap.dev), [MUI](https://mui.com), [sqlocal](https://github.com/nicksenger/sqlocal), [KaTeX](https://katex.org), and many other open-source projects.

## License

[MIT](LICENSE)
