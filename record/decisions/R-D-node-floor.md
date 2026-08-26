# R-D-node-floor — The required Node version has one home

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** The required runtime version has a stated single home, every other consumer of it is pointed there, and the published floor is true of the published artifact.

## Question

The runtime version is wanted in many places — the package manifest, a version manager, the
CI workflow, the composite action, a development container — and each has a slot for it. A
home in each drifts the first time one is bumped, and the failure is a syntax error in a
file the reader did not write. A second question hides under the first: source run through
type stripping and compiled JavaScript look like two floors for one field. One home, how
many numbers?

## Closed — 2026-08-23

**Ruling.** `engines.node` in `package.json` is the only home for the required Node floor, one number, and every other consumer reads it; the runtime guard reads the same field and refuses below it, so the published floor is true by construction.
**Scope.** `package.json`, `src/runtime.ts`, `action.yml`

**Why one home — every consumer reads it.** CI and the action read it through the manifest
rather than a restated number, and the entry point reads it at runtime, failing with a
sentence naming the floor instead of a stripping error naming nothing. A generated version file is not
kept — it would have no reader that cannot already read the manifest, so generating it buys
a staleness check for a fact nothing consumes.

**Why one number.** The compiled floor is not an independent quantity waiting to be
measured. The guard ships with the artifact and reads the field, so the artifact’s
requirement is the field by construction: a version matrix run against it finds the guard,
on whatever number the field carries, and never a lower floor. Two floors exist only by
removing or narrowing the guard — a change to the artifact, not a reading of it.
