// The CLI's own battery: the tool spawned as a consumer spawns it, asserting
// the only contract anyone outside this repository sees — the exit code, the
// stream each line went to, and the words. 0 is a verdict of clean, 1 is a
// verdict of violations, 2 is the tool declining to give one; nothing else
// tests that, and the README and the site both promise it.
//
// What a case asserts is split by what kind of output it is. Machine-shaped
// output — the counts, the `rule  path:line  message` lines, the board's
// sections — is matched exactly: it is the contract, and a change to it
// should break loudly. Human-shaped error prose is matched by the clause
// R-D-errors-name-remedy makes non-negotiable — the remedy — leaving the
// sentence around it free to be improved without a battery edit.
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { RULES } from "../src/rules/index.ts";
import { D, SPEC, base, buildTree, REPO, type Tree } from "./fixture.ts";

type CliCase = {
  name: string;
  args: string[];
  tree?: Tree; // defaults to a green base() tree
  env?: Record<string, string>; // over the spawn environment
  exit: 0 | 1 | 2;
  out?: string; // exact stdout
  err?: string; // exact stderr
  outHas?: string[]; // substrings of stdout
  errHas?: string[]; // substrings of stderr — the remedy clauses
  outWithin?: number; // every stdout line at most this many code points
};

// The fixture root is a fresh temp directory per case, so any message naming
// it is unassertable until the name is put back. <ROOT> is that name.
const ROOT = "<ROOT>";

// The two counts the report carries, each read from the thing the tool counts
// rather than written out as a digit: a literal here would be a second copy of
// the rule list's length and of the fixture's shape, to keep in step by hand.
// What the cases pin is the sentence and which number goes where — that a full
// run reports every implementation and `--rule` reports the one that ran.
const N_RULES = RULES.length;
const N_ARTIFACTS = Object.keys(base()).filter((p) => p.endsWith(".md")).length;

// The rules the two `rules` forms are quoted through, read from the spec the
// fixture writes rather than copied into the case: a copy would go on
// asserting a rule text the spec has since reworded. A rule the spec does not
// declare is a case that cannot run, and a run of cases that did not run
// reporting a pass is the false success R-D-fail-closed forbids.
const specRules = (JSON.parse(SPEC) as { rules: { id: string; name: string; text: string }[] }).rules;
const rule = (id: string) => {
  const r = specRules.find((x) => x.id === id);
  if (r === undefined) {
    console.error(`the spec the fixture writes declares no ${id}, and the \`rules\` cases quote it; point them at a rule it declares`);
    process.exit(2);
  }
  return r;
};
// M-03 for the forms themselves: its text is one short sentence, so the whole
// of either form fits an assertion. M-01 for the break between a rule's
// statement and the prose that draws its boundaries — the laid-out form's
// whole gain, and a thing one sentence cannot show. At the ceiling M-01's
// first sentence fits a single line, so the case can carry the break itself.
const M3 = rule("M-03");
const M1 = rule("M-01");
// Where the battery expects that break to fall, stated here rather than
// imported from the CLI: the case says where a reader expects the paragraph
// to end, so a heuristic that moves breaks it loudly instead of agreeing with
// itself.
const M1_CUT = M1.text.indexOf(". ");
if (M1_CUT < 0) {
  console.error(`${M1.id}'s text carries no sentence end for the laid-out case to expect; quote a rule whose text does, or drop the case`);
  process.exit(2);
}
const M1_STATEMENT = M1.text.slice(0, M1_CUT + 1);
const M1_COMMENTARY = M1.text.slice(M1_CUT + 2).split(" ").slice(0, 4).join(" ");

// The green base() tree with one field written below the body: M-19's
// tripwire, and the smallest red a case can be. Derived from the one D the
// fixture builds, never copied — a copy would let this battery go on testing
// a decision the other battery has already stopped using.
const RED = D + "\n**Status.** `open`\n";
const red = () => ({ files: base({ "record/decisions/R-D-first.md": RED }) });
const empty = () => ({ files: {} });

