import { FORMAT } from "../format.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

// The stem is the identity: resolution and uniqueness read the stem, and the
// heading is checked against it. A stem the grammar rejects earns one red and
// binds nothing further — the remedy is a rename or a move.
export const M02: Rule = {
  id: "M-02",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of c.artifacts) {
      if (a.inert) {
        v.push({ rule: "M-02", path: a.path, message: `file stem ${a.stem} does not match the ID grammar` });
        continue;
      }
      if (a.headingCount >= 1 && a.headingId !== a.stem) {
        v.push({ rule: "M-02", path: a.path, line: a.headingLines[0], message: `heading ${a.headingId} does not equal the stem ${a.stem}` });
      }
    }
    return v;
  },
};

export const M03: Rule = {
  id: "M-03",
  run: (c) => {
    const seen = new Map<string, string>();
    const v: Violation[] = [];
    for (const a of c.artifacts) {
      const prior = seen.get(a.id);
      if (prior) v.push({ rule: "M-03", path: a.path, message: `ID ${a.id} is also the ID of ${prior}` });
      else seen.set(a.id, a.path);
    }
    return v;
  },
};

export const M04: Rule = {
  id: "M-04",
  run: (c) =>
    active(c)
      .filter((a) => a.headingCount !== 1)
      .map((a) => ({
        rule: "M-04", path: a.path, line: a.headingLines[1],
        message: `${a.headingCount} lines match the heading grammar`,
      })),
};

// Placement, not identity — which is why it is not M-02. Artifacts are
// gathered by walking the declared homes, so this catches a type sitting in
// another type's home and cannot see a file sitting in no home at all.
export const M25: Rule = {
  id: "M-25",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const home = FORMAT.types[a.type]?.home;
      if (home && !a.path.startsWith(home)) {
        v.push({ rule: "M-25", path: a.path, message: `${a.type} does not live in ${home}` });
      }
    }
    return v;
  },
};
