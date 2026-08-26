import { FORMAT } from "../format.ts";
import { stripValue } from "../values.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

// A regex is not enough: a value can match the shape and not be a day, so it
// is round-tripped through a calendar and has to come back unchanged.
export function isCalendarDate(s: string): boolean {
  if (!new RegExp(FORMAT.grammar.date.value).test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Event dates do not decrease in file order, and no event date precedes the
// artifact's Opened date. An absent or malformed Opened is M-05's or M-21's
// and is passed over; the ordering among event dates still binds.
export const M20: Rule = {
  id: "M-20",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const openedRaw = a.fields.get("Opened");
      const opened = openedRaw !== undefined && isCalendarDate(stripValue(openedRaw)) ? stripValue(openedRaw) : null;
      let prev = "";
      let prevKind = "";
      for (const e of a.events) {
        if (opened && e.date < opened) {
          v.push({ rule: "M-20", path: a.path, line: e.line, message: `${e.kind} is dated ${e.date}, before Opened on ${opened}` });
        }
        if (prev && e.date < prev) {
          v.push({ rule: "M-20", path: a.path, line: e.line, message: `${e.kind} is dated ${e.date}, before ${prevKind} on ${prev}` });
        }
        prev = e.date;
        prevKind = e.kind;
      }
    }
    return v;
  },
};

// Which fields are dates is declared in spec/format.json, never here.
export const M21: Rule = {
  id: "M-21",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const t = FORMAT.types[a.type];
      if (!t) continue;
      for (const [name, fd] of Object.entries(t.fields)) {
        if (!fd.date) continue;
        const places: { raw: string; line?: number }[] = [];
        const opening = a.fields.get(name);
        if (opening !== undefined) places.push({ raw: opening });
        for (const e of a.events) {
          const er = e.fields.get(name);
          if (er !== undefined) places.push({ raw: er, line: e.line });
        }
        for (const p of places) {
          const val = stripValue(p.raw);
          if (!isCalendarDate(val)) {
            v.push({ rule: "M-21", path: a.path, line: p.line, message: `${name} is ${val}, not a YYYY-MM-DD calendar day` });
          }
        }
      }
      for (const e of a.events) {
        if (!isCalendarDate(e.date)) {
          v.push({ rule: "M-21", path: a.path, line: e.line, message: `${e.kind} is dated ${e.date}, not a real calendar day` });
        }
      }
    }
    return v;
  },
};
