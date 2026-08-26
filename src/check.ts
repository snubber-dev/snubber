import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { posix, sep } from "node:path";
import { FORMAT, FORMAT_RAW, setFormat } from "./format.ts";
import { parseArtifact } from "./parse.ts";
import type { Artifact } from "./parse.ts";
import { RULES } from "./rules/index.ts";
import type { Ctx, Violation } from "./rules/types.ts";

const toPosix = (p: string) => p.split(sep).join("/");

// A tool error: the checker stops without judging, with an error code and a
// message naming the remedy — never a verdict (spec/v0.md).
export class ToolStop extends Error {}

// A spec that will not parse is a tool error: the checker stops, having
// nothing to interpret. Loads-but-incoherent is red; will-not-parse is
// silence with an error code (spec/v0.md).
export class SpecUnreadable extends ToolStop {}

// The parser reads captures from the grammar it interprets: a heading's ID is
// group 1, a field line's key and value are groups 1 and 2, an event's kind
// and date are groups 1 and 2. A grammar that compiles to fewer groups — or
// does not compile at all — cannot answer what the parser asks; an
// uninterpretable grammar stops the checker the way an unparseable spec does
// (spec/v0.md). The strict indexed-access flip surfaced the hole: these
// reads are only total because this gate makes them so.
function assertGrammarReadable(specPath: string): void {
  const reads: [string, number][] = [
    ["heading", 1],
    ["field", 2],
    ["event", 2],
    ["event_prefix", 0],
    ["date", 0],
  ];
  const grammar = FORMAT.grammar as Record<string, { value?: unknown } | undefined>;
  for (const [name, groupsRead] of reads) {
    const pattern = grammar[name]?.value;
    if (typeof pattern !== "string") {
      throw new SpecUnreadable(`${specPath} grammar.${name} is not a pattern string; the checker has nothing to interpret`);
    }
    let groups: number;
    try {
      // The empty alternative matches at once with every group unfilled, so
      // the match array's length counts the pattern's capture groups.
      groups = (new RegExp(pattern + "|").exec("")?.length ?? 1) - 1;
    } catch (e) {
      throw new SpecUnreadable(
        `${specPath} grammar.${name} does not compile as a regular expression: ${(e as Error).message}; the checker has nothing to interpret`,
      );
    }
    if (groups < groupsRead) {
      throw new SpecUnreadable(
        `${specPath} grammar.${name} captures ${groups} group(s) where the parser reads ${groupsRead}; the checker has nothing to interpret`,
      );
    }
  }
  try {
    new RegExp(FORMAT.id.grammar);
  } catch (e) {
    throw new SpecUnreadable(
      `${specPath} id.grammar does not compile as a regular expression: ${(e as Error).message}; the checker has nothing to interpret`,
    );
  }
}

