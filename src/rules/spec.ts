import { FORMAT } from "../format.ts";
import type { Rule, Violation } from "./types.ts";

// The rules that judge the spec file itself. They read the checked tree's
// spec/format.json parsed untyped — a closed-set check cannot run over a type
// that has already discarded unknown keys.

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

function ruleIds(spec: Obj): Set<string> {
  const rules = Array.isArray(spec.rules) ? spec.rules : [];
  return new Set(rules.filter(isObj).map((r) => String(r.id)));
}

// Every declared field carries a read_by list, and every rule the list names
// exists in this file. Presence and resolution only: a field the
// implementation reads but the list omits is invisible here.

// Slices the field grammar's label group — the first group after the \*\*
// opener — by paren balance, escape-aware: a first-closer shortcut would
// truncate a nested group into an uncompilable fragment.
function extractLabelGroup(pattern: string): string | null {
  const at = pattern.search(/\\\*\\\*\(/);
  if (at < 0) return null;
  const start = at + 4; // index of the label group's opening parenthesis
  let depth = 0;
  for (let i = start; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return pattern.slice(start + 1, i);
    }
  }
  return null;
}

export const M22: Rule = {
  id: "M-22",
  run: (c) => {
    const v: Violation[] = [];
    const spec = c.specRaw;
    if (!isObj(spec) || !isObj(spec.types)) return v;
    const known = ruleIds(spec);
    for (const [letter, t] of Object.entries(spec.types)) {
      if (!isObj(t) || !isObj(t.fields)) continue;
      for (const [name, fd] of Object.entries(t.fields)) {
        if (!isObj(fd)) continue;
        if (!Array.isArray(fd.read_by)) {
          v.push({ rule: "M-22", path: c.specPath, message: `${letter}'s ${name} carries no read_by list` });
          continue;
        }
        for (const r of fd.read_by) {
          if (!known.has(String(r))) {
            v.push({ rule: "M-22", path: c.specPath, message: `${letter}'s ${name} names ${r}, which is not a rule here` });
          }
        }
      }
    }
    return v;
  },
};

// A tripwire is not prose: the check reads raw lines, so the sentinel cannot
// be quoted in the context file even inside code. A committed empty file is
// the sentinel with fewer characters.
export const M26: Rule = {
  id: "M-26",
  run: (c) => {
    const v: Violation[] = [];
    const ctx = FORMAT.context;
    if (!ctx || typeof ctx.file !== "string" || typeof ctx.sentinel !== "string") return v; // malformed is M-28's
    if (c.contextLines === null) return v; // absence is a state
    c.contextLines.forEach((l, i) => {
      if (l.includes(ctx.sentinel)) {
        v.push({ rule: "M-26", path: ctx.file, line: i + 1, message: "the unfilled sentinel survives in the tree" });
      }
    });
    if (!c.contextLines.some((l) => l.trim() !== "")) {
      v.push({ rule: "M-26", path: ctx.file, message: "the context file is empty" });
    }
    return v;
  },
};

// --- M-27: mirrors recomposition ---

type Candidate = { start: number; interior: string };

// Bracket character classes, ordered by opening delimiter.
function classCandidates(lit: string): Candidate[] {
  const out: Candidate[] = [];
  for (let i = 0; i < lit.length; i++) {
    if (lit[i] === "\\") { i++; continue; }
    if (lit[i] !== "[") continue;
    for (let j = i + 1; j < lit.length; j++) {
      if (lit[j] === "\\") { j++; continue; }
      if (lit[j] === "]") {
        out.push({ start: i, interior: lit.slice(i + 1, j) });
        i = j;
        break;
      }
    }
  }
  return out;
}

// Parenthesised groups carrying a top-level |, capturing or not, ordered by
// opening delimiter.
function altCandidates(lit: string): Candidate[] {
  const out: Candidate[] = [];
  for (let i = 0; i < lit.length; i++) {
    if (lit[i] === "\\") { i++; continue; }
    if (lit[i] === "[") { // skip classes
      for (let j = i + 1; j < lit.length; j++) {
        if (lit[j] === "\\") { j++; continue; }
        if (lit[j] === "]") { i = j; break; }
      }
      continue;
    }
    if (lit[i] !== "(") continue;
    let depth = 1;
    let topBar = false;
    let j = i + 1;
    for (; j < lit.length && depth > 0; j++) {
      const ch = lit[j];
      if (ch === "\\") { j++; continue; }
      if (ch === "[") {
        for (let k = j + 1; k < lit.length; k++) {
          if (lit[k] === "\\") { k++; continue; }
          if (lit[k] === "]") { j = k; break; }
        }
        continue;
      }
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "|" && depth === 1) topBar = true;
    }
    if (topBar) {
      let interior = lit.slice(i + 1, j - 1);
      if (interior.startsWith("?:")) interior = interior.slice(2);
      out.push({ start: i, interior });
    }
  }
  return out;
}

