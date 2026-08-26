#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { assertRuntime } from "./runtime.ts";
import { FORMAT, setFormat } from "./format.ts";
import { RULES } from "./rules/index.ts";
import { check, ToolStop } from "./check.ts";
import type { Ctx } from "./rules/types.ts";
import type { Violation } from "./rules/types.ts";

// A tool error — a spec that will not parse, a tree git cannot list — is not
// a verdict: the checker stops, and the error names what stopped it and the
// way out.
function checkOrStop(root: string, only?: string): { violations: Violation[]; ctx: Ctx } {
  try {
    return check(root, only);
  } catch (e) {
    if (e instanceof ToolStop) {
      console.error(e.message);
      process.exit(2);
    }
    throw e;
  }
}
import { derive } from "./rules/status.ts";
import { unmatchedScope } from "./rules/scope.ts";
import { stripValue } from "./values.ts";

assertRuntime();

const args = process.argv.slice(2);
const cmd = args[0] ?? "check";
const root = resolve(process.env.SNUBBER_ROOT ?? process.cwd());

const usage = (input: string) => {
  console.error(`snubber does not understand ${input}; the commands are: check [--rule M-nn], board, rules, init [--context]`);
  process.exit(2);
};

// A tree carrying a spec is read by that spec everywhere — check, board,
// rules and init alike; the shipped copy answers only where no tree carries
// one (v0.md: a checker is an interpreter of the carried copy, never an
// authority over it). check() adopts it inside load(); the commands that
// read FORMAT before or without check() adopt it here.
function adoptCarriedSpec(): void {
  const specFile = resolve(root, "spec", "format.json");
  if (!existsSync(specFile)) return;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(specFile, "utf8"));
  } catch (e) {
    console.error(`spec/format.json does not parse: ${(e as Error).message}; the checker has nothing to interpret`);
    process.exit(2);
  }
  const bad = setFormat(raw);
  if (bad !== null) {
    console.error(`spec/format.json ${bad}; the checker reads the spec as the shape it declares — fix that value or restore it from a known-good copy`);
    process.exit(2);
  }
}

// A filesystem write init cannot make — a file where a home should be, a
// permission — is a tool error naming the path and the way out, never a
// stack trace and never exit 1, which means violations (R-D-fail-closed,
// R-D-errors-name-remedy).
function writeOrStop(what: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error(`init cannot write ${what} (${(e as Error).message}); fix the tree so the declared homes can be created, then run init again`);
    process.exit(2);
  }
}

