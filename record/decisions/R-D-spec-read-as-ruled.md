# R-D-spec-read-as-ruled — The carried spec is read as a shape before any rule runs

**Status.** `closed`
**Opened.** 2026-08-23
**Settles when.** It is stated what a checker does with a carried spec that parses but cannot be read as the shape the checker’s reads demand, and no such spec crashes the run or passes it quietly.

## Question

The failure doctrine splits a bad spec in two — will-not-parse is a tool error,
loads-but-incoherent is the spec rules’ red — and a third state sits between them unowned:
a spec that parses as JSON but holds a value the checker’s own reading cannot take. A
`limits.line_length` that is a string, a field declaration that is null, a `rules` that is
not a list are all legal JSON and all unreadable to the code that indexes them.

The checker met that state with a shallow guard checking four keys exist, and a cast
promising the compiler the rest — the non-null assertion R-D-strict-indexing banned,
wearing different clothes: the letter of that ruling read as met while its stated reason was
not. The observed consequences were both wrong in the ruled senses. A limit of the wrong
type switched M-15 off and the run reported clean — a gate reporting success from a run
where a rule never ran, the defect R-D-init-seeds was written to kill. Two shapes crashed
with a raw stack trace and the violations exit code, which R-D-fail-closed and
R-D-errors-name-remedy forbid between them. And nothing in the spec rules types these
values, so the incoherent spec is never red either.

## Candidates

1. **Type the interior into the spec rules.** Incoherence stays red, per the doctrine. Costs:
   the rules would run under the very spec they are typing, so the broken value corrupts the
   judge before the judgment — and every checker read needs a shadowing rule, a copy that
   drifts.
2. **Validate at the load boundary, stop as a tool error.** One reading, before any rule, of
   exactly the shape the checker’s reads demand; a failure names the path and stops with the
   tool-error code. Cost: a class of spec mistakes exits 2 rather than red — acceptable,
   because a verdict from a spec the checker could not read as ruled is no verdict.
3. **Guard every read site with a declared default.** Each site skips with a reason. Cost: a
   verdict computed with rules quietly off — the finding, kept.

## Closed — 2026-08-23

**Ruling.** The carried spec is read once, at load, against the shape the checker’s reads demand; a failure stops as a tool error naming the path — never a crash, never a fallback to the shipped copy, never a verdict — and incoherence within a readable shape stays the spec rules’ red.
**Scope.** `src/format.ts`, `src/check.ts`, `spec/v0.md`

**Why candidate 2, and where the boundary lies.** The line between this stop and the spec
rules’ red is structural against semantic. What the checker itself must index — the shapes
its own reading takes for granted — is this gate’s business: demanded present where the read
is
unconditional, well-typed wherever a value stands. What a well-shaped spec then says — an
unknown key, a partial map, a mirror that disagrees — stays the spec rules’ violations,
reported, never improvised around. This enforces R-D-strict-indexing’s stated reason rather
than its letter: the cast survives as the gate’s own single statement, made after every read
it stands for has been answered, never a promise the input has not kept.

**Why the fallback fell with the cast.** A tree carrying a spec is judged by that spec or
not at all. Interpreting it by the shipped copy while the spec rules red the carried one was
a verdict from an authority the tree never carried — the quiet form of the same wrong. The
shipped copy interprets only a tree that carries no spec, and is read through the same gate
at import.

**What the neighbours keep — their halves.** R-D-unreadable-version keeps the well-shaped spec whose
version the checker cannot interpret. R-D-name-anchors keeps the well-shaped binding that
resolves to nothing — a renamed type under a still-typed limit passes this gate and stays
that Decision’s open question. The prose split in `spec/v0.md`’s failure paragraph now
states all of this in one breath: unreadable — as JSON or as the declared shape — is silence
with an error code; loads-but-incoherent is red.