const cases: CliCase[] = [
  // ---- check: the three verdicts ----
  {
    name: "check on a green tree: clean, the counts, exit 0",
    args: ["check"],
    exit: 0,
    out: `clean — ${N_ARTIFACTS} artifacts, ${N_RULES} rules\n`,
    err: "",
  },
  {
    name: "check on a red tree: the violation line carries rule, path, line and message; exit 1",
    args: ["check"],
    tree: red(),
    exit: 1,
    out: `M-19  record/decisions/R-D-first.md:17  field Status outside the field run\n\n1 violation(s) — ${N_ARTIFACTS} artifacts, ${N_RULES} rules\n`,
    err: "",
  },
  {
    name: "check with no record: the tool declines to judge, names the root and the remedy; exit 2",
    args: ["check"],
    tree: empty(),
    exit: 2,
    out: "",
    err: `no record found under ${ROOT} — no declared home exists; run snubber init\n`,
    errHas: ["run snubber init"],
  },

  // ---- check --rule: the count reports what ran, never what was declared ----
  {
    name: "check --rule on a green tree: one rule ran, and the count says so",
    args: ["check", "--rule", "M-01"],
    exit: 0,
    out: `clean — ${N_ARTIFACTS} artifacts, 1 rules\n`,
    err: "",
  },
  {
    name: "check --rule naming the rule that fires: exit 1, and still one rule ran",
    args: ["check", "--rule", "M-19"],
    tree: red(),
    exit: 1,
    out: `M-19  record/decisions/R-D-first.md:17  field Status outside the field run\n\n1 violation(s) — ${N_ARTIFACTS} artifacts, 1 rules\n`,
    err: "",
  },
  {
    name: "check --rule naming a rule the interpreting spec does not declare: exit 2",
    args: ["check", "--rule", "M-99"],
    exit: 2,
    out: "",
    err: "--rule M-99 names no rule the interpreting spec declares; give one of the rule IDs `snubber rules` lists\n",
    errHas: ["give one of the rule IDs `snubber rules` lists"],
  },
  {
    name: "check --rule with nothing after it: its own site, its own words; exit 2",
    args: ["check", "--rule"],
    exit: 2,
    out: "",
    err: "--rule is missing its argument; give one of the rule IDs `snubber rules` lists\n",
  },
  {
    name: "check --rule followed by a flag: a flag is not the missing argument; exit 2",
    args: ["check", "--rule", "--context"],
    exit: 2,
    out: "",
    err: "--rule is missing its argument; give one of the rule IDs `snubber rules` lists\n",
  },

  // ---- arguments a command does not understand: named, never ignored ----
  {
    name: "check with a stray argument: the input is named; exit 2",
    args: ["check", "bogus"],
    exit: 2,
    out: "",
    err: "check does not understand bogus; check takes --rule M-nn only\n",
    errHas: ["check takes --rule M-nn only"],
  },
  {
    name: "a command that is not a command: the input is named and the commands listed; exit 2",
    args: ["bogus"],
    exit: 2,
    out: "",
    err: "snubber does not understand bogus; the commands are: check [--rule M-nn], board, rules, init [--context]\n",
  },
  {
    name: "rules with a stray argument: exit 2",
    args: ["rules", "extra"],
    exit: 2,
    out: "",
    err: "rules does not understand extra; rules takes no arguments\n",
  },
  {
    name: "board with a stray argument: exit 2",
    args: ["board", "extra"],
    exit: 2,
    out: "",
    err: "board does not understand extra; board takes no arguments\n",
  },

  // ---- rules and board ----
  // The two forms of `rules`. Piped — which is how the battery spawns it, and
  // how a grep or a diff reads it — one rule per line, matched exactly: that
  // line is the machine-shaped half of this command's contract. Given a width,
  // the same rules laid out for a reader, which promises two things worth
  // pinning: the id and name head their own line, and no line runs past the
  // measure.
  {
    name: "rules piped: the interpreting spec's rules, one per line; exit 0",
    args: ["rules"],
    exit: 0,
    err: "",
    outHas: ["M-01", "M-19", "M-31", `\n${M3.id}  ${M3.name.padEnd(28)} ${M3.text}\n`],
  },
  {
    name: "rules at a named width: laid out under its id, within the measure; exit 0",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "60" },
    exit: 0,
    err: "",
    outHas: [`\n${M3.id}  ${M3.name}\n  ${M3.text}\n`],
    outWithin: 60,
  },
  {
    name: "rules with a width the tool cannot read: the input is named; exit 2",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "wide" },
    exit: 2,
    out: "",
    err: `SNUBBER_COLUMNS is "wide", which names no width; give a whole number of columns, 40 to 100, or unset it to let the terminal answer\n`,
    errHas: ["give a whole number of columns, 40 to 100"],
  },
  // A form Number() would happily read: the contract says digits, so
  // scientific notation is an input the tool cannot read, not a hundred.
  {
    name: "rules with a width in a form the contract does not name: exit 2",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "1e2" },
    exit: 2,
    out: "",
    errHas: ["names no width", "give a whole number of columns, 40 to 100"],
  },
  // The measure has a floor and a ceiling, and a named width is an intention:
  // outside them the tool stops rather than quietly laying out to some other
  // width. A terminal's reported width is a window, not an intention — that
  // one is drawn in, and no case here can open a pty to pin it.
  {
    name: "rules below the floor of the measure: the range is named; exit 2",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "10" },
    exit: 2,
    out: "",
    err: `SNUBBER_COLUMNS is 10, which is outside the measure prose lays out to; give a whole number of columns, 40 to 100, or unset it to let the terminal answer\n`,
  },
  {
    name: "rules above the ceiling of the measure: the range is named; exit 2",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "120" },
    exit: 2,
    out: "",
    errHas: ["give a whole number of columns, 40 to 100"],
  },
  {
    name: "rules at the ceiling: the rule's statement, then its prose, as two paragraphs; exit 0",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "100" },
    exit: 0,
    err: "",
    // No newline ahead of the id: M-01 heads the listing, and demanding one
    // would be the case asserting the spec's rule order as well as the form.
    outHas: [`${M1.id}  ${M1.name}\n  ${M1_STATEMENT}\n\n  ${M1_COMMENTARY}`],
    outWithin: 100,
  },
  {
    name: "rules at the floor itself: honoured, within the measure; exit 0",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "40" },
    exit: 0,
    err: "",
    outWithin: 40,
  },
  // An empty value is how a shell unsets a variable for one command: no
  // width named, and the pipe answers — the machine form.
  {
    name: "rules with an empty SNUBBER_COLUMNS: no width named, the pipe answers; exit 0",
    args: ["rules"],
    env: { SNUBBER_COLUMNS: "" },
    exit: 0,
    err: "",
    outHas: [`\n${M3.id}  ${M3.name.padEnd(28)} ${M3.text}\n`],
  },
  {
    name: "board on a green tree: four sections, each with its count; exit 0",
    args: ["board"],
    exit: 0,
    err: "",
    out: "\nOpen questions (0)\n\nLeaned on and never verified (0 assumed, 0 reported)\n\nWork in flight (0)\n\nScope that does not hold (0)\n\n",
  },

  // ---- init ----
  {
    name: "init on an empty tree seeds the pair and names what comes next; exit 0",
    args: ["init"],
    tree: empty(),
    exit: 0,
    err: "",
    out:
      "seeded record/evidence/R-E-record-started.md, record/decisions/R-D-what-this-record-governs.md\n" +
      "next: git init (the repository is what git reports), then snubber check; snubber init --context also seeds the context template, red until filled\n",
  },
  {
    name: "init --context also seeds the template, and says it is red until filled; exit 0",
    args: ["init", "--context"],
    tree: empty(),
    exit: 0,
    err: "",
    out:
      "seeded record/evidence/R-E-record-started.md, record/decisions/R-D-what-this-record-governs.md, record/context.md\n" +
      "next: fill each record/context.md section and remove its sentinel, or delete the file — the template you asked for is red until then; then git init (the repository is what git reports), then snubber check\n",
  },
  {
    name: "init where a record already stands refuses rather than seeding over it; exit 2",
    args: ["init"],
    exit: 2,
    out: "",
    err: "a record already stands — record/evidence/ holds artifacts; init seeds an empty tree only, so write into the record instead\n",
    errHas: ["write into the record instead"],
  },
  {
    name: "init with a flag it does not take: the input is named; exit 2",
    args: ["init", "--bogus"],
    tree: empty(),
    exit: 2,
    out: "",
    err: "init does not understand --bogus; init takes --context only\n",
  },

  // ---- a spec the checker cannot read stops every command that reads it ----
  // The parser's own words vary by Node version, so these match the remedy
  // clause rather than the sentence.
  {
    name: "check against a spec that will not parse: exit 2, nothing to interpret",
    args: ["check"],
    tree: { files: base(), rawSpec: "{ not json" },
    exit: 2,
    out: "",
    errHas: ["spec/format.json does not parse:", "the checker has nothing to interpret"],
  },
  {
    name: "rules against a spec that will not parse: the same stop, by its own path; exit 2",
    args: ["rules"],
    tree: { files: base(), rawSpec: "{ not json" },
    exit: 2,
    out: "",
    errHas: ["spec/format.json does not parse:", "the checker has nothing to interpret"],
  },
  {
    name: "check against a spec that parses but is not the declared shape: the JSON path is named; exit 2",
    args: ["check"],
    tree: { files: base(), spec: (s: any) => { s.types = "nope"; } },
    exit: 2,
    out: "",
    err: "spec/format.json types is not an object; the checker reads the spec as the shape it declares — fix that value or restore it from a known-good copy\n",
  },
  {
    name: "rules against a spec that is not the declared shape: the same stop; exit 2",
    args: ["rules"],
    tree: { files: base(), spec: (s: any) => { s.types = "nope"; } },
    exit: 2,
    out: "",
    err: "spec/format.json types is not an object; the checker reads the spec as the shape it declares — fix that value or restore it from a known-good copy\n",
  },
];