// init seeds an empty tree (R-D-init-seeds): the declared homes, each kept
// by a placeholder file so a clone sees what a checkout sees, and a pair of
// artifacts true by construction — an Evidence that the record was started,
// and the genuinely open Decision the seeding forces. The pair is a worked
// example of the form, not a connectivity necessity — M-12 passes a record
// of one. The context template is written only on --context, and a template
// so asked for lands red (M-26, its sentinel) until filled: a to-do the
// asker accepted, never a red the seeding promised away.
if (cmd === "init") {
  const today = new Date().toISOString().slice(0, 10);
  const seeded: string[] = [];
  const withContext = args.includes("--context");
  // An argument the command does not understand is an intention not
  // honoured, and honouring it with exit 0 would be a false success
  // (R-D-fail-closed): the stop names the input and the remedy
  // (R-D-errors-name-remedy).
  const stray = args.slice(1).find((a) => a !== "--context");
  if (stray !== undefined) {
    console.error(`init does not understand ${stray}; init takes --context only`);
    process.exit(2);
  }
  adoptCarriedSpec();
  const ctxFile = FORMAT.context?.file;
  const sentinel = FORMAT.context?.sentinel;
  if (withContext && (typeof ctxFile !== "string" || typeof sentinel !== "string")) {
    console.error("--context asks for the context template, and the format declares no context section; drop the flag or declare one");
    process.exit(2);
  }

  const homes: string[] = [];
  for (const t of Object.values(FORMAT.types)) {
    if (typeof t?.home === "string") homes.push(t.home);
  }
  for (const home of homes) {
    const dir = resolve(root, home);
    let held = false;
    try {
      held = existsSync(dir) && readdirSync(dir).some((n) => n.endsWith(".md"));
    } catch (e) {
      console.error(`types home ${home} cannot be read as a directory (${(e as Error).message}); fix the declared home or the tree`);
      process.exit(2);
    }
    if (held) {
      console.error(`a record already stands — ${home} holds artifacts; init seeds an empty tree only, so write into the record instead`);
      process.exit(2);
    }
  }

  const eHome = FORMAT.types["E"]?.home;
  const dHome = FORMAT.types["D"]?.home;
  if (typeof eHome !== "string" || typeof dHome !== "string") {
    console.error("the format declares no Evidence or Decision home; init has nowhere to seed — declare a home under types in spec/format.json, or write the record by hand");
    process.exit(2);
  }

  for (const home of homes) {
    const dir = resolve(root, home);
    writeOrStop(home, () => {
      mkdirSync(dir, { recursive: true });
      const keep = join(dir, ".gitkeep");
      if (!existsSync(keep)) writeFileSync(keep, "");
    });
  }

  const evidence = `# R-E-record-started — The record was started

**Grade.** \`measured\`
**Recorded.** ${today}
**Source.** Running \`snubber init\`.

\`snubber init\` created the declared homes and seeded the record's first pair: this
Evidence, and the open Decision R-D-what-this-record-governs. Measured, because the
command ran — the one fact a seeding can assert.
`;
  const decision = `# R-D-what-this-record-governs — What this record governs

**Status.** \`open\`
**Opened.** ${today}
**Settles when.** What this record governs is named in a closed Ruling's Scope, or ruled \`none\` deliberately.

## Question

R-E-record-started records that this record exists; nothing yet records what it is for.
Which parts of this repository should a closed Ruling bind, and which stay outside the
record's reach? The seeding cannot answer — what a record governs is the first thing only
its project can decide.
`;
  writeOrStop(join(eHome, "R-E-record-started.md"), () => writeFileSync(resolve(root, eHome, "R-E-record-started.md"), evidence));
  seeded.push(join(eHome, "R-E-record-started.md"));
  writeOrStop(join(dHome, "R-D-what-this-record-governs.md"), () => writeFileSync(resolve(root, dHome, "R-D-what-this-record-governs.md"), decision));
  seeded.push(join(dHome, "R-D-what-this-record-governs.md"));

  if (withContext && typeof ctxFile === "string" && typeof sentinel === "string" && !existsSync(resolve(root, ctxFile))) {
    const section = (title: string) => `# ${title}\n\n${sentinel}\n`;
    const template = [
      "What this is",
      "Who this is for",
      "Vocabulary",
      "Non-goals",
      "Where things live",
    ].map(section).join("\n");
    writeOrStop(ctxFile, () => {
      mkdirSync(resolve(root, ctxFile, ".."), { recursive: true });
      writeFileSync(resolve(root, ctxFile), template);
    });
    seeded.push(ctxFile);
  }

  console.log(`seeded ${seeded.join(", ")}`);
  if (withContext) {
    console.log(
      `next: fill each ${ctxFile ?? "context"} section and remove its sentinel, or delete the file — the template you asked for is red until then; then git init (the repository is what git reports), then snubber check`,
    );
  } else {
    // The --context hint is offered only where the flag would work: a
    // format with no context section makes it an error, not an option.
    const hint =
      typeof ctxFile === "string" && typeof sentinel === "string"
        ? "; snubber init --context also seeds the context template, red until filled"
        : "";
    console.log(`next: git init (the repository is what git reports), then snubber check${hint}`);
  }
  process.exit(0);
}

// rules and board take nothing; the same contract as check and init — an
// argument the command does not understand is a stop with the input named
// (R-D-fail-closed), never a run that quietly ignored it.
if ((cmd === "rules" || cmd === "board") && args.length > 1) {
  console.error(`${cmd} does not understand ${args[1]}; ${cmd} takes no arguments`);
  process.exit(2);
}