function atPath(spec: Obj, path: string): unknown {
  let cur: unknown = spec;
  for (const seg of path.split(".")) {
    if (!isObj(cur)) return undefined;
    cur = cur[seg];
  }
  return cur;
}

// Sets keep the file's declaration order, deduplicated at first appearance.
function unionAt(spec: Obj, path: string): string[] | null {
  const segs = path.split(".");
  const star = segs.indexOf("*");
  if (star < 0) return null;
  const head = segs.slice(0, star).join(".");
  const tail = segs.slice(star + 1);
  const host = head ? atPath(spec, head) : spec;
  if (!isObj(host)) return null;
  const out: string[] = [];
  for (const key of Object.keys(host)) {
    let cur: unknown = host[key];
    for (const seg of tail) {
      if (!isObj(cur)) { cur = undefined; break; }
      cur = cur[seg];
    }
    if (Array.isArray(cur)) for (const item of cur) if (!out.includes(String(item))) out.push(String(item));
  }
  return out;
}

type MirrorSite = { where: string; literal: string; mirrors: string[]; asserted_by: unknown };

function mirrorSites(node: unknown, where: string, out: MirrorSite[]): void {
  if (Array.isArray(node)) {
    node.forEach((n, i) => mirrorSites(n, `${where}[${i}]`, out));
    return;
  }
  if (!isObj(node)) return;
  const m = node.mirrors;
  if (Array.isArray(m) && m.length > 0) {
    const literal = typeof node.value === "string" ? node.value : typeof node.grammar === "string" ? node.grammar : null;
    if (literal !== null) {
      out.push({ where, literal, mirrors: m.map(String), asserted_by: node.asserted_by });
    }
  }
  for (const [k, val] of Object.entries(node)) mirrorSites(val, where ? `${where}.${k}` : k, out);
}

// Every value declaring a non-empty mirrors is recomposed from the named
// sources and compared for agreement. The literal is never trusted, only
// checked.
export const M27: Rule = {
  id: "M-27",
  run: (c) => {
    const v: Violation[] = [];
    const spec = c.specRaw;
    if (!isObj(spec)) return v;
    const known = ruleIds(spec);
    const sites: MirrorSite[] = [];
    mirrorSites(spec, "", sites);
    for (const site of sites) {
      if (typeof site.asserted_by !== "string" || !known.has(site.asserted_by)) {
        // Its own violation, independent of the comparison below: the
        // literal is still checked against its sources (M-27's text names
        // the two separately, and the literal is never trusted).
        v.push({ rule: "M-27", path: c.specPath, message: `${site.where} mirrors without a resolving asserted_by` });
      }
      const classes = classCandidates(site.literal);
      const alts = altCandidates(site.literal);
      let classI = 0;
      let altI = 0;
      for (const src of site.mirrors) {
        const keysM = src.match(/^keys\((.+)\)$/);
        const unionM = src.match(/^union\((.+)\)$/);
        if (keysM) {
          const host = atPath(spec, keysM[1] ?? "");
          const want = isObj(host) ? Object.keys(host).join("") : null;
          const cand = classes[classI++];
          if (want === null || !cand || cand.interior !== want) {
            v.push({ rule: "M-27", path: c.specPath, message: `${site.where} disagrees with ${src}` });
          }
        } else if (unionM) {
          const want = unionAt(spec, unionM[1] ?? "")?.join("|") ?? null;
          const cand = alts[altI++];
          if (want === null || !cand || cand.interior !== want) {
            v.push({ rule: "M-27", path: c.specPath, message: `${site.where} disagrees with ${src}` });
          }
        } else {
          const val = atPath(spec, src);
          if (typeof val !== "string") {
            v.push({ rule: "M-27", path: c.specPath, message: `${site.where} mirrors ${src}, which is not a value here` });
            continue;
          }
          const stripped = val.replace(/^\^/, "").replace(/\$$/, "");
          if (!site.literal.includes(stripped)) {
            v.push({ rule: "M-27", path: c.specPath, message: `${site.where} does not contain ${src}` });
          }
        }
      }
    }
    return v;
  },
};