// A target is a way to spawn the tool. `src` is the source the scripts already
// run; `dist` is what a consumer installs. The same case list runs against
// each requested target, so the two can never cover different ground.
const TARGETS: Record<string, string> = {
  src: resolve(REPO, "src", "cli.ts"),
  dist: resolve(REPO, "dist", "cli.js"),
};
// Named as an argument or in the environment, so a CI file and a Windows
// shell can both ask for the same thing; the argument wins where both speak.
// Which of the two spoke is carried into every stop below: a remedy naming
// the knob the caller did not touch is no remedy (R-D-errors-name-remedy).
const arg = process.argv[2];
const asked = arg ?? process.env.SNUBBER_CLI_TARGETS ?? "src";
const knob = arg !== undefined ? "the target argument" : "SNUBBER_CLI_TARGETS";
const requested = asked.split(",").map((t) => t.trim()).filter(Boolean);

// An empty ask is not an ask for nothing: `??` passes a set-but-empty
// SNUBBER_CLI_TARGETS straight through, and a run of no cases reporting a
// pass is the false success R-D-fail-closed forbids.
if (requested.length === 0) {
  console.error(`${knob} is ${JSON.stringify(asked)}, which names no target; give one of ${Object.keys(TARGETS).join(", ")}, or leave it unset for src`);
  process.exit(2);
}