if (cmd === "rules") {
  adoptCarriedSpec();
  for (const r of FORMAT.rules) console.log(`${r.id}  ${r.name.padEnd(28)} ${r.text}`);
  process.exit(0);
}

if (cmd === "board") {
  const { ctx } = checkOrStop(root);
  const arts = ctx.artifacts.filter((a) => !a.inert);
  const decisions = arts.filter((a) => FORMAT.types[a.type]?.name === "Decision");
  const evidence = arts.filter((a) => FORMAT.types[a.type]?.name === "Evidence");
  const work = arts.filter((a) => FORMAT.types[a.type]?.name === "Work");
  const grade = (a: (typeof arts)[number]) => stripValue(a.fields.get("Grade") ?? "");

  const open = decisions.filter((a) => derive(a.type, a.events) !== "closed");
  const assumed = evidence.filter((a) => grade(a) === "assumed");
  const reported = evidence.filter((a) => grade(a) === "reported");
  const inFlight = work.filter((a) => derive(a.type, a.events) === "open");

  const title = (a: (typeof arts)[number]) => {
    const hl = a.headingLines[0];
    return hl === undefined ? "" : a.lines[hl - 1]?.replace(/^# \S+(?: — )?/, "") ?? "";
  };
  console.log(`\nOpen questions (${open.length})`);
  for (const d of open) console.log(`  ${d.id}  ${title(d)}`);
  console.log(`\nLeaned on and never verified (${assumed.length} assumed, ${reported.length} reported)`);
  for (const e of [...assumed, ...reported]) console.log(`  ${e.id}  ${(e.fields.get("Source") ?? "").slice(0, 78)}`);
  console.log(`\nWork in flight (${inFlight.length})`);
  for (const w of inFlight) console.log(`  ${w.id}  ${title(w)}`);

  // Before M-14's gate an unmatched Scope is the expected state, and
  // needs-a-look gets a view: the gap is reported here rather than turned
  // into a violation.
  const unmatched = unmatchedScope(ctx);
  console.log(`\nScope that does not hold (${unmatched.length})`);
  for (const u of unmatched) {
    console.log(`  ${u.id}  ${u.glob}${u.gated ? "  (gated — M-14 cannot see it yet)" : ""}`);
  }
  console.log();
  process.exit(0);
}

if (cmd !== "check") usage(cmd);

let only: string | undefined;
const rest = args.slice(1);
const ruleFlag = rest.indexOf("--rule");
if (ruleFlag >= 0) {
  only = rest[ruleFlag + 1];
  // The missing argument is its own site with its own words
  // (R-D-fail-closed, R-D-errors-name-remedy); the ID itself is validated inside check(),
  // against the interpreting spec, once load() has adopted it.
  if (only === undefined || only.startsWith("--")) {
    console.error("--rule is missing its argument; give one of the rule IDs `snubber rules` lists");
    process.exit(2);
  }
  rest.splice(ruleFlag, 2);
}
// Same contract as init: an argument check does not understand is a stop
// with the input named, never a run that quietly ignored it.
if (rest.length > 0) {
  console.error(`check does not understand ${rest[0]}; check takes --rule M-nn only`);
  process.exit(2);
}

const { violations, ctx } = checkOrStop(root, only);

for (const v of violations) {
  const where = v.path.startsWith("/") ? relative(root, v.path) + (v.line ? `:${v.line}` : "") : v.path + (v.line ? `:${v.line}` : "");
  console.log(`${v.rule}  ${where}  ${v.message}`);
}

const n = ctx.artifacts.length;
// The count is what ran — the implementations — never the interpreting
// spec's declaration list: a report claiming rules that never executed
// would be coverage the run did not have.
const rules = only ? 1 : RULES.length;
if (violations.length === 0) {
  console.log(`clean — ${n} artifacts, ${rules} rules`);
  process.exit(0);
}
console.log(`\n${violations.length} violation(s) — ${n} artifacts, ${rules} rules`);
process.exit(1);
