# Repository Guidelines

## Project Shape

This is a Nuxt 3 experiment app that extends the template layer in `core/`.

- Project-specific experiment code lives at the repository root, especially `components/` and `epoch.config.ts`.
- `core/` is owned by the template. Do not edit files under `core/` unless the user explicitly asks for a template-layer change.
- Never touch the `data/` directory.
- Architecture decision records for the template layer live in `core/docs/adr/` (numbered `NNNN-title.md`). Record non-trivial template-layer design decisions there, and consult them for background.
- **Before implementing experiment features, read `core/docs/guide/README.md`** — the canonical project-development guide. It routes to live reference implementations under `core/internal/examples/`, served at `/examples/<slug>`.
- Keep `core/CHANGES.md` up to date with changes to core's external behavior and required downstream updates, including top-level configuration changes. Exclude internal refactoring, documentation, and example/demo changes.

## Development Commands

Use Bun from the repository root.

- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Typecheck: `bun run typecheck`
- Build: `bun run build`

Run `bun run typecheck` after all edits.

The user usually has a dev server already running. Before starting one, check whether the dev server is already serving (its port is set by the `dev` script in `package.json`) and reuse it. If nothing is running and browser verification is needed, start the dev server yourself. Never kill a dev server you did not start, and never use a broad `pkill -f "nuxt dev"` / `pkill -f "bun run dev"` — it cannot tell the user's server from yours.

## Git

In addition to any already established guidelines, follow these rules:

- Commits that target a specific component should be prefixed by the component name, e.g. "EPage: add slot state"
- A top-level commit may contain only a `core` pointer update when it records adoption of a verified core commit.