// Every requested name is resolved to its entry once, here, and the run loop
// below reads that list — so the guard that answers an absent key is also what
// carries the answer forward. Looking the name up a second time would leave the
// compiler asking about absence again, and the only cheap reply there is the
// assertion R-D-strict-indexing rules out.
const runs: { name: string; entry: string }[] = [];
for (const t of requested) {
  const entry = TARGETS[t];
  if (entry === undefined) {
    console.error(`${knob} names ${t}, which is not a target; the targets are ${Object.keys(TARGETS).join(", ")}`);
    process.exit(2);
  }
  // A target that cannot be spawned is not a target to skip: a case that did
  // not run reporting a pass is the false success R-D-fail-closed forbids.
  if (!existsSync(entry)) {
    console.error(`target ${t} is ${entry}, which does not exist; run npm run build before asking for it, or drop it from ${knob}`);
    process.exit(2);
  }
  runs.push({ name: t, entry });
}

let failed = 0;
let passed = 0;

for (const { name: t, entry } of runs) {
  for (const c of cases) {
    const root = buildTree(c.tree ?? { files: base() });
    const label = runs.length > 1 ? `[${t}] ${c.name}` : c.name;
    try {
      const r = spawnSync(process.execPath, [entry, ...c.args], {
        // The knobs the cases assert are the cases' to set: a developer who
        // has SNUBBER_COLUMNS in their own shell would otherwise be running a
        // different battery than CI runs.
        env: { ...process.env, SNUBBER_ROOT: root, SNUBBER_COLUMNS: undefined, ...c.env },
        encoding: "utf8",
      });
      const norm = (s: string) => s.split(root).join(ROOT);
      const stdout = norm(r.stdout ?? "");
      const stderr = norm(r.stderr ?? "");
      const bad: string[] = [];

      if (r.status !== c.exit) bad.push(`exit: expected ${c.exit}, got ${r.status}`);
      if (c.out !== undefined && stdout !== c.out) bad.push(`stdout: expected ${JSON.stringify(c.out)}, got ${JSON.stringify(stdout)}`);
      if (c.err !== undefined && stderr !== c.err) bad.push(`stderr: expected ${JSON.stringify(c.err)}, got ${JSON.stringify(stderr)}`);
      for (const s of c.outHas ?? []) if (!stdout.includes(s)) bad.push(`stdout is missing ${JSON.stringify(s)}; got ${JSON.stringify(stdout)}`);
      for (const s of c.errHas ?? []) if (!stderr.includes(s)) bad.push(`stderr is missing ${JSON.stringify(s)}; got ${JSON.stringify(stderr)}`);
      if (c.outWithin !== undefined) {
        // Measured in code points, as M-15 measures a line: the rule texts
        // carry em dashes, and a byte count would call a laid-out line long.
        const within = c.outWithin;
        const over = stdout.split("\n").filter((l) => [...l].length > within);
        if (over.length > 0) bad.push(`stdout has ${over.length} line(s) over ${c.outWithin} columns; first is ${JSON.stringify(over[0])}`);
      }

      if (bad.length === 0) passed++;
      else {
        failed++;
        console.log(`FAIL  ${label}`);
        for (const b of bad) console.log(`  ${b}`);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
