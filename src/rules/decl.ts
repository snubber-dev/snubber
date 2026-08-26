import { FORMAT } from "../format.ts";
import { stripValue } from "../values.ts";
import { closingKinds } from "./status.ts";
import type { Artifact } from "../parse.ts";

// Readings of the type declarations that more than one rule needs. Everything
// here is read from spec/format.json, never hardcoded.

export function eventMapFields(type: string, kind: string): Set<string> {
  const t = FORMAT.types[type];
  return new Set([...(t?.event_fields?.[kind] ?? []), ...(t?.optional_event_fields?.[kind] ?? [])]);
}

export function allEventMapped(type: string): Set<string> {
  const t = FORMAT.types[type];
  const out = new Set<string>();
  for (const m of [t?.event_fields ?? {}, t?.optional_event_fields ?? {}]) {
    for (const list of Object.values(m)) for (const f of list) out.add(f);
  }
  return out;
}

// Every field any closed_requires of the type's own declarations names,
// whatever the artifact's declared value.
export function closedRequiresNames(type: string): Set<string> {
  const t = FORMAT.types[type];
  const out = new Set<string>();
  for (const fd of Object.values(t?.fields ?? {})) {
    for (const entry of Object.values(fd.values ?? {})) {
      for (const f of entry.closed_requires ?? []) out.add(f);
    }
  }
  return out;
}

// The requirements the artifact's own declared field values impose at a
// closing event (M-05's closed_requires clause).
export function imposedClosedRequires(a: Artifact): Set<string> {
  const t = FORMAT.types[a.type];
  const out = new Set<string>();
  for (const [name, fd] of Object.entries(t?.fields ?? {})) {
    if (!fd.values) continue;
    const val = stripValue(a.fields.get(name) ?? "");
    for (const f of fd.values[val]?.closed_requires ?? []) out.add(f);
  }
  return out;
}

// A misplaced run: an event block whose run is empty while field-shaped lines
// naming its required fields stand inside the block. M-05 merges those
// absences into one red pointed at the layout; M-19's tripwire passes the
// block's mapped-label lines over.
export type MisplacedRun = { eventIndex: number; passOverLines: Set<number>; namedRequired: Set<string> };

export function misplacedRuns(a: Artifact): MisplacedRun[] {
  const t = FORMAT.types[a.type];
  if (!t) return [];
  const closing = closingKinds(a.type);
  const out: MisplacedRun[] = [];
  a.events.forEach((e, idx) => {
    if (!e.runEmpty) return;
    const strays = a.strayFields.filter((s) => s.eventIndex === idx);
    if (!strays.length) return;
    const required = new Set(t.event_fields?.[e.kind] ?? []);
    if (closing.has(e.kind)) for (const f of imposedClosedRequires(a)) required.add(f);
    const namedRequired = new Set(strays.map((s) => s.key).filter((k) => required.has(k)));
    if (!namedRequired.size) return;
    const mapped = eventMapFields(a.type, e.kind);
    if (closing.has(e.kind)) for (const f of closedRequiresNames(a.type)) mapped.add(f);
    const passOverLines = new Set(strays.filter((s) => mapped.has(s.key)).map((s) => s.line));
    out.push({ eventIndex: idx, passOverLines, namedRequired });
  });
  return out;
}
