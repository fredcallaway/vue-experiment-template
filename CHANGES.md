# Simplified Template Migration Notes

This branch simplifies the template by removing playback-specific infrastructure and the generic participant event abstraction. The goal is to make experiment code easier to understand and maintain while keeping the common `PButton`, `PButtons`, and `PKey` component names available for compatibility.

## Summary

- Removed the playback page and playback controller UI from `core`.
- Removed `useParticipant.ts` and the `participant.*` event bus/logging abstraction.
- Kept `PButton`, `PButtons`, and `PKey`, but they no longer log `participant.*` events.
- Moved keyboard response handling into `core/utils/keyPress.ts`.
- Removed template-managed participant input blocking; projects should block input explicitly in task code, usually with an `animating` or phase-state guard.
- Kept `usePButton`, but rewrote it to use a local event controller instead of `useParticipant`.
- Added a key-press demonstration to the demo experiment.

## Playback Removal

Playback was removed because it was not viable as a supported feature and was driving complexity in normal experiment code.

Removed from `core`:

- `pages/playback.vue`
- `internal/components/PlaybackController.vue`
- `internal/components/PlaybackEventView.vue`
- `internal/composables/usePlaybackState.ts`
- Playback links from the session data table.
- Playback event loading helpers from local data.
- Playback-specific button styling/effects in `PButton`.

Migration guidance:

- Remove links or docs that point to `/playback`.
- Remove imports/usages of `usePlaybackState`, `PlaybackController`, or `PlaybackEventView`.
- If a project has custom playback UI, either delete it or treat it as project-specific code outside the template.

## Participant Abstraction Removal

`core/composables/useParticipant.ts` was removed. The old abstraction combined several jobs:

- Scoped component event buses.
- Automatic logging of `participant.*` events.
- Keyboard response collection.
- Playback support.
- Input blocking during display transitions.

Those responsibilities are now split or removed.

### Removed APIs

Remove or replace usages of:

```ts
useParticipant()
useParticipantBus()
Participant
PARTICIPANT_INPUT_BLOCKED
withParticipantInputBlocked()
validateKeySpec()
```

`PButton`, `PButtons`, and `PKey` still exist, so many templates do not need immediate markup changes.

### Logging

`PButton`, `PButtons`, and `PKey` no longer log automatically.

Use semantic task logs instead:

```ts
logTrial({
  choice,
  rt,
  reward,
})
```

This is intentional. Generic automatic logs like `participant.click` gave a false sense of data coverage and were easy to bypass with regular buttons or custom UI.

## Keyboard Responses

Keyboard response handling now lives in `core/utils/keyPress.ts`.

Exports:

```ts
onKeyPress
promiseKeyPress
KEYS
Key
KeyPress
KeySpec
```

The behavior is meant to match the previous participant key handling closely:

- Key names are normalized to values like `SPACE`, `ENTER`, `LEFT`, and `A`.
- `keys` can be omitted to accept any supported key.
- Space-separated strings still work, e.g. `"A B C"`.
- Text inputs are ignored.
- Repeated keydown events are deduped by default.
- Returned responses include reaction time: `{ key, rt }`.

Old:

```ts
const P = useParticipant('Bandit')
const { key, rt } = await P.promiseKeyPress(['A', 'B'])
```

New:

```ts
const { key, rt } = await promiseKeyPress(['A', 'B'])
```

For callback-style handling:

```ts
const unsubscribe = onKeyPress('SPACE', ({ key, rt }) => {
  // ...
})
onUnmounted(unsubscribe)
```

`PKey` now uses `onKeyPress` internally, so this still works:

```vue
<PKey keys="SPACE" @press="handlePress" />
```

## Buttons

`PButton` and `PButtons` are now compatibility components. The `P` prefix no longer means "participant event logging"; it is just the existing component name.

Still supported:

```vue
<PButton value="Continue" @click="next" />
<PButtons values="left right" @click="choose" />
```

`PButtons` now forwards `disabled` to each child `PButton`.

`PButton` still exposes:

```ts
on(eventType, handler)
promise(eventType, predicate?)
```

That support exists for `usePButton` and component refs, not for global participant logging.

## `usePButton`

`usePButton` still supports the useful script-side pattern:

```ts
const StartButton = usePButton({ value: 'start' })

await StartButton.promise('click')
```

```vue
<StartButton />
```

Internally this now uses `core/utils/eventController.ts`, a small local event controller. It does not log events and does not participate in playback.

This remains useful for cases like `EClickTest`, where the script wants to await a typed button event while the template renders the button.

## Input Blocking

Template-level participant input blocking was removed.

Old behavior:

- `useDisplayPhases` wrapped transitions in `withParticipantInputBlocked`.
- `PButton` ignored events while `PARTICIPANT_INPUT_BLOCKED` was true.
- This only covered participant components and did not protect regular buttons, forms, direct key listeners, or custom UI.

New guidance:

- Consumers should block input explicitly where needed.
- Use task state such as `animating`, `phase`, or `ready`.
- Guard handlers directly:

```ts
const onChoice = (choice: Choice) => {
  if (animating.value) return
  // handle choice
}
```

For `PButton`, use normal props:

```vue
<PButton :disabled="animating" value="Continue" @click="next" />
```

For key responses, gate the handler:

```vue
<PKey keys="SPACE" @press="!animating && next()" />
```

## Data And Event Views

The core `PEvent` type and `isParticipantEvent` helper were removed from `core/internal/data.ts`.

The debug event view no longer gives participant events special formatting or participant/hover filters. Existing historical data that contains `participant.*` events will still appear as ordinary logged events when loaded, but new template code no longer creates those events.

PostHog no longer needs to blacklist `participant.hover` and `participant.mousedown`, because those events are no longer emitted.

## Demo Experiment

The demo experiment now includes a key-press example:

```vue
<PKey keys="K" @press="goNext" />
```

This is in the instructions flow after the button-click example so projects can see both supported response styles.

## Migration Checklist

1. Update the `core` submodule to this branch/version.
2. Search project code for `useParticipant`, `useParticipantBus`, `Participant`, `PARTICIPANT_INPUT_BLOCKED`, and `withParticipantInputBlocked`.
3. Replace `P.promiseKeyPress(...)` with `promiseKeyPress(...)`.
4. Replace `P.onKeyPress(...)` with `onKeyPress(...)`.
5. Keep `PButton`, `PButtons`, and `PKey` markup if it still fits the task.
6. Add explicit semantic logging for choices, trials, survey responses, and task events.
7. Add explicit `animating`, `ready`, or phase guards for inputs that should be blocked during transitions.
8. Remove playback routes, links, and custom playback-dependent code.
9. Run `bun run typecheck`.

## Commits Included

Core submodule:

- `2cab2ae playback: remove playback page`
- `d414d4c participant: remove useParticipant abstraction`

Template:

- `631c5e1 participant: update core submodule`
- `cee75f7 demo: add key press example`