// --- M-28: totality and the closed key sets ---

const TOP_KEYS = new Set(["format", "version", "note", "base", "id", "context", "types", "grammar", "status_derivation", "transitions", "scope", "limits", "rules", "parsing"]);
const BASE_KEYS = new Set(["vcs", "forge", "note"]);
const ID_KEYS = new Set(["grammar", "mirrors", "asserted_by", "note", "filename"]);
const CONTEXT_KEYS = new Set(["file", "sentinel", "note"]);
const GRAMMAR_KEYS = new Set(["heading", "field", "event", "event_prefix", "date"]);
const GRAMMAR_ENTRY_KEYS = new Set(["value", "mirrors", "asserted_by"]);
const TYPE_KEYS = new Set(["name", "home", "mutable", "events", "event_fields", "optional_event_fields", "fields"]);
const FIELD_KEYS = new Set(["required", "read_by", "values", "shape", "date", "min_length"]);
const VALUES_ENTRY_KEYS = new Set(["closed_requires"]);
const SCOPE_KEYS = new Set(["field", "value", "glob_dialect"]);
const DIALECT_KEYS = new Set(["anchor", "!<", "**", "*", "?", "character_classes", "braces", "note"]);
const LIMITS_KEYS = new Set(["line_length", "work_words", "word"]);
const RULE_KEYS = new Set(["id", "name", "text"]);
const PARSING_KEYS = new Set(["note", "mask_code", "field_values", "bare_refs", "links", "field_position", "cross_record_refs"]);

