import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// The required Node version has exactly one home: engines.node in
// package.json. Everything else reads it — @types/node pins a types
// package for the compiler, never the runtime floor.
const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(here, "..", "package.json"), "utf8"));

// The floor is one number behind an optional >= — the only shape the guard
// implements, and the only shape the field's home ruling allows it. A range
// the guard cannot read is an error, never a pass: a guard that silently
// decides it has nothing to say switches off the published artifact's only
// floor (R-D-fail-closed).
const declared: unknown = pkg.engines?.node;
const parsed = typeof declared === "string" ? /^\s*(?:>=\s*)?(\d+(?:\.\d+){0,2})\s*$/.exec(declared) : null;

export const REQUIRED: string = parsed?.[1] ?? "";

export function cmp(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Below the required version Node fails to strip types, and the error is a
// syntax error in a file the reader did not write — the worst available
// message. This guard replaces it with one that names the remedy.
export function assertRuntime(): void {
  if (!REQUIRED) {
    console.error(
      `package.json engines.node ${JSON.stringify(declared ?? null)} is not one number this guard can read; state the floor as one number, like ">=22.18"`,
    );
    process.exit(2);
  }
  if (cmp(process.versions.node, REQUIRED) < 0) {
    console.error(
      `snubber needs Node ${REQUIRED} or later to run TypeScript directly; this is ${process.versions.node}`,
    );
    process.exit(2);
  }
}
