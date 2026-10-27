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

## Deployment and agent tools

Before deploying or preparing recruitment, read [the operations guide](core/operations/README.md). From the project root:

- `bun run ops -- deploy inspect` reports the target, source identity, and posted-version warnings.
- `bun run ops -- deploy run` deploys static Hosting, verifies the live build, and records its SHA/version. `bun run deploy` uses the same service and also checks the Firebase CLI's selected project.
- `bun run ops -- --help` lists study/review draft and read-only investigation commands. Study publication and participant actions/payments remain final researcher actions in the web UI.

Set a real researcher `contactEmail` in `epoch.config.ts` before production build/deployment. Treat `version` as a participant-procedure/data-cohort identifier: keep it during pre-posting bugfix deployments and unchanged-code recruitment batches; increment it when changing the procedure or analysis after posting a study. A posted version with a different commit produces a strong warning. Review the diff before using `--allow-version-reuse`; report the reason for keeping the version. Missing publication history (e.g. studies posted outside this dashboard) requires a manual check.

For browser exploration and recorded replay, start with [the testing guide](core/testing/README.md) and `bun run test:experiments help`.
