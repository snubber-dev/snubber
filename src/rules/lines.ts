import { FORMAT } from "../format.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

// The measure is the raw line, in code points — never bytes, never columns. A
// line lying wholly inside a fenced block is exempt: the fence is the
// deliberate escape for verbatim long content, and no field line can use it.
// The context file gets no exemption — it is not an artifact and masking never
// reaches it. An immutable type is exempt, deliberately: it is where the
// format sends verbatim external data.
export const M15: Rule = {
  id: "M-15",
  run: (c) => {
    const limit = FORMAT.limits.line_length;
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (FORMAT.types[a.type]?.mutable !== true) continue;
      a.lines.forEach((l, i) => {
        if (a.fenced[i]) return;
        if ([...l].length > limit) {
          v.push({ rule: "M-15", path: a.path, line: i + 1, message: `line is ${[...l].length} characters` });
        }
      });
    }
    const ctx = FORMAT.context;
    if (c.contextLines && ctx) {
      c.contextLines.forEach((l, i) => {
        if ([...l].length > limit) {
          v.push({ rule: "M-15", path: ctx.file, line: i + 1, message: `line is ${[...l].length} characters` });
        }
      });
    }
    return v;
  },
};

// A proxy, and labelled as one: it makes a Work item too small to become a
// Decision. Detecting rationale is judgment and belongs to a reviewer.
export const M16: Rule = {
  id: "M-16",
  run: (c) => {
    const limit = FORMAT.limits.work_words;
    return active(c)
      .filter((a) => a.type === wordBudgetType() && a.bodyWords > limit)
      .map((a) => ({ rule: "M-16", path: a.path, message: `Work item body is ${a.bodyWords} words, over ${limit}` }));
  },
};

// The budgeted type is the one the limit is named for. Work is the only type
// with a word budget; the name, not the letter, is the anchor.
function wordBudgetType(): string {
  for (const [letter, t] of Object.entries(FORMAT.types)) {
    if (t.name === "Work") return letter;
  }
  return "";
}

// The record has no invisible ink: a comment renders as nothing while its
// interior parses at full strength. Code is the opposite trade, visible and
// inert, and is the escape for quoting the sequence.
export const M31: Rule = {
  id: "M-31",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      a.maskedLines.forEach((l, i) => {
        if (l.includes("<!--")) {
          v.push({ rule: "M-31", path: a.path, line: i + 1, message: "comment opener in the masked text" });
        }
      });
    }
    return v;
  },
};
