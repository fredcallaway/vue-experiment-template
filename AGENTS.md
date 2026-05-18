# Repository Guidelines

## Project Shape

This is a Nuxt 3 experiment app that extends the template layer in `core/`.

- Project-specific experiment code lives at the repository root, especially `components/` and `epoch.config.ts`.
- `core/` is owned by the template. Do not edit files under `core/` unless the user explicitly asks for a template-layer change.
- Never touch the `data/` directory.

## Development Commands

Use Bun from the repository root.

- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Typecheck: `bun run typecheck`
- Build: `bun run build`

Run `bun run typecheck` after all edits.

## Code Style

- Keep code simple, concise, and modular.
- Prefer existing project and template conventions over new abstractions.
- Only add explicit imports when autoimport is insufficient.
- Use Vue single-file components with `<script lang="ts" setup>` for component logic when practical.
- Use template-provided composables and helpers such as `useEpoch`, `defineParams`, `declareEventLogger`, `declareDataView`, `useBonus`, and `useParticipant`.
- In epoch components, call `useEpoch(...)` before composables that depend on epoch context.
- Preserve existing UnoCSS utility style in templates. Use scoped CSS only where it keeps the component clearer.
- Avoid compatibility branches for old non-data code. Update callers to the current convention instead.

## Experiment and Data Patterns

- Define experiment parameters with `defineParams` and pass overrides through component `params` props.
- Log participant behavior with declared event loggers where possible; keep event payloads typed.
- Keep `declareDataView(...)` transforms near the component or module that owns the logged event shape.
- When changing logged event schemas or output columns, consider existing raw/session data compatibility before removing or renaming fields.
- Do not change Prolific, Firebase, or PostHog configuration unless the task explicitly requires it.

## Git

In addition to any already established guidelines, follow these rules:

- Commits that target a specific component should be prefixed by the component name, e.g. "EPage: add slot state"

# Guidlines for branch: simplified

The goal of this branch is to reduce complexity and standardize development patterns for developers that are using the template to build experiments. The prolific and data pages are out of scope, as is the basic database structure.

Update CHANGES.md along with each commit. This file will be used as a migration guide for projects using the template.

Use these existing projects as examples of how the template is used in practice. Note that these are using the bleeding branch of core, not the simplified one developed here.

/Users/fred/projects/eyeplan/graphnav2
/Users/fred/projects/prakhar-bamdp/bandit-task
/Users/fred/projects/rlwm-task
/Users/fred/projects/prakhar-prediction