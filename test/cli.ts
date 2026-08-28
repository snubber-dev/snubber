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
import { D, base, buildTree, REPO, type Tree } from "./fixture.ts";

type CliCase = {
  name: string;
  args: string[];
  tree?: Tree; // defaults to a green base() tree
  exit: 0 | 1 | 2;
  out?: string; // exact stdout
  err?: string; // exact stderr
  outHas?: string[]; // substrings of stdout
  errHas?: string[]; // substrings of stderr — the remedy clauses
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
  {
    name: "rules lists the interpreting spec's rules; exit 0",
    args: ["rules"],
    exit: 0,
    err: "",
    outHas: ["M-01", "M-19", "M-31"],
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
        env: { ...process.env, SNUBBER_ROOT: root },
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
