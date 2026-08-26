import { derivationFor, transitionsFor, FORMAT } from "../format.ts";
import { stripValue } from "../values.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

// Status is a materialised view of the event sequence, never an authority.
// The derivation reads the last keyed event in file order; an event the
// derivation does not key is skipped here and is M-09's business.
export function derive(type: string, events: { kind: string }[]): string {
  const table = derivationFor(type);
  if (!table) return "";
  let status = table["none"] ?? "";
  for (const e of events) {
    const s = table[e.kind];
    if (s !== undefined) status = s;
  }
  return status;
}

export const M07: Rule = {
  id: "M-07",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!derivationFor(a.type)) continue;
      const raw = a.fields.get("Status");
      if (raw === undefined) continue; // absence is M-05's and is passed over
      const declared = stripValue(raw);
      const derived = derive(a.type, a.events);
      if (declared !== derived) {
        v.push({ rule: "M-07", path: a.path, message: `Status is ${declared}; the events derive ${derived}` });
      }
    }
    return v;
  },
};

// A line matching the event prefix that misses the full event grammar is an
// error, never prose — and never an event: no other rule sees the line.
export const M08: Rule = {
  id: "M-08",
  run: (c) =>
    active(c).flatMap((a) =>
      a.badEventLines.map((b) => ({
        rule: "M-08", path: a.path, line: b.line,
        message: `event heading does not match the grammar: ${b.text.trim()}`,
      })),
    ),
};

// Legality from the state the predecessors produce, read with the same
// pass-over M-07 uses. An event its type's transitions map has no row for is
// legal from no state.
export const M09: Rule = {
  id: "M-09",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const legal = transitionsFor(a.type);
      if (!legal) continue;
      const seen: { kind: string }[] = [];
      for (const e of a.events) {
        const from = derive(a.type, seen);
        const allowed = legal[e.kind] ?? [];
        if (!allowed.includes(from)) {
          v.push({ rule: "M-09", path: a.path, line: e.line, message: `${e.kind} is illegal from ${from}` });
        }
        seen.push(e);
      }
    }
    return v;
  },
};

// Which events a type's derivation keys to closed — the closing events M-05's
// closed_requires and M-14's Scope read both need.
export function closingKinds(type: string): Set<string> {
  const table = derivationFor(type) ?? {};
  return new Set(Object.entries(table).filter(([k, s]) => k !== "none" && s === "closed").map(([k]) => k));
}

export { FORMAT };
