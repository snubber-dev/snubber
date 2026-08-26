import { FORMAT } from "../format.ts";
import { splitList } from "../values.ts";
import { derive } from "./status.ts";
import { destPath, isExternal } from "./links.ts";
import { active } from "./types.ts";
import type { Rule, Violation } from "./types.ts";

// Participation, not reachability: islands larger than one pass, and a record
// with exactly one artifact passes — a red no author can avoid teaches that
// red is sometimes fine.
export const M12: Rule = {
  id: "M-12",
  run: (c) => {
    const arts = active(c);
    if (arts.length <= 1) return [];
    const inbound = new Set<string>();
    const outbound = new Map<string, boolean>();
    for (const a of arts) {
      let out = false;
      for (const r of a.refs) {
        if (r.id !== a.id && c.byId.has(r.id)) { out = true; inbound.add(r.id); }
      }
      for (const l of a.links) {
        if (isExternal(l.dest)) continue;
        const target = c.artifactPaths.get(destPath(a, l.dest));
        if (target && target.id !== a.id) { out = true; inbound.add(target.id); }
      }
      outbound.set(a.id, out);
    }
    return arts
      .filter((a) => !outbound.get(a.id) && !inbound.has(a.id))
      .map((a) => ({ rule: "M-12", path: a.path, message: `${a.id} references nothing and nothing references it` }));
  },
};

// Code spans inside a raw field value, paired as the masking pairs them.
function valueSpans(value: string): string[] {
  const runs: { start: number; len: number }[] = [];
  for (const m of value.matchAll(/`+/g)) runs.push({ start: m.index, len: m[0].length });
  const spans: string[] = [];
  let i = 0;
  while (i < runs.length) {
    const open = runs[i];
    if (open === undefined) break;
    let j = i + 1;
    let close = runs[j];
    while (close !== undefined && close.len !== open.len) close = runs[++j];
    if (close !== undefined) {
      spans.push(value.slice(open.start + open.len, close.start));
      i = j + 1;
    } else i++;
  }
  return spans;
}

export const M17: Rule = {
  id: "M-17",
  run: (c) => {
    const ID = new RegExp(FORMAT.id.grammar);
    const v: Violation[] = [];
    for (const a of active(c)) {
      // A token that matches the grammar and resolves to nothing is a
      // violation, never prose — demotion on failure would turn a typo into
      // silence.
      const seen = new Set<string>();
      for (const r of a.refs) {
        if (c.byId.has(r.id) || seen.has(r.id)) continue;
        seen.add(r.id);
        v.push({ rule: "M-17", path: a.path, line: r.line, message: `reference to ${r.id}, which is not an artifact here` });
      }
      // Inside a declared field's value the code-span escape closes: a span
      // whose entire content, trimmed, matches the ID grammar is a violation —
      // in a field value an artifact is named bare or not at all. The unit is
      // the span, never a token, and the read is the raw value as written.
      const inspect = (key: string, raw: string, line: number, declared: boolean) => {
        if (!declared) return;
        for (const s of valueSpans(raw)) {
          if (ID.test(s.trim())) {
            v.push({ rule: "M-17", path: a.path, line, message: `${key} carries the code-spanned ID ${s.trim()}` });
          }
        }
      };
      for (const e of a.entries) inspect(e.key, e.value, e.line, e.declared);
      for (const ev of a.events) for (const e of ev.entries) inspect(e.key, e.value, e.line, e.declared);
    }
    return v;
  },
};

export const M23: Rule = {
  id: "M-23",
  run: (c) => {
    const v: Violation[] = [];
    for (const a of active(c)) {
      const blockedBy = a.fields.get("Blocked by");
      if (blockedBy === undefined) continue;
      if (derive(a.type, a.events) !== "open") continue;
      const line = a.entries.find((e) => e.key === "Blocked by")?.line;
      for (const item of splitList(blockedBy)) {
        const blocker = c.byId.get(item);
        // A reference that resolves to nothing is M-17's; a named artifact of
        // another type is passed over — only Work blocks Work.
        if (!blocker || blocker.type !== a.type) continue;
        const state = derive(blocker.type, blocker.events);
        if (state === "closed") {
          v.push({ rule: "M-23", path: a.path, line, message: `Blocked by ${item}, which is closed` });
        }
      }
    }
    return v;
  },
};

// No Evidence reaches itself by following Supersedes values. M-29 owns length
// one; this rule the rest. The walk follows resolving items only.
export const M30: Rule = {
  id: "M-30",
  run: (c) => {
    const edges = new Map<string, string[]>();
    for (const a of active(c)) {
      const raw = a.fields.get("Supersedes");
      if (raw === undefined) continue;
      edges.set(a.id, splitList(raw).filter((i) => i !== a.id && c.byId.has(i)));
    }
    const v: Violation[] = [];
    for (const a of active(c)) {
      if (!edges.has(a.id)) continue;
      const queue = [...(edges.get(a.id) ?? [])];
      const seen = new Set<string>();
      let cyclic = false;
      while (queue.length) {
        const n = queue.shift();
        if (n === undefined) break;
        if (n === a.id) { cyclic = true; break; }
        if (seen.has(n)) continue;
        seen.add(n);
        queue.push(...(edges.get(n) ?? []));
      }
      if (cyclic) {
        v.push({ rule: "M-30", path: a.path, message: `${a.id} reaches itself by following Supersedes` });
      }
    }
    return v;
  },
};
