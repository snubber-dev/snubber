// The checker's own test battery: constructed fixture trees, one mistake per
// case, asserting exactly which rules fire. The four measured false-positive
// shapes — a backticked field value, a reference-style link, an ID inside a
// fence, prose shaped like a field — are constructed here as fixtures; this is
// the parsing section's teeth.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { check, ToolStop } from "../src/check.ts";

const here = dirname(fileURLToPath(import.meta.url));
const SPEC = readFileSync(resolve(here, "..", "spec", "format.json"), "utf8");

const D = `# R-D-first — The first decision

**Status.** \`closed\`
**Opened.** 2026-08-21

## Question

Does the checker check? [R-E-seed](../evidence/R-E-seed.md) suggests it must.

## Closed — 2026-08-21

**Ruling.** The checker checks.
**Scope.** \`src/**\`, \`spec/format.json\`

Argument prose here.
`;

const E = `# R-E-seed — A seed measurement

**Grade.** \`measured\`
**Recorded.** 2026-08-21
**Source.** Running the suite by hand.

The observation: R-D-first was checkable.
`;

const W = (over: Partial<{ id: string; kind: string; status: string; body: string; fields: string; events: string }> = {}) => {
  const id = over.id ?? "R-W-task";
  return `# ${id} — A task

**Kind.** \`${over.kind ?? "build"}\`
**Status.** \`${over.status ?? "open"}\`
**Opened.** 2026-08-21
**Done when.** It is done.
${over.fields ?? ""}
${over.body ?? `The work references [R-D-first](../decisions/R-D-first.md).`}
${over.events ?? ""}`;
};

type Case = {
  name: string;
  files: Record<string, string>;
  spec?: (s: any) => void;
  rawSpec?: string; // verbatim spec file content, for the will-not-parse case
  dirs?: string[]; // directories created bare, for the unreadable-artifact case
  expectError?: boolean; // the checker stops rather than judging
  expect: string[];
};

const base = (extra: Record<string, string> = {}): Record<string, string> => ({
  "record/decisions/R-D-first.md": D,
  "record/evidence/R-E-seed.md": E,
  "src/cli.ts": "x\n",
  ...extra,
});

const LONE_D = `# R-D-lone — Alone

**Status.** \`open\`
**Opened.** 2026-08-21
**Settles when.** Something.

## Question

Nothing referenced.
`;

