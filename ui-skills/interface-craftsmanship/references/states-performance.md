# States and Perceived Performance

## Contents

- State machines
- Complete state galleries
- Loading strategy
- Optimistic UI
- Verification

## State machines

Model interactive components as explicit states and events. For an asynchronous action, useful states often include idle, submitting, success, and error, with cancellation or retry when the workflow requires them.

- Define which events are valid in each state.
- Prevent contradictory combinations such as success and loading simultaneously.
- Keep state ownership near the behavior it controls.
- Make transitions reversible or recoverable where users can interrupt or retry.

## Complete state galleries

Build a playground, story, preview, or test that displays every meaningful state at once. Include:

- default, hover, focus, pressed, selected, and disabled;
- empty, sparse, typical, dense, and overflowing content;
- loading, partial, success, error, offline, and retry;
- permissions or unavailable states where applicable.

This exposes styling drift and impossible combinations earlier than testing only the happy path.

## Loading strategy

The best loading state is one users do not perceive.

1. Remove avoidable work and precompute or cache when appropriate.
2. Start work early when intent is predictable without violating privacy or wasting significant resources.
3. Preserve the previous useful view during short refreshes.
4. Show immediate acknowledgement of input.
5. Use a delayed progress indicator for operations likely to finish quickly, avoiding a distracting flash.
6. For longer waits, show stable structure, honest progress when measurable, and useful context.

Skeletons should match the final layout closely. Indeterminate spinners communicate activity, not progress; do not use them for every delay.

## Optimistic UI

Use optimistic updates when success is likely, the action is reversible, and conflicts are manageable.

- Update immediately and reconcile with the server response.
- Preserve enough information to roll back or show a retry path.
- Communicate failure near the affected object.
- Avoid optimistic confirmation for destructive, financial, permission-sensitive, or otherwise high-consequence operations unless the backend contract safely supports it.
- Do not claim final success before it is true when users may act on that claim.

## Verification

Test slow, failed, duplicated, out-of-order, cancelled, and retried requests. Confirm that controls cannot fire invalid duplicate actions, focus remains sensible, status announcements are accessible, and the final state matches persisted reality.
