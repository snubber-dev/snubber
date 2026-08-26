import { posix } from "node:path";
import { FORMAT } from "../format.ts";
import { active } from "./types.ts";
import type { Ctx, Rule, Violation } from "./types.ts";
import type { Artifact } from "../parse.ts";

// A destination carrying a URI scheme is external; M-13 alone reads it.
export const isExternal = (dest: string) => /^[A-Za-z][A-Za-z0-9+.-]*:/.test(dest);

// The resolved, repository-root-relative path every rule's containment,
// existence and artifact test reads (parsing.links). A #fragment strips before
// resolution; a leading / resolves from the repository root.
export function destPath(a: Artifact, dest: string): string {
  const clean = dest.split("#")[0] ?? "";
  if (clean.startsWith("/")) return posix.normalize(clean.slice(1));
  return posix.normalize(posix.join(a.dir, clean));
}

// Resolution succeeds only at a file: a directory destination does not
// resolve, and neither does one empty after the fragment strip.
export function resolves(c: Ctx, a: Artifact, dest: string): boolean {
  if (dest.split("#")[0] === "") return false;
  const p = destPath(a, dest);
  return !p.startsWith("..") && c.fileSet.has(p);
}

function mutableType(a: Artifact): boolean {
  return FORMAT.types[a.type]?.mutable === true;
}

const RECORD = "record/";

export const M01: Rule = {
  id: "M-01",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!mutableType(a)) continue; // links from an immutable artifact are historical
      for (const l of a.links) {
        if (isExternal(l.dest)) continue;
        const p = destPath(a, l.dest);
        if (!p.startsWith(RECORD)) continue; // everywhere else is M-13's
        if (!resolves(c, a, l.dest)) {
          v.push({ rule: "M-01", path: a.path, line: l.line, message: `link to ${l.dest} does not resolve` });
        }
      }
    }
    return v;
  },
};

export const M13: Rule = {
  id: "M-13",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!mutableType(a)) continue;
      for (const l of a.links) {
        if (isExternal(l.dest)) {
          // The web is cited by re-deriving it as this record's Evidence, or
          // it appears code-spanned — never as a live link the tree cannot
          // watch. This red is the tripwire that says so.
          v.push({ rule: "M-13", path: a.path, line: l.line, message: `external link to ${l.dest}` });
          continue;
        }
        const p = destPath(a, l.dest);
        if (p.startsWith(RECORD)) continue; // M-01's alone
        if (!resolves(c, a, l.dest)) {
          v.push({ rule: "M-13", path: a.path, line: l.line, message: `link to ${l.dest} does not resolve inside the repository` });
        }
      }

      // Bare web references: a maximal whitespace-free token containing ://
      // in the masked text, outside every link's destination and title. Link
      // text is prose to this scan; a definition line stays unread by it.
      a.maskedLines.forEach((line, i) => {
        const ln = i + 1;
        if (a.defLines.has(ln)) return;
        let scrubbed = line;
        for (const l of a.links) {
          if (l.line !== ln || l.destStart < 0) continue;
          scrubbed =
            scrubbed.slice(0, l.destStart) +
            " ".repeat(l.destEnd + 1 - l.destStart) +
            scrubbed.slice(l.destEnd + 1);
        }
        for (const m of scrubbed.matchAll(/\S+/g)) {
          if (m[0].includes("://")) {
            v.push({ rule: "M-13", path: a.path, line: ln, message: `bare web reference ${m[0]}` });
          }
        }
      });
    }
    return v;
  },
};

const isPathish = (s: string) => /^\S+$/.test(s) && (s.includes("/") || /\./.test(s));
const base = (dest: string) => (dest.split("#")[0] ?? "").split("/").filter(Boolean).pop() ?? "";

export const M18: Rule = {
  id: "M-18",
  run: (c) => {
    const ID = new RegExp(FORMAT.id.grammar);
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!mutableType(a)) continue;
      for (const l of a.links) {
        if (l.image) continue; // no rule binds alt text
        if (isExternal(l.dest)) continue; // M-13 owns it; its text is unbound
        const p = destPath(a, l.dest);
        if (c.artifactPaths.has(p)) continue; // M-24's alone
        const text = l.text.trim();
        if (ID.test(text)) {
          const stem = base(l.dest).replace(/\.md$/, "");
          if (stem !== text) {
            v.push({ rule: "M-18", path: a.path, line: l.line, message: `link text ${text} points at ${stem || l.dest}` });
          }
        } else if (isPathish(text)) {
          // Basename against basename, because a text naming a file from the
          // repository root and a destination relative to the artifact are
          // both honest.
          const want = base(text);
          const got = base(l.dest);
          if (want !== got) {
            v.push({ rule: "M-18", path: a.path, line: l.line, message: `link text names ${want} and the destination is ${got || l.dest}` });
          }
        }
      }
    }
    return v;
  },
};

// Where a link's destination is an artifact, the text is that artifact's ID —
// closing the form rather than checking it.
export const M24: Rule = {
  id: "M-24",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!mutableType(a)) continue;
      for (const l of a.links) {
        if (l.image || isExternal(l.dest)) continue;
        const target = c.artifactPaths.get(destPath(a, l.dest));
        if (!target) continue;
        if (l.text.trim() !== target.id) {
          v.push({ rule: "M-24", path: a.path, line: l.line, message: `link text is not the ID ${target.id}` });
        }
      }
    }
    return v;
  },
};
