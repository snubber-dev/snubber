import { FORMAT } from "../format.ts";
import { globToRegExp } from "../md.ts";
import { stripValue, splitList } from "../values.ts";
import { derive, closingKinds } from "./status.ts";
import { active } from "./types.ts";
import type { Ctx, Rule, Violation } from "./types.ts";
import type { EventBlock } from "../parse.ts";

// The gate: a closed Work item naming the Decision under Under. Under reads as
// items, and a closing Work opens the gate for every Decision it names. The
// gate is coarse and opt-in, deliberately.
function gatedOpen(c: Ctx): Set<string> {
  const open = new Set<string>();
  for (const w of active(c)) {
    const under = w.fields.get("Under");
    if (under === undefined) continue;
    if (derive(w.type, w.events) !== "closed") continue;
    for (const item of splitList(under)) {
      if (c.byId.has(item)) open.add(item);
    }
  }
  return open;
}

// The Scope read is the latest closing event's; earlier Scopes are history.
function latestClosing(type: string, events: EventBlock[]): EventBlock | null {
  const closing = closingKinds(type);
  let latest: EventBlock | null = null;
  for (const e of events) if (closing.has(e.kind)) latest = e;
  return latest;
}

type ScopeGlob = { glob: string; absent: boolean };

function scopeGlobs(raw: string): ScopeGlob[] | "none" {
  if (stripValue(raw) === "none") return "none";
  return splitList(raw)
    .filter((g) => g !== "")
    .map((g) => (g.startsWith("!<") ? { glob: g.slice(2), absent: true } : { glob: g, absent: false }));
}

export const M14: Rule = {
  id: "M-14",
  run: (c) => {
    const gate = gatedOpen(c);
    const scopeField = FORMAT.scope.field;
    const v: Violation[] = [];
    for (const d of active(c)) {
      if (!gate.has(d.id)) continue;
      // The subject is a closed Decision's Scope. A reopened Decision keeps
      // its last closing event as history, and Scope is legal only in a
      // closing block — so it has no way to correct the glob until it closes
      // again; the board's view carries the stale Scope meanwhile.
      if (derive(d.type, d.events) !== "closed") continue;
      const e = latestClosing(d.type, d.events);
      if (!e) continue;
      const raw = e.fields.get(scopeField);
      if (raw === undefined) continue; // M-05's violation; the Decision is passed over here
      const globs = scopeGlobs(raw);
      if (globs === "none") continue; // no file carries the ruling, exempt
      for (const g of globs) {
        const re = globToRegExp(g.glob);
        const matches = c.files.some((f) => re.test(f));
        if (!g.absent && !matches) {
          v.push({ rule: "M-14", path: d.path, line: e.line, message: `Scope glob ${g.glob} matches no file` });
        }
        if (g.absent && matches) {
          v.push({ rule: "M-14", path: d.path, line: e.line, message: `absent-glob !<${g.glob} still matches a file` });
        }
      }
    }
    return v;
  },
};

// Before the gate, an unmatched positive glob — or a still-matching
// absent-glob — is a report for a view, never a violation: needs-a-look gets a
// view. The board reads this.
export function unmatchedScope(c: Ctx): { id: string; glob: string; gated: boolean }[] {
  const gate = gatedOpen(c);
  const scopeField = FORMAT.scope.field;
  const out: { id: string; glob: string; gated: boolean }[] = [];
  for (const d of active(c)) {
    const e = latestClosing(d.type, d.events);
    if (!e) continue;
    const raw = e.fields.get(scopeField);
    if (raw === undefined) continue;
    const globs = scopeGlobs(raw);
    if (globs === "none") continue;
    for (const g of globs) {
      const re = globToRegExp(g.glob);
      const matches = c.files.some((f) => re.test(f));
      if ((!g.absent && !matches) || (g.absent && matches)) {
        out.push({ id: d.id, glob: (g.absent ? "!<" : "") + g.glob, gated: !gate.has(d.id) });
      }
    }
  }
  return out;
}