export const M28: Rule = {
  id: "M-28",
  run: (c) => {
    const v: Violation[] = [];
    const spec = c.specRaw;
    if (!isObj(spec)) return v;
    const red = (message: string) => v.push({ rule: "M-28", path: c.specPath, message });
    const closed = (obj: unknown, allowed: Set<string>, where: string) => {
      if (!isObj(obj)) return;
      for (const k of Object.keys(obj)) {
        if (!allowed.has(k)) red(`unknown key ${k} in ${where}`);
      }
    };

    closed(spec, TOP_KEYS, "the file");
    closed(spec.base, BASE_KEYS, "base");
    closed(spec.id, ID_KEYS, "id");
    if (spec.context !== undefined) {
      closed(spec.context, CONTEXT_KEYS, "context");
      if (isObj(spec.context) && (!("file" in spec.context) || !("sentinel" in spec.context))) {
        red("a present context section carries file and sentinel both");
      }
    }
    closed(spec.grammar, GRAMMAR_KEYS, "grammar");
    if (isObj(spec.grammar)) {
      for (const [k, entry] of Object.entries(spec.grammar)) closed(entry, GRAMMAR_ENTRY_KEYS, `grammar.${k}`);
    }
    closed(spec.scope, SCOPE_KEYS, "scope");
    if (isObj(spec.scope)) closed(spec.scope.glob_dialect, DIALECT_KEYS, "scope.glob_dialect");
    closed(spec.limits, LIMITS_KEYS, "limits");
    closed(spec.parsing, PARSING_KEYS, "parsing");
    if (Array.isArray(spec.rules)) {
      spec.rules.forEach((r, i) => closed(r, RULE_KEYS, `rules[${i}]`));
    }

    const types = isObj(spec.types) ? spec.types : {};
    const typeLetters = new Set(Object.keys(types));
    const fieldLabel = isObj(spec.grammar) && isObj((spec.grammar as Obj).field)
      ? String(((spec.grammar as Obj).field as Obj).value ?? "")
      : "";
    // The label group of the field grammar, as a whole-value test. The
    // group is sliced by paren balance, escape-aware, so a grammar nesting
    // groups inside the label still reads; the try is the residual ceiling
    // — parens inside a character class defeat the balance count — and a
    // group that still cannot compile leaves the clause untested rather
    // than crashing the run.
    const labelGroup = extractLabelGroup(fieldLabel);
    let labelRe: RegExp | null = null;
    if (labelGroup !== null) {
      try {
        labelRe = new RegExp(`^(?:${labelGroup})$`);
      } catch {
        labelRe = null;
      }
    }

    const derivation = isObj(spec.status_derivation) ? spec.status_derivation : {};
    const transitions = isObj(spec.transitions) ? spec.transitions : {};
    for (const k of Object.keys(derivation)) {
      if (k !== "note" && !typeLetters.has(k)) red(`status_derivation keys ${k}, which is not a type`);
    }
    for (const k of Object.keys(transitions)) {
      if (k !== "note" && !typeLetters.has(k)) red(`transitions keys ${k}, which is not a type`);
    }

    for (const [letter, tRaw] of Object.entries(types)) {
      if (!isObj(tRaw)) continue;
      closed(tRaw, TYPE_KEYS, `types.${letter}`);
      const events = Array.isArray(tRaw.events) ? tRaw.events.map(String) : [];
      const fields = isObj(tRaw.fields) ? tRaw.fields : {};
      const fieldNames = new Set(Object.keys(fields));

      for (const [name, fdRaw] of Object.entries(fields)) {
        closed(fdRaw, FIELD_KEYS, `types.${letter}.fields.${name}`);
        if (labelRe && !labelRe.test(name)) {
          red(`field name ${name} does not match the field grammar's label group`);
        }
        if (isObj(fdRaw) && isObj(fdRaw.values)) {
          for (const [val, entry] of Object.entries(fdRaw.values)) {
            closed(entry, VALUES_ENTRY_KEYS, `types.${letter}.fields.${name}.values.${val}`);
            if (isObj(entry) && Array.isArray(entry.closed_requires)) {
              for (const f of entry.closed_requires) {
                if (!fieldNames.has(String(f))) red(`${letter}'s closed_requires names ${f}, which is not a declared field`);
              }
            }
          }
        }
      }

      for (const mapName of ["event_fields", "optional_event_fields"] as const) {
        const map = tRaw[mapName];
        if (!isObj(map)) continue;
        for (const [kind, list] of Object.entries(map)) {
          if (!events.includes(kind)) red(`${letter}'s ${mapName} keys ${kind}, which is not a declared event`);
          if (Array.isArray(list)) {
            for (const f of list) {
              if (!fieldNames.has(String(f))) red(`${letter}'s ${mapName} names ${f}, which is not a declared field`);
            }
          }
        }
      }

      const dRow = derivation[letter];
      const tRow = transitions[letter];
      if (events.length > 0) {
        if (!isObj(dRow)) red(`${letter} declares events and has no status_derivation`);
        if (!isObj(tRow)) red(`${letter} declares events and has no transitions`);
      }
      if (isObj(dRow)) {
        for (const k of Object.keys(dRow)) {
          if (k !== "none" && !events.includes(k)) red(`${letter}'s derivation keys ${k}, which is not a declared event`);
        }
        for (const e of ["none", ...events]) {
          if (!(e in dRow)) red(`${letter}'s derivation is not total: ${e} is missing`);
        }
      }
      if (isObj(tRow)) {
        const states = isObj(dRow) ? new Set(Object.values(dRow).map(String)) : new Set<string>();
        for (const k of Object.keys(tRow)) {
          if (!events.includes(k)) red(`${letter}'s transitions key ${k}, which is not a declared event`);
        }
        for (const e of events) {
          if (!(e in tRow)) red(`${letter}'s transitions are not total: ${e} is missing`);
        }
        for (const [k, list] of Object.entries(tRow)) {
          if (!Array.isArray(list)) continue;
          for (const s of list) {
            if (!states.has(String(s))) red(`${letter}'s transitions for ${k} name ${s}, which the derivation never produces`);
          }
        }
      }
    }

    // scope.field names a declared field.
    if (isObj(spec.scope) && typeof spec.scope.field === "string") {
      const declaredAnywhere = Object.values(types).some(
        (t) => isObj(t) && isObj(t.fields) && spec.scope !== null && Object.keys(t.fields as Obj).includes(String((spec.scope as Obj).field)),
      );
      if (!declaredAnywhere) red(`scope.field names ${spec.scope.field}, which no type declares`);
    }

    return v;
  },
};
