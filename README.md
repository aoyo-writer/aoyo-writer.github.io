# AOYO — Archive of Your Own

So, this is a tool thingy that I wrote, cus my friend wants to write their essays in AO3 font, so, I made this silly lil site.

It's all local — there won't be any sync, and all your data will be on your machine. At least, it won't be shared to me, idk what your browser or ISP will do, but yeah.

I've also included a few handy tools for writing academic essays, so, feel free to use or not use. The design is LaTeX-centric, but you can use the Rich Text editor as well.

**Live site:** [aoyo-writer.github.io](https://aoyo-writer.github.io)

## What's in here

- Rich text editor with AO3-style formatting (or use the LaTeX source view if that's your thing)
- KaTeX math equations — inline and block
- Bibliography management with citations (APA 7th & OSCOLA)
- Paper search via OpenAlex, PDF management, source tracking
- Export to Markdown, HTML, LaTeX, Word (.docx), PDF
- Import from .docx
- Save points with history and restore
- All data stored locally in your browser (SQLite via OPFS)
- AO3-inspired UI — tags, work metadata, filtering, the whole vibe

## Getting started (for devs)

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)

```bash
git clone https://github.com/aoyo-writer/aoyo-writer.github.io.git
cd aoyo-writer.github.io
bun install    # or: npm install
bun run dev    # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

On NixOS:
```bash
nix-shell -p bun --run "bun run dev"
```

## Tech stack

[React 19](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite 8](https://vite.dev) · [MUI 7](https://mui.com) · [TipTap 3](https://tiptap.dev) · [SQLite (sqlocal)](https://github.com/DallasHoff/sqlocal) · [KaTeX](https://katex.org) · [CodeMirror 6](https://codemirror.net)

## Project structure

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

### Architecture notes

- **Database**: SQLite via [sqlocal](https://github.com/DallasHoff/sqlocal) using the OPFS backend. Schema is created in `src/db/sqlite.ts` via `onInit`. JSON columns for arrays, INTEGER for booleans, BLOB for PDFs. Foreign keys use `ON DELETE CASCADE`.
- **Editor extensions**: All TipTap extensions are registered in `src/extensions/index.ts`. Custom extensions include inline math, block math, citations, and source reference marks.
- **COEP headers**: Required by sqlocal for SharedArrayBuffer access. The sqlocal Vite plugin handles this in dev. For production, we use [mini-coi](https://github.com/WebReflection/mini-coi) to inject headers via service worker.
- **Citation styles**: APA 7th and OSCOLA are implemented. Style is set per-work and propagated via React Context through TipTap NodeViews.
- **External APIs**: Paper search uses [OpenAlex](https://openalex.org) (no API key required). DOI verification uses [CrossRef](https://www.crossref.org) (no API key required).

## Deployment

AOYO is a static site. Build with `bun run build` and deploy the `dist/` directory to any static host. This repo includes a GitHub Actions workflow that auto-deploys to GitHub Pages on push to `main`.

## Acknowledgments

Thank you to all the open-sourced tools that allowed me to whip this thingy up, honestly, I can't imagine building all the individual tools and stuff myself.

Design inspired by [Archive of Our Own](https://archiveofourown.org) (AO3). Not affiliated with the Organization for Transformative Works.

## Contributing

If you want to contribute, check out [CONTRIBUTING.md](CONTRIBUTING.md). I'm not the best repo maintainer (I will learn to be if there's enough need for it I suppose), but yeah.

If you want any features, [open an issue on GitHub](https://github.com/aoyo-writer/aoyo-writer.github.io/issues) — I'll, maybe look through it.

## License

[MIT](LICENSE) — hosting this literally costs me nothing, so, feel free to use it however you want, fork it, whatever~

to muh friends :3