// The repository is what git reports present and not ignored: tracked files
// plus untracked files no ignore rule excludes, via git ls-files — one
// listing, git's own, never a second ignore parser (R-D-present-not-ignored). No
// git is an error, not a fallback: a walk would quietly answer with a
// different repository. Artifacts are deliberately NOT gathered from this
// listing — the loader reads the declared homes directly, so a gitignored
// Decision is still checked; if that separation ever falls, ignoring
// record/ would empty the check and report success.
function listRepository(root: string): string[] {
  let out: string;
  try {
    out = execFileSync("git", ["-C", root, "ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT") {
      throw new ToolStop("git was not found; the repository is what git reports, so the checker needs git on PATH");
    }
    const detail = (err.stderr ?? err.message ?? "").trim().split("\n")[0] ?? "";
    throw new ToolStop(`git cannot list ${root} (${detail}); the repository is what git reports, never a walk — run git init first`);
  }
  // A tracked path deleted from the working tree is reported by --cached and
  // is not present; presence is the ruling's own word.
  return out.split("\0").filter((p) => p !== "" && existsSync(join(root, p)));
}

export function load(root: string): Ctx {
  // A record ships its spec, and the carried copy is the one interpreted
  // (spec/v0.md). A tree carrying none is read by the shipped copy.
  const specFile = resolve(root, "spec", "format.json");
  let specRaw: unknown = FORMAT_RAW;
  // A tree carrying no spec is read by the shipped copy, and any spec-rule
  // red then belongs to a file the tree does not contain — the path says so
  // rather than pointing at nothing.
  const carried = existsSync(specFile);
  const specPath = carried ? "spec/format.json" : "format.json (snubber's shipped copy)";
  if (carried) {
    try {
      specRaw = JSON.parse(readFileSync(specFile, "utf8"));
    } catch (e) {
      throw new SpecUnreadable(`${specPath} does not parse: ${(e as Error).message}; the checker has nothing to interpret`);
    }
  }
  // The carried copy is read as the shape the checker declares before any
  // rule runs (R-D-spec-read-as-ruled): a spec that parses but fails that
  // reading stops the run as a tool error naming the path — never a crash
  // on a later indexed read, and never a quiet verdict under the shipped
  // copy, which interprets only a tree carrying no spec of its own. The
  // stop is R-D-fail-closed's behaviour; incoherence within a
  // readable shape stays the spec rules' red.
  const unshaped = setFormat(specRaw);
  if (unshaped !== null) {
    throw new SpecUnreadable(
      `${specPath} ${unshaped}; the checker reads the spec as the shape it declares — fix that value or restore it from a known-good copy`,
    );
  }
  assertGrammarReadable(specPath);

  // Artifacts are gathered by walking the declared homes for .md files; a file
  // sitting in no home is invisible to every rule (M-25's stated ceiling). A
  // declared home the filesystem cannot answer as a directory — a file at
  // that path — is a stop naming the declaration, never a crash: the read is
  // the spec's, and R-D-spec-read-as-ruled's behaviour follows it out of the
  // file and onto the tree.
  const artifacts: Artifact[] = [];
  for (const [letter, def] of Object.entries(FORMAT.types)) {
    if (typeof def?.home !== "string") continue;
    const dir = resolve(root, def.home);
    if (!existsSync(dir)) continue;
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch (e) {
      throw new ToolStop(
        `types.${letter}.home (${def.home}) cannot be read as a directory (${(e as Error).message}); fix the declared home or the tree`,
      );
    }
    for (const name of names) {
      if (!name.endsWith(".md")) continue;
      const rel = toPosix(relative(root, join(dir, name)));
      // A name ending in .md that cannot be read as a file — a directory, a
      // permission — is a tool stop naming the path, not a verdict and not a
      // stack trace (R-D-fail-closed, R-D-errors-name-remedy); the parser's own errors are
      // bugs and keep their trace.
      try {
        artifacts.push(parseArtifact(rel, name.replace(/\.md$/, ""), posix.dirname(rel), join(dir, name)));
      } catch (e) {
        if (!(e instanceof Error && "code" in e)) throw e;
        throw new ToolStop(`${rel} cannot be read as a file (${e.message}); make it a readable markdown file or move it out of ${def.home}`);
      }
    }
  }

  // Three states where there were two (R-D-init-seeds): no declared home at
  // all is not-started; homes that exist and hold nothing are a record
  // someone emptied or a seeding that wrote nothing; neither is a verdict,
  // because invoking the checker is itself the stated intention
  // (R-D-fail-closed) and a green from a run where nothing ran would
  // be a false answer. Sparse is not empty: one artifact is a record.
  if (artifacts.length === 0) {
    const homes = Object.values(FORMAT.types)
      .map((t) => t?.home)
      .filter((h): h is string => typeof h === "string");
    const standing = homes.filter((h) => existsSync(resolve(root, h)));
    if (standing.length === 0) {
      throw new ToolStop(`no record found under ${root} — no declared home exists; run snubber init`);
    }
    throw new ToolStop(
      `the record holds no artifacts — ${standing.join(", ")} ${standing.length === 1 ? "exists but holds" : "exist but hold"} no .md file; write a Decision under ${homes.find((h) => h.includes("decision")) ?? homes[0] ?? "a declared home"}, or seed a fresh tree with snubber init`,
    );
  }

  const files = listRepository(root);
  // git does not report directories; every ancestor of a listed file is one.
  const dirs = new Set<string>();
  for (const f of files) {
    let d = posix.dirname(f);
    while (d !== "." && !dirs.has(d)) {
      dirs.add(d);
      d = posix.dirname(d);
    }
  }

  const contextPath = FORMAT.context?.file ? resolve(root, FORMAT.context.file) : null;
  let contextLines: string[] | null = null;
  if (contextPath && existsSync(contextPath)) {
    try {
      contextLines = readFileSync(contextPath, "utf8").replace(/\r\n/g, "\n").split("\n");
    } catch (e) {
      throw new ToolStop(
        `context.file (${FORMAT.context?.file}) cannot be read as a file (${(e as Error).message}); fix the declared path or the tree`,
      );
    }
  }

  // The stem is the identity and the first parsed claimant keeps it while
  // M-03 reds the duplicate — checkers agree even mid-violation. A stem the
  // grammar rejects binds nothing further, so it is no link target either.
  const byId = new Map<string, Artifact>();
  const artifactPaths = new Map<string, Artifact>();
  for (const a of artifacts) {
    if (!byId.has(a.id)) byId.set(a.id, a);
    if (!a.inert) artifactPaths.set(a.path, a);
  }

  return {
    root,
    artifacts,
    byId,
    artifactPaths,
    files,
    fileSet: new Set(files),
    dirSet: dirs,
    contextLines,
    specRaw,
    specPath,
  };
}

export function check(root: string, only?: string): { violations: Violation[]; ctx: Ctx } {
  const ctx = load(root);
  // --rule is validated against the interpreting spec — the carried copy,
  // once load() has adopted it — never the shipped list. An ID the spec
  // declares but this checker does not implement is its own stop: running
  // zero rules and reporting clean would be a gate that cannot fail.
  if (only !== undefined) {
    if (!FORMAT.rules.some((r) => r.id === only)) {
      throw new ToolStop(`--rule ${only} names no rule the interpreting spec declares; give one of the rule IDs \`snubber rules\` lists`);
    }
    if (!RULES.some((r) => r.id === only)) {
      throw new ToolStop(`${only} is declared by the interpreting spec, and this checker has no implementation of it; run without --rule`);
    }
  }
  const rules = only ? RULES.filter((r) => r.id === only) : RULES;
  const violations: Violation[] = [];
  for (const r of rules) violations.push(...r.run(ctx));
  return { violations, ctx };
}
