import type { Artifact } from "../parse.ts";

export type Violation = { rule: string; path: string; line?: number; message: string };

export type Ctx = {
  root: string;
  artifacts: Artifact[];
  byId: Map<string, Artifact>; // keyed by stem — the identity (M-02)
  artifactPaths: Map<string, Artifact>; // root-relative path -> artifact
  files: string[]; // root-relative
  fileSet: Set<string>;
  dirSet: Set<string>;
  contextLines: string[] | null;
  specRaw: unknown; // the checked tree's spec/format.json, parsed untyped
  specPath: string; // root-relative path of that file
};

export type Rule = { id: string; run: (c: Ctx) => Violation[] };

// A stem the grammar rejects binds nothing further (M-02): it occupies the
// namespace and is an existing file to link resolution, and no other rule
// reads it.
export function active(c: Ctx): Artifact[] {
  return c.artifacts.filter((a) => !a.inert);
}
