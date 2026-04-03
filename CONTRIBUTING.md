# Contributing to AOYO

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) (recommended)
- Git

### Getting Started

```bash
git clone https://github.com/aoyo-writer/aoyo.git
cd aoyo
bun install
bun run dev
```

The dev server runs at `http://localhost:5173` with hot module replacement.

### NixOS

```bash
nix-shell -p bun --run "bun install"
nix-shell -p bun --run "bun run dev"
```

## Code Style

- **TypeScript** with strict mode enabled — no `any` types, all compiler checks on
- **ESLint** for linting — run `bun run lint` before submitting
- **React 19** with function components and hooks only
- **MUI 7** for UI components with the `sx` prop for styling
- Prefer editing existing files over creating new ones
- Keep changes focused — one feature or fix per PR

## Project Layout

```
src/
├── components/       UI components (pages, editors, tools)
├── db/               Database layer (SQLite via sqlocal)
├── extensions/       TipTap editor extensions
├── hooks/            Custom React hooks
├── utils/            Utility functions (export, citations, APIs)
└── types.ts          Shared TypeScript interfaces
```

Key files:
- `src/db/sqlite.ts` — Database schema and initialization
- `src/db/useWorks.ts` — All CRUD operations and reactive hooks
- `src/extensions/index.ts` — TipTap extension registry (all extensions registered here)
- `src/theme.ts` — MUI theme configuration

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `bun run build` to verify type-checking and build pass
4. Run `bun run lint` to check for lint errors
5. Open a pull request against `main`

## Known Gotchas

These are common pitfalls that have caught us before:

- **pdfjs-dist**: Pinned to `4.10.38` — v5 requires `Map.getOrInsertComputed` (Chrome 134+), which breaks compatibility
- **TipTap v3**: Uses named imports (`import { Table } from "@tiptap/extension-table"`), not default exports
- **TipTap `getPos()`**: Returns `number | undefined` in NodeView props — always guard with `typeof`
- **sqlocal `useReactiveQuery`**: Ignores prop changes due to internal `useState(() => query)`. Use the custom `useSqlQuery` hook in `src/db/sqlite.ts` instead
- **SQLite reserved words**: `order` must be quoted as `"order"` in queries
- **SQLite BLOBs**: Returned as `Uint8Array` — convert to `Blob` at the boundary
- **Citation HTML**: `entryId` becomes lowercase `entryid` in TipTap's `renderHTML` output
- **COEP headers**: Required by sqlocal. The Vite plugin handles dev; production hosts need explicit header config
- **docx footnotes**: Require `Record<string, { children: Paragraph[] }>` format

## Reporting Issues

- Use [GitHub Issues](https://github.com/aoyo-writer/aoyo/issues)
- Include browser version and steps to reproduce
- Screenshots are helpful for UI issues

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