const cases: Case[] = [
  { name: "green base (backticked field values)", files: base(), expect: [] },

  {
    name: "reference-style link resolves and satisfies M-24",
    files: base({
      "record/decisions/R-D-first.md": D + "\nSee [R-E-seed][].\n\n[R-E-seed]: ../evidence/R-E-seed.md\n",
    }),
    expect: [],
  },
  {
    name: "an ID inside a fence is not a reference",
    files: base({
      "record/decisions/R-D-first.md": D + "\n```\nR-E-nothere is quoted here\n```\n",
    }),
    expect: [],
  },
  {
    name: "prose shaped like a field, undeclared label, is prose",
    files: base({
      "record/decisions/R-D-first.md": D + "\n**Caveat.** This line is prose.\n",
    }),
    expect: [],
  },
  {
    name: "M-19: declared label outside the run is the tripwire",
    files: base({
      "record/decisions/R-D-first.md": D + "\n**Status.** \`open\`\n",
    }),
    expect: ["M-19"],
  },

  {
    name: "M-01: dangling link under record/",
    files: base({
      "record/decisions/R-D-first.md": D + "\nAnd [a note](missing.md) too.\n",
    }),
    expect: ["M-01"],
  },
  {
    name: "M-02: stem outside the grammar is one red and inert",
    files: base({ "record/decisions/R-D-bad_name.md": "# R-D-bad_name — broken\n\nprose\n" }),
    expect: ["M-02"],
  },
  {
    name: "M-03 + M-25: same stem in another type's home",
    files: base({ "record/work/R-D-first.md": D }),
    expect: ["M-03", "M-25"],
  },
  {
    name: "M-04: two heading lines",
    files: base({
      "record/decisions/R-D-first.md": D + "\n# R-D-first — again\n",
    }),
    expect: ["M-04"],
  },
  {
    name: "M-04 + M-05: no heading line at all",
    files: base({ "record/evidence/R-E-headless.md": "Prose only, but it cites [R-E-seed](R-E-seed.md).\n" }),
    expect: ["M-04", "M-05", "M-05", "M-05"],
  },

  {
    name: "M-05: missing required field",
    files: base({
      "record/evidence/R-E-seed.md": E.replace("**Grade.** `measured`\n", ""),
    }),
    expect: ["M-05"],
  },
  {
    name: "M-05: closing event missing Ruling",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Ruling.** The checker checks.\n", ""),
    }),
    expect: ["M-05"],
  },
  {
    name: "M-05: probe closes without Probes",
    files: base({
      "record/work/R-W-task.md": W({
        kind: "probe",
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Measured the thing.\n`,
      }),
    }),
    expect: ["M-05"],
  },
  {
    name: "M-05: Probes carries neither IDs nor none",
    files: base({
      "record/work/R-W-task.md": W({
        kind: "probe",
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Measured the thing.\n**Probes.** whatever\n`,
      }),
    }),
    expect: ["M-05"],
  },
  {
    name: "M-05: Ruling under min_length",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Ruling.** The checker checks.", "**Ruling.** ok"),
    }),
    expect: ["M-05"],
  },
  {
    name: "M-05 merged red: the block misplaced its run",
    files: base({
      "record/decisions/R-D-first.md": D.replace(
        "## Closed — 2026-08-21\n\n**Ruling.** The checker checks.\n**Scope.** `src/**`, `spec/format.json`",
        "## Closed — 2026-08-21\n\nSome prose first.\n\n**Ruling.** The checker checks.\n**Scope.** `src/**`",
      ),
    }),
    expect: ["M-05"],
  },

  {
    name: "M-06: undeclared Grade value",
    files: base({
      "record/evidence/R-E-seed.md": E.replace("`measured`", "`wild`"),
    }),
    expect: ["M-06"],
  },
  {
    name: "M-07: Status disagrees with the events",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Status.** `closed`", "**Status.** `open`"),
    }),
    expect: ["M-07"],
  },
  {
    name: "M-08: event heading near-miss",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Status.** `closed`", "**Status.** `open`")
        .replace("## Closed — 2026-08-21\n\n**Ruling.** The checker checks.\n**Scope.** `src/**`, `spec/format.json`\n", "## Closed — yesterday\n"),
    }),
    expect: ["M-08"],
  },
  {
    name: "M-09: second Closed is illegal from closed",
    files: base({
      "record/work/R-W-task.md": W({
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Did the thing.\n\n## Closed — 2026-08-21\n\n**Outcome.** Did it again.\n`,
      }),
    }),
    expect: ["M-09"],
  },

  {
    name: "M-12: an artifact touching nothing",
    files: base({
      "record/work/R-W-alone.md": W({ id: "R-W-alone", body: "No references at all.\n" }),
    }),
    expect: ["M-12"],
  },
  {
    name: "M-13: external link",
    files: base({
      "record/decisions/R-D-first.md": D + "\nSee [the docs](https://example.com/docs).\n",
    }),
    expect: ["M-13"],
  },
  {
    name: "M-13: bare web reference",
    files: base({
      "record/decisions/R-D-first.md": D + "\nSee https://example.com/docs for this.\n",
    }),
    expect: ["M-13"],
  },
  {
    name: "M-13: link outside record/ does not resolve",
    files: base({
      "record/decisions/R-D-first.md": D + "\nAnd [x](../../src/nope.ts) too.\n",
    }),
    expect: ["M-13"],
  },

  {
    name: "M-14: gated Scope glob matches nothing",
    files: base({
      "record/decisions/R-D-first.md": D.replace("`src/**`, `spec/format.json`", "`nope/**`"),
      "record/work/R-W-task.md": W({
        status: "closed",
        fields: "**Under.** R-D-first\n",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Implemented it.\n`,
      }),
    }),
    expect: ["M-14"],
  },
  {
    name: "M-14: absent-glob still matches",
    files: base({
      "record/decisions/R-D-first.md": D.replace("`src/**`, `spec/format.json`", "`spec/format.json`, `!<src/**`"),
      "record/work/R-W-task.md": W({
        status: "closed",
        fields: "**Under.** R-D-first\n",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Implemented it.\n`,
      }),
    }),
    expect: ["M-14"],
  },
  {
    name: "M-14: ungated is a report, not a violation",
    files: base({
      "record/decisions/R-D-first.md": D.replace("`src/**`, `spec/format.json`", "`nope/**`"),
    }),
    expect: [],
  },

  {
    name: "M-15: long line in a Decision",
    files: base({
      "record/decisions/R-D-first.md": D + "\n" + "x".repeat(301) + "\n",
    }),
    expect: ["M-15"],
  },
  {
    name: "M-15: a fenced long line is exempt",
    files: base({
      "record/decisions/R-D-first.md": D + "\n```\n" + "x".repeat(301) + "\n```\n",
    }),
    expect: [],
  },
  {
    name: "M-16: Work body over budget",
    files: base({
      "record/work/R-W-task.md": W({ body: "[R-D-first](../decisions/R-D-first.md)\n" + "word word word word word\n".repeat(60) }),
    }),
    expect: ["M-16"],
  },

  {
    name: "M-17: unresolved bare reference",
    files: base({
      "record/decisions/R-D-first.md": D + "\nAlso R-E-nothere is cited.\n",
    }),
    expect: ["M-17"],
  },
  {
    name: "M-17: code-spanned ID inside a field value",
    files: base({
      "record/evidence/R-E-seed.md": E.replace("**Source.** Running the suite by hand.", "**Source.** `R-D-first`"),
    }),
    expect: ["M-17"],
  },

  {
    name: "M-18: ID text pointing at a different non-artifact file",
    files: base({
      "notes.md": "notes\n",
      "record/decisions/R-D-first.md": D + "\nAnd [R-E-seed](../../notes.md).\n",
    }),
    expect: ["M-18"],
  },
  {
    name: "M-18: path text disagreeing with the destination",
    files: base({
      "notes.md": "notes\n",
      "other.md": "other\n",
      "record/decisions/R-D-first.md": D + "\nAnd [notes.md](../../other.md).\n",
    }),
    expect: ["M-18"],
  },
  {
    name: "M-24: prose text on an artifact destination",
    files: base({
      "record/decisions/R-D-first.md": D + "\nAnd [see here](../evidence/R-E-seed.md).\n",
    }),
    expect: ["M-24"],
  },

  {
    name: "M-19: duplicate key in one run",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Opened.** 2026-08-21", "**Opened.** 2026-08-21\n**Opened.** 2026-08-20"),
    }),
    expect: ["M-19"],
  },
  {
    name: "M-19: case-mismatched label",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Status.**", "**status.**"),
    }),
    expect: ["M-19"],
  },
  {
    name: "M-19: event field in the opening run",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Opened.** 2026-08-21", "**Opened.** 2026-08-21\n**Ruling.** Placed too early."),
    }),
    expect: ["M-19"],
  },
  {
    name: "M-19: undeclared key inside the run",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Opened.** 2026-08-21", "**Opened.** 2026-08-21\n**Wild.** A stowaway."),
    }),
    expect: ["M-19"],
  },
  {
    name: "M-19: another type's field inside an event block",
    files: base({
      "record/work/R-W-task.md": W({
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Did the thing.\n**Done when.** Misplaced.\n`,
      }),
    }),
    expect: ["M-19"],
  },

  {
    name: "M-20: event before Opened",
    files: base({
      "record/decisions/R-D-first.md": D.replace("## Closed — 2026-08-21", "## Closed — 2026-08-20"),
    }),
    expect: ["M-20"],
  },
  {
    name: "M-21: a shape that is not a day",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Opened.** 2026-08-21", "**Opened.** 2026-02-30"),
    }),
    expect: ["M-21"],
  },

  {
    name: "M-23: blocked by closed Work",
    files: base({
      "record/work/R-W-task.md": W({ fields: "**Blocked by.** R-W-done\n" }),
      "record/work/R-W-done.md": W({
        id: "R-W-done",
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Finished first.\n`,
      }),
    }),
    expect: ["M-23"],
  },

  {
    name: "M-29: a field naming its own artifact",
    files: base({
      "record/evidence/R-E-seed.md": E.replace("**Source.** Running the suite by hand.", "**Source.** Running the suite by hand.\n**Supersedes.** R-E-seed"),
    }),
    expect: ["M-29"],
  },
  {
    name: "M-30: a supersession cycle",
    files: base({
      "record/evidence/R-E-one.md": E.replace("R-E-seed", "R-E-one").replace("**Source.** Running the suite by hand.", "**Source.** By hand.\n**Supersedes.** R-E-two"),
      "record/evidence/R-E-two.md": E.replace("R-E-seed", "R-E-two").replace("**Source.** Running the suite by hand.", "**Source.** By hand.\n**Supersedes.** R-E-one"),
    }),
    expect: ["M-30", "M-30"],
  },
  {
    name: "M-31: a comment in the masked text",
    files: base({
      "record/decisions/R-D-first.md": D + "\n<!-- invisible ink -->\n",
    }),
    expect: ["M-31"],
  },
  {
    name: "M-31: a fenced comment is legal",
    files: base({
      "record/decisions/R-D-first.md": D + "\n```\n<!-- quoted -->\n```\n",
    }),
    expect: [],
  },

  {
    name: "M-26: the sentinel survives",
    files: base({ "record/context.md": "What this is.\n<!-- snubber:unfilled -->\n" }),
    expect: ["M-26"],
  },
  {
    name: "M-26: a committed empty context file",
    files: base({ "record/context.md": "\n\n" }),
    expect: ["M-26"],
  },

  {
    name: "M-22: a field without read_by",
    files: base(),
    spec: (s) => { delete s.types.E.fields.Grade.read_by; },
    expect: ["M-22"],
  },
  {
    name: "M-22: read_by naming a rule that is not here",
    files: base(),
    spec: (s) => { s.types.E.fields.Grade.read_by = ["M-99"]; },
    expect: ["M-22"],
  },
  {
    name: "M-27: a mirror out of agreement",
    files: base(),
    spec: (s) => { s.grammar.event.value = s.grammar.event.value.replace("Closed|Reopened|Re-closed", "Closed|Re-closed|Reopened"); },
    expect: ["M-27"],
  },
  {
    name: "M-27: a missing asserted_by does not hide a disagreeing literal",
    files: base(),
    spec: (s) => {
      delete s.grammar.event.asserted_by;
      s.grammar.event.value = s.grammar.event.value.replace("Closed|Reopened|Re-closed", "Closed|Re-closed|Reopened");
    },
    expect: ["M-27", "M-27"],
  },
  {
    name: "M-14: a reopened Decision's stale Scope is the board's, not M-14's",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Status.** `closed`", "**Status.** `reopened`")
        .replace("`src/**`, `spec/format.json`", "`nope/**`")
        + "\n## Reopened — 2026-08-22\n\n**Forced by.** R-E-seed\n",
      "record/work/R-W-task.md": W({
        status: "closed",
        fields: "**Under.** R-D-first\n",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Implemented it.\n`,
      }),
    }),
    expect: [],
  },
  {
    name: "M-08: an event near-miss above the heading is still an error",
    files: base({ "record/decisions/R-D-first.md": "## Closed - 2026-08-21\n\n" + D }),
    expect: ["M-08"],
  },
  {
    name: "a well-formed event above the heading is body (parsing.field_position)",
    files: base({ "record/decisions/R-D-first.md": "## Reopened — 2026-08-22\n\n" + D }),
    expect: [],
  },
  {
    name: "M-28: an unknown top-level key",
    files: base(),
    spec: (s) => { s.extra = true; },
    expect: ["M-28"],
  },
  {
    name: "M-28: vanished transitions",
    files: base(),
    spec: (s) => { delete s.transitions.W; },
    expect: ["M-28"],
  },
  {
    name: "M-28: an event map keyed by an undeclared event",
    files: base(),
    spec: (s) => { s.types.W.event_fields.Withdrawn = ["Outcome"]; },
    expect: ["M-28"],
  },

  // --- regression cases from the pre-commit review ---
  {
    name: "M-23 stays off a Decision carrying a stray Blocked by",
    files: base({
      "record/decisions/R-D-blocked.md": `# R-D-blocked — Blocked-looking\n\n**Status.** \`open\`\n**Opened.** 2026-08-21\n**Blocked by.** R-D-done\n\nprose\n`,
      "record/decisions/R-D-done.md": `# R-D-done — Done\n\n**Status.** \`closed\`\n**Opened.** 2026-08-21\n\nIt cites R-D-blocked.\n\n## Closed — 2026-08-21\n\n**Ruling.** It is done here.\n**Scope.** \`none\`\n`,
    }),
    expect: ["M-19"],
  },
  {
    name: "M-30 stays off non-Evidence Supersedes",
    files: base({
      "record/decisions/R-D-s1.md": `# R-D-s1 — One\n\n**Status.** \`open\`\n**Opened.** 2026-08-21\n**Supersedes.** R-D-s2\n\nprose\n`,
      "record/decisions/R-D-s2.md": `# R-D-s2 — Two\n\n**Status.** \`open\`\n**Opened.** 2026-08-21\n**Supersedes.** R-D-s1\n\nprose\n`,
    }),
    expect: ["M-19", "M-19"],
  },
  {
    name: "M-14 gate ignores a closed Decision's stray Under",
    files: base({
      "record/decisions/R-D-first.md": D.replace("`src/**`, `spec/format.json`", "`nope/**`"),
      "record/decisions/R-D-gate.md": `# R-D-gate — Gate-looking\n\n**Status.** \`closed\`\n**Opened.** 2026-08-21\n**Under.** R-D-first\n\nprose\n\n## Closed — 2026-08-21\n\n**Ruling.** It gates nothing.\n**Scope.** \`none\`\n`,
    }),
    expect: ["M-19"],
  },
  {
    name: "M-19: declared label before the heading is still the tripwire",
    files: base({
      "record/decisions/R-D-first.md": "**Ruling.** too early\n\n" + D,
    }),
    expect: ["M-19"],
  },
  {
    name: "M-16: body before the heading still counts",
    files: base({
      "record/work/R-W-task.md": "word word word word word\n".repeat(62) + "\n" + W({}),
    }),
    expect: ["M-16"],
  },
  {
    name: "M-08 near-miss closes the field run",
    files: base({
      "record/work/R-W-task.md": `# R-W-task — A task\n\n**Kind.** \`build\`\n**Status.** \`open\`\n## Closed x\n**Opened.** 2026-08-21\n**Done when.** It is done.\n\n[R-D-first](../decisions/R-D-first.md)\n`,
    }),
    expect: ["M-05", "M-05", "M-08", "M-19", "M-19"],
  },
  {
    name: "a trailing-space label is not the declared field",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Status.**", "**Status .**"),
    }),
    expect: ["M-05", "M-19"],
  },
  {
    name: "min_length counts code points",
    files: base({
      "record/decisions/R-D-first.md": D.replace("**Ruling.** The checker checks.", "**Ruling.** \u{1D11E}\u{1D11E}"),
    }),
    expect: ["M-05"],
  },
  {
    name: "a fence inside the opening run closes it: the body has started",
    files: base({
      "record/decisions/R-D-first.md": D.replace(
        "**Opened.** 2026-08-21",
        "\n```\n**Status.** `open`\n```\n\n**Opened.** 2026-08-21",
      ),
    }),
    expect: ["M-05", "M-19"],
  },
  {
    name: "a duplicate key reds once; readers see the first value",
    files: base({
      "record/decisions/R-D-first.md": D.replace(
        "**Status.** `closed`",
        "**Status.** `closed`\n**Status.** `open`",
      ),
    }),
    expect: ["M-19"],
  },
  {
    name: "misplaced run: one merged red forgives every line legal in that run",
    files: base({
      "record/decisions/R-D-first.md": D.replace(
        /## Closed[\s\S]*$/,
        "## Closed — 2026-08-21\n\nArgument prose here.\n\n**Ruling.** The checker checks.\n**Scope.** `src/**`, `spec/format.json`\n**Forced by.** R-E-seed\n",
      ),
    }),
    expect: ["M-05"],
  },
  {
    name: "a misplaced optional alone triggers no merge; absences red individually",
    files: base({
      "record/decisions/R-D-first.md": D.replace(
        /## Closed[\s\S]*$/,
        "## Closed — 2026-08-21\n\nArgument prose here.\n\n**Forced by.** R-E-seed\n",
      ),
    }),
    expect: ["M-05", "M-05", "M-19"],
  },
  {
    name: "the pass-over forgives declared closing names the values never imposed",
    files: base({
      "record/work/R-W-task.md": W({
        status: "closed",
        events: "\n## Closed — 2026-08-21\n\nWrapped it up.\n\n**Outcome.** `shipped`\n**Probes.** R-E-seed\n",
      }),
    }),
    expect: ["M-05"],
  },
  {
    name: "the pass-over never forgives a label illegal in that run anyway",
    files: base({
      "record/work/R-W-task.md": W({
        status: "closed",
        events: "\n## Closed — 2026-08-21\n\nWrapped it up.\n\n**Outcome.** `shipped`\n**Probes.** R-E-seed\n**Done when.** Again.\n",
      }),
    }),
    expect: ["M-05", "M-19"],
  },
  {
    name: "a carried spec that will not parse stops the checker",
    files: base(),
    rawSpec: "{broken",
    expectError: true,
    expect: [],
  },
  {
    name: "a carried grammar the parser cannot read stops the checker",
    files: base(),
    spec: (s) => { s.grammar.field.value = "^\\*\\*\\S[^.]*\\.\\*\\* \\S.*$"; },
    expectError: true,
    expect: [],
  },
  {
    name: "a carried grammar that does not compile stops the checker",
    files: base(),
    spec: (s) => { s.grammar.heading.value = "(unclosed"; },
    expectError: true,
    expect: [],
  },
  {
    name: "a carried limit that is not a number stops the checker",
    files: base(),
    spec: (s) => { s.limits.line_length = "x"; },
    expectError: true,
    expect: [],
  },
  {
    name: "a carried field declaration that is null stops the checker",
    files: base(),
    spec: (s) => { s.types.D.fields.Status = null; },
    expectError: true,
    expect: [],
  },
  {
    name: "carried rules that are not a list stop the checker",
    files: base(),
    spec: (s) => { s.rules = null; },
    expectError: true,
    expect: [],
  },
  {
    name: "a nested group in the field label reads by balance — legal names pass, no crash",
    files: base(),
    spec: (s) => { s.grammar.field.value = "^\\*\\*((?:[A-Za-z][A-Za-z ]*))\\.\\*\\* (.+)$"; },
    expect: [],
  },
  {
    name: "the label clause still fires through a nested group",
    files: base(),
    spec: (s) => {
      s.grammar.field.value = "^\\*\\*((?:[A-Za-z][A-Za-z ]*))\\.\\*\\* (.+)$";
      s.types.D.fields["Bad_Name"] = { read_by: [] };
    },
    expect: ["M-28"],
  },
  {
    name: "a declared home that is a file stops the checker",
    files: base(),
    spec: (s) => { s.types.W.home = "src/cli.ts"; },
    expectError: true,
    expect: [],
  },
  {
    name: "a context.file that is a directory stops the checker",
    files: base(),
    spec: (s) => { s.context.file = "record"; },
    expectError: true,
    expect: [],
  },
  {
    name: "the carried copy is the one interpreted (M-26 sentinel)",
    files: base({ "record/context.md": "What this is.\n<!-- snubber:unfilled -->\n" }),
    spec: (s) => { s.context.sentinel = "XYZ-NEVER"; },
    expect: [],
  },
  {
    name: "the carried copy's sentinel fires",
    files: base({ "record/context.md": "What this is.\nXYZ-NEVER\n" }),
    spec: (s) => { s.context.sentinel = "XYZ-NEVER"; },
    expect: ["M-26"],
  },
  {
    name: "no record at all stops the checker, naming init",
    files: { "src/cli.ts": "x\n" },
    expectError: true,
    expect: [],
  },
  {
    name: "homes that exist and hold nothing stop the checker, naming what to write",
    files: { "src/cli.ts": "x\n", "record/decisions/.gitkeep": "" },
    expectError: true,
    expect: [],
  },
  {
    name: "an .md name that is not a readable file stops the checker, naming the path",
    files: base(),
    dirs: ["record/decisions/R-D-oops.md"],
    expectError: true,
    expect: [],
  },

  // The guess verdicts from the follow-up file, pinned. One guess died on
  // contact: a code-spanned ID in a list field is red (M-17) and STILL an
  // edge — the value is the ID, spanned illegally (R-D-values-cite-bare),
  // so M-23 reads it. The prediction said no edge; the code says otherwise.
  {
    name: "M-02 + M-17: heading ID diverging from the stem, resolving to nothing",
    files: base({ "record/decisions/R-D-first.md": D.replace("# R-D-first —", "# R-D-second —") }),
    expect: ["M-02", "M-17"],
  },
  {
    name: "a code-spanned ID in Blocked by is red and still an edge (M-17 + M-23)",
    files: base({
      "record/work/R-W-task.md": W({ fields: "**Blocked by.** `R-W-done`\n" }),
      "record/work/R-W-done.md": W({
        id: "R-W-done",
        status: "closed",
        events: `\n## Closed — 2026-08-21\n\n**Outcome.** Finished first.\n`,
      }),
    }),
    expect: ["M-17", "M-23"],
  },
  {
    name: "M-01: a destination empty after the fragment strip never resolves",
    files: base({
      "record/decisions/R-D-first.md": D + "\nSee [the same file](#question).\n",
    }),
    expect: ["M-01"],
  },
  {
    name: "M-30: every member of a three-cycle reds, not the walk's entry alone",
    files: base({
      "record/evidence/R-E-one.md": E.replaceAll("R-E-seed", "R-E-one").replace("**Source.** Running the suite by hand.", "**Source.** By hand.\n**Supersedes.** R-E-two"),
      "record/evidence/R-E-two.md": E.replaceAll("R-E-seed", "R-E-two").replace("**Source.** Running the suite by hand.", "**Source.** By hand.\n**Supersedes.** R-E-three"),
      "record/evidence/R-E-three.md": E.replaceAll("R-E-seed", "R-E-three").replace("**Source.** Running the suite by hand.", "**Source.** By hand.\n**Supersedes.** R-E-one"),
    }),
    expect: ["M-30", "M-30", "M-30"],
  },
  {
    name: "M-12's grace: one grammar-accepted artifact touching nothing is clean",
    files: { "record/decisions/R-D-lone.md": LONE_D, "src/cli.ts": "x\n" },
    expect: [],
  },
  {
    name: "M-12's grace: an inert file is not a second artifact; the grace holds",
    files: {
      "record/decisions/R-D-lone.md": LONE_D,
      "record/decisions/R-D-bad_name.md": "# R-D-bad_name — broken\n\nprose\n",
      "src/cli.ts": "x\n",
    },
    expect: ["M-02"],
  },
];

let failed = 0;
let passed = 0;
for (const c of cases) {
  const root = mkdtempSync(join(tmpdir(), "snubber-test-"));
  try {
    // The repository is what git reports (R-D-present-not-ignored), so every
    // fixture is a git repository; its files are untracked and not ignored,
    // which the listing includes, so no commit is needed.
    execFileSync("git", ["-C", root, "init", "-q"]);
    mkdirSync(join(root, "spec"), { recursive: true });
    if (c.rawSpec !== undefined) {
      writeFileSync(join(root, "spec", "format.json"), c.rawSpec);
    } else {
      const spec = JSON.parse(SPEC);
      if (c.spec) c.spec(spec);
      writeFileSync(join(root, "spec", "format.json"), JSON.stringify(spec, null, 2));
    }
    for (const [rel, content] of Object.entries(c.files)) {
      mkdirSync(join(root, dirname(rel)), { recursive: true });
      writeFileSync(join(root, rel), content);
    }
    for (const rel of c.dirs ?? []) mkdirSync(join(root, rel), { recursive: true });
    if (c.expectError) {
      // A stop is a ToolStop with a message naming the remedy
      // (R-D-errors-name-remedy) — a raw crash is a failure, not a stop.
      let outcome = "judged";
      try {
        check(root);
      } catch (e) {
        outcome = e instanceof ToolStop ? "stopped" : `crashed: ${(e as Error).message}`;
      }
      if (outcome === "stopped") passed++;
      else {
        failed++;
        console.log(`FAIL  ${c.name}\n  expected the checker to stop; it ${outcome} instead`);
      }
      continue;
    }
    const { violations } = check(root);
    const got = violations.map((v) => v.rule).sort();
    const want = [...c.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failed++;
      console.log(`FAIL  ${c.name}`);
      console.log(`  expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      for (const v of violations) console.log(`    ${v.rule}  ${v.path}${v.line ? ":" + v.line : ""}  ${v.message}`);
    } else {
      passed++;
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
