import { FORMAT } from "../format.ts";
import { stripValue, splitList } from "../values.ts";
import { closingKinds } from "./status.ts";
import {
  eventMapFields, allEventMapped, closedRequiresNames, imposedClosedRequires, misplacedRuns,
} from "./decl.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

export const M05: Rule = {
  id: "M-05",
  run: (c) => {
    const ID = new RegExp(FORMAT.id.grammar);
    const v: Violation[] = [];
    for (const a of active(c)) {
      const t = FORMAT.types[a.type];
      if (!t) continue;
      const closing = closingKinds(a.type);
      const crNames = closedRequiresNames(a.type);
      const misplaced = misplacedRuns(a);

      for (const [name, fd] of Object.entries(t.fields)) {
        if (fd.required && !a.fields.has(name)) {
          v.push({ rule: "M-05", path: a.path, message: `missing required field ${name}` });
        }
      }

      a.events.forEach((e, idx) => {
        const m = misplaced.find((x) => x.eventIndex === idx);
        const required = new Set(t.event_fields?.[e.kind] ?? []);
        if (closing.has(e.kind)) for (const f of imposedClosedRequires(a)) required.add(f);
        const absentButNamed: string[] = [];
        for (const f of required) {
          if (e.fields.has(f)) continue;
          if (m?.namedRequired.has(f)) { absentButNamed.push(f); continue; }
          v.push({ rule: "M-05", path: a.path, line: e.line, message: `${e.kind} event is missing ${f}` });
        }
        // The merged red: the block misplaced its run. One mistake, one red,
        // pointed at the layout.
        if (absentButNamed.length) {
          v.push({
            rule: "M-05", path: a.path, line: e.line,
            message: `${e.kind} block misplaced its field run (${absentButNamed.sort().join(", ")})`,
          });
        }
      });

      // The ids-or-none contract binds wherever a closed_requires-named field
      // appears, whatever the artifact's declared value.
      const checkIdsOrNone = (name: string, raw: string, line?: number) => {
        if (stripValue(raw) === "none") return;
        for (const item of splitList(raw)) {
          if (ID.test(item) && c.byId.has(item)) continue;
          v.push({
            rule: "M-05", path: a.path, line,
            message: `${name} carries ${item || "an empty item"}, not bare resolving IDs or the literal none`,
          });
        }
      };
      for (const name of crNames) {
        const raw = a.fields.get(name);
        if (raw !== undefined) checkIdsOrNone(name, raw);
        for (const e of a.events) {
          if (!closing.has(e.kind)) continue;
          const er = e.fields.get(name);
          if (er !== undefined) checkIdsOrNone(name, er, e.line);
        }
      }

      // min_length, wherever the declaring field appears; the strip and trim
      // happen before any reading, length included.
      for (const [name, fd] of Object.entries(t.fields)) {
        if (fd.min_length === undefined) continue;
        const places: { raw: string; line?: number }[] = [];
        const opening = a.fields.get(name);
        if (opening !== undefined) places.push({ raw: opening });
        for (const e of a.events) {
          const er = e.fields.get(name);
          if (er !== undefined) places.push({ raw: er, line: e.line });
        }
        for (const p of places) {
          // Characters, in the file's measuring doctrine: code points.
          if ([...stripValue(p.raw)].length < fd.min_length) {
            v.push({ rule: "M-05", path: a.path, line: p.line, message: `${name} is shorter than ${fd.min_length} characters` });
          }
        }
      }
    }
    return v;
  },
};

export const M06: Rule = {
  id: "M-06",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const t = FORMAT.types[a.type];
      if (!t) continue;
      for (const [name, fd] of Object.entries(t.fields)) {
        if (!fd.values) continue;
        const allowed = Object.keys(fd.values);
        const places: { raw: string; line?: number }[] = [];
        const opening = a.fields.get(name);
        if (opening !== undefined) places.push({ raw: opening });
        for (const e of a.events) {
          const er = e.fields.get(name);
          if (er !== undefined) places.push({ raw: er, line: e.line });
        }
        for (const p of places) {
          const val = stripValue(p.raw);
          if (!allowed.includes(val)) {
            v.push({ rule: "M-06", path: a.path, line: p.line, message: `${name} is ${val}, not one of ${allowed.join(", ")}` });
          }
        }
      }
    }
    return v;
  },
};

// Position decides what is a field; this rule judges what position leaves
// over, and the runs are typed and closed.
export const M19: Rule = {
  id: "M-19",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const t = FORMAT.types[a.type];
      if (!t) continue;
      const closing = closingKinds(a.type);
      const crNames = closedRequiresNames(a.type);
      const mapped = allEventMapped(a.type);
      const passOver = new Set<number>();
      for (const m of misplacedRuns(a)) for (const l of m.passOverLines) passOver.add(l);

      for (const s of a.strayFields) {
        if (passOver.has(s.line)) continue;
        v.push({ rule: "M-19", path: a.path, line: s.line, message: `field ${s.key} outside the field run` });
      }
      for (const d of a.duplicateFields) {
        v.push({ rule: "M-19", path: a.path, line: d.line, message: `field ${d.key} appears twice in one run` });
      }
      for (const m of a.caseMismatches) {
        v.push({ rule: "M-19", path: a.path, line: m.line, message: `field ${m.rawKey} is declared as ${m.key}` });
      }

      // The opening run carries only the declared fields that belong to it —
      // every declared field the event maps do not name, plus any field a
      // closed_requires names, which is legal in both.
      for (const e of a.entries) {
        if (!e.declared) {
          v.push({ rule: "M-19", path: a.path, line: e.line, message: `undeclared field ${e.rawKey} inside the field run` });
          continue;
        }
        if (mapped.has(e.key) && !crNames.has(e.key)) {
          v.push({ rule: "M-19", path: a.path, line: e.line, message: `event field ${e.key} in the opening run` });
        }
      }
      // An event block carries only the fields its own event's maps name — in
      // a closing-event block also any closed_requires-named field.
      for (const e of a.events) {
        const legal = eventMapFields(a.type, e.kind);
        if (closing.has(e.kind)) for (const f of crNames) legal.add(f);
        for (const en of e.entries) {
          if (!en.declared) {
            v.push({ rule: "M-19", path: a.path, line: en.line, message: `undeclared field ${en.rawKey} inside the field run` });
            continue;
          }
          if (!legal.has(en.key)) {
            v.push({ rule: "M-19", path: a.path, line: en.line, message: `field ${en.key} does not belong in a ${e.kind} block` });
          }
        }
      }
    }
    return v;
  },
};

// No declared field's value names, bare, the artifact that carries it. The
// read is per item, after the whole-value strip — the strip decides, not the
// backticks.
export const M29: Rule = {
  id: "M-29",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const check = (key: string, raw: string, line?: number, declared?: boolean) => {
        if (!declared) return;
        for (const item of splitList(raw)) {
          if (item === a.id) {
            v.push({ rule: "M-29", path: a.path, line, message: `${key} names the artifact that carries it` });
          }
        }
      };
      for (const e of a.entries) check(e.key, e.value, e.line, e.declared);
      for (const ev of a.events) for (const e of ev.entries) check(e.key, e.value, e.line, e.declared);
    }
    return v;
  },
};
