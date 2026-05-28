# Simplification TODO

These are *proposed* changes that target the broader goal of the simplified branch: to reduce complexity and standardize development patterns for developers that are using the template to build experiments

## Core

**Add a phase controller helper.** Several task components use `usePhaseEpoch(...)`, call `useDisplayPhases(...)`, and then add a watcher to keep the display phase synchronized with the epoch phase. This appears in task code such as Corsi, digit span, click test, and phase demos. A `usePhaseController(...)` helper could return the epoch, current phase, `Phase` component, transition state, and navigation methods from one place. This would reduce boilerplate and make phase-based task components easier to teach.

**Add a typed async phase-handler helper.** Many tasks use a local state machine shaped like `watchImmediate(E.phase, async phase => handlers[phase]())`, with each phase running async sleeps, input collection, logging, or transitions. This pattern is useful, but currently each component owns cancellation, stale async callbacks, and handler exhaustiveness. A small helper could integrate `useLocalAsync`, require a handler for each phase, and prevent old async work from mutating state after the component unmounts or the phase changes.

**Clarify whether params are setup-time or reactive.** `defineParams` currently merges defaults, provided params, and prop overrides into plain values. That is simple and works for most experiments, but projects sometimes expect params to react when props change and then work around it locally. The core API should either document that params are intentionally evaluated once during setup, or introduce a separate reactive helper with an explicit name so users do not mix the two mental models.

**Simplify epoch outline/indexing internals.** The current developer outline discovers much of the epoch tree by traversing the running experiment, creating pseudo-leaves for indexable epochs, materializing repeated children, caching the result, and then jumping back. This supports useful developer tooling, but it is complex and sensitive to lifecycle behavior. A cleaner long-term direction is for `ESequence`, `ERepeat`, and related primitives to expose declarative metadata so the outline can be built without executing the full task flow.

**Consider a clearer wait/lifecycle primitive for `EPage`.** `EPage` has become the standard single-step custom epoch primitive, but many examples still encode async waiting through `@mounted` handlers that manually call `epoch.done()`. This is explicit, but it makes common waits noisy and pushes lifecycle details into templates. A small, current-style helper for hook waits or promise waits could preserve the simplicity of `EPage` while replacing the old `EWait` use cases with something easier to read.

## Template

**Make data view registration explicit.** Data pages import `preprocessing.ts`, but many data views are declared in Vue component modules as side effects. That means a view may only exist if the relevant component module has been imported somewhere else, which is easy to miss when reviewing or migrating a project. A project-level manifest, or a convention such as `components/Foo.data.ts`, would make data outputs discoverable and avoid relying on component import side effects.

**Remove starter workarounds for logger registration.** The starter experiment and some example projects include a short artificial wait so event/data loggers have time to register before the experiment begins. If data views and loggers are registered explicitly before the experiment page runs, this workaround should no longer be needed. Removing it would make starter code look less magical and avoid teaching users to add timing sleeps for initialization.

**Keep the starter experiment focused on current primitives.** The starter should model the standard patterns that new projects should copy: `EPage` for custom steps, `EContinue` for common continuation screens, `ENavigableSequence` for instructions, participant UI components only as UI, semantic event logs, and explicit input blocking in task state. It should avoid showing deprecated or compatibility-oriented patterns unless the example is specifically about migration.

**Add compact migration examples for removed epoch shortcuts.** The migration guide explains that `EButtons`, `EKey`, `EWait`, and `EDelay` were removed, but projects benefit from concrete before/after snippets for each common use. These examples should show direct replacements with `EPage`, `PButtons`, `PKey`, `duration`, and explicit async `@mounted` code where needed. This belongs in template docs because it tells downstream projects exactly how to update.

## Projects

**Standardize surveys on the current core survey component.** The associated projects have several survey styles: direct `survey.submit` forms, an older survey sequence component, a newer core `ESurveySequence`, and custom wide survey parsers. Projects should converge on the core survey event shape where possible. A helper such as `surveyWideView(name, columns, extras)` would keep project-specific columns while removing repeated parsing code.

**Migrate project code off removed APIs.** Several associated projects still use or import removed or compatibility-era APIs such as `useParticipant`, `EButtons`, `EKey`, `EWait`, `EDelay`, and `EInstructions`. These should be updated to `promiseKeyPress` or `onKeyPress`, `EPage`, `PKey`, `PButtons`, `duration`, and `ENavigableSequence`. Doing this in real projects will also validate that the simplified branch has enough ergonomic replacement patterns.

**Replace repeated phase/display wiring with the core phase helper once available.** Corsi, digit span, click test, bandit, and combined planning-memory tasks all express task flow as named phases plus a display `Phase` component. Once core has a phase-controller helper, these project components should adopt it. That will reduce local boilerplate and make differences between tasks reflect the experiment logic rather than framework ceremony.

**Normalize instruction/task coupling.** Some projects teach a task by rendering a live disabled or `no-epoch` task instance and controlling it through exported hooks, exposed refs, and external phase changes. This is powerful, especially for interactive instructions, but each project currently invents its own pattern. Projects should converge on a standard practice/example controller approach so instruction components can drive demonstrations without tightly coupling to task internals.

**Keep project event schemas semantic and parser-owned.** The simplified template intentionally removed generic participant event logging, so project code should log task-level events such as trial choices, rewards, survey responses, and block summaries. Older generic views such as `survey.submit` can remain when they are truly sufficient, but new or migrated code should prefer typed semantic event loggers and colocated parser helpers that define the analysis contract explicitly.
