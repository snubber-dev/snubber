// The fixture trees both batteries are built on. run.ts calls check() against
// them in process; cli.ts spawns the CLI at them. One builder, so the two
// instruments can never disagree about what a fixture tree is.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const SPEC = readFileSync(resolve(here, "..", "spec", "format.json"), "utf8");
export const REPO = resolve(here, "..");

export const D = `# R-D-first — The first decision

**Status.** \`closed\`
**Opened.** 2026-08-21

## Question

Does the checker check? [R-E-seed](../evidence/R-E-seed.md) suggests it must.

## Closed — 2026-08-21

**Ruling.** The checker checks.
**Scope.** \`src/**\`, \`spec/format.json\`

Argument prose here.
`;

export const E = `# R-E-seed — A seed measurement

**Grade.** \`measured\`
**Recorded.** 2026-08-21
**Source.** Running the suite by hand.

The observation: R-D-first was checkable.
`;

export const W = (over: Partial<{ id: string; kind: string; status: string; body: string; fields: string; events: string }> = {}) => {
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

export const base = (extra: Record<string, string> = {}): Record<string, string> => ({
  "record/decisions/R-D-first.md": D,
  "record/evidence/R-E-seed.md": E,
  "src/cli.ts": "x\n",
  ...extra,
});

export type Tree = {
  files?: Record<string, string>;
  dirs?: string[]; // directories created bare, for the unreadable-artifact case
  spec?: (s: any) => void;
  rawSpec?: string; // verbatim spec file content, for the will-not-parse case
};

// The repository is what git reports (R-D-present-not-ignored), so every
// fixture is a git repository; its files are untracked and not ignored, which
// the listing includes, so no commit is needed.
export function buildTree(t: Tree): string {
  const root = mkdtempSync(join(tmpdir(), "snubber-test-"));
  execFileSync("git", ["-C", root, "init", "-q"]);
  mkdirSync(join(root, "spec"), { recursive: true });
  if (t.rawSpec !== undefined) {
    writeFileSync(join(root, "spec", "format.json"), t.rawSpec);
  } else {
    const spec = JSON.parse(SPEC);
    if (t.spec) t.spec(spec);
    writeFileSync(join(root, "spec", "format.json"), JSON.stringify(spec, null, 2));
  }
  for (const [rel, content] of Object.entries(t.files ?? {})) {
    mkdirSync(join(root, dirname(rel)), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  for (const rel of t.dirs ?? []) mkdirSync(join(root, rel), { recursive: true });
  return root;
}
