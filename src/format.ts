import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// The shape below mirrors spec/format.json, which is the authority; nothing
// mechanical is restated here. Rules that judge the spec file itself (M-22,
// M-27, M-28) read the raw parsed JSON, not this type — a closed-set check
// cannot run over a type that has already discarded unknown keys.

export type FieldDecl = {
  required?: boolean;
  read_by?: string[];
  values?: Record<string, { closed_requires?: string[] }>;
  shape?: string;
  date?: boolean;
  min_length?: number;
};

export type TypeDecl = {
  name: string;
  home: string;
  mutable: boolean;
  events: string[];
  event_fields?: Record<string, string[]>;
  optional_event_fields?: Record<string, string[]>;
  fields: Record<string, FieldDecl>;
};

export type GrammarEntry = { value: string; mirrors: string[]; asserted_by?: string };

export type Format = {
  format: string;
  version: string;
  note?: string;
  base?: { vcs: string; forge: string; note: string };
  id: { grammar: string; mirrors?: string[]; asserted_by?: string; note?: string; filename?: string };
  context?: { file: string; sentinel: string; note?: string };
  types: Record<string, TypeDecl>;
  grammar: {
    heading: GrammarEntry;
    field: GrammarEntry;
    event: GrammarEntry;
    event_prefix: GrammarEntry;
    date: GrammarEntry;
  };
  status_derivation: { note?: string } & Record<string, Record<string, string> | string | undefined>;
  transitions: { note?: string } & Record<string, Record<string, string[]> | string | undefined>;
  scope: { field: string; value: string; glob_dialect: Record<string, unknown> };
  limits: { line_length: number; work_words: number; word?: string };
  rules: { id: string; name: string; text: string }[];
  parsing: Record<string, string>;
};

const raw = readFileSync(resolve(here, "..", "spec", "format.json"), "utf8");

// The shipped copy is parsed at import, so a shipped copy that will not
// parse must stop here, with the stated behaviour — silence with an error
// code (spec/v0.md) — never a raw stack trace from the module loader. In
// this repository the shipped and carried copies are the same file
// (R-D-one-repository), so this is the parse that meets the broken file.
function parseShipped(): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`spec/format.json does not parse: ${(e as Error).message}; the checker has nothing to interpret`);
    process.exit(2);
  }
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const isStrArr = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === "string");

// The spec is read as the shape the checker declares, once, at the boundary,
// before any rule runs (R-D-spec-read-as-ruled): every indexed read the
// checker will perform must be answerable — presence where the read is
// unconditional (types, grammar, limits, rules), shape wherever a value
// stands. A spec that fails here is never interpreted, and the returned
// message names the path that failed. Incoherence within a readable shape —
// an unknown key, a partial map, a mirror that disagrees — is deliberately
// not this gate's business: that is the spec rules' red (M-22, M-27, M-28),
// reported as violations, never improvised around (spec/v0.md).
export function unreadableAt(spec: unknown): string | null {
  if (!isObj(spec)) return "the spec is not an object";
  if (!isObj(spec.id) || typeof spec.id.grammar !== "string") return "id.grammar is not a string";
  if (!isObj(spec.grammar)) return "grammar is not an object";
  for (const g of ["heading", "field", "event", "event_prefix", "date"]) {
    const e = spec.grammar[g];
    if (!isObj(e) || typeof e.value !== "string") return `grammar.${g}.value is not a string`;
  }
  if (!isObj(spec.types)) return "types is not an object";
  for (const [letter, t] of Object.entries(spec.types)) {
    const at = `types.${letter}`;
    if (!isObj(t)) return `${at} is not an object`;
    if (typeof t.name !== "string") return `${at}.name is not a string`;
    if (typeof t.home !== "string") return `${at}.home is not a string`;
    if (typeof t.mutable !== "boolean") return `${at}.mutable is not a boolean`;
    if (!isStrArr(t.events)) return `${at}.events is not an array of strings`;
    for (const m of ["event_fields", "optional_event_fields"]) {
      const map = t[m];
      if (map === undefined) continue;
      if (!isObj(map)) return `${at}.${m} is not an object`;
      for (const [ev, names] of Object.entries(map)) {
        if (!isStrArr(names)) return `${at}.${m}.${ev} is not an array of strings`;
      }
    }
    if (!isObj(t.fields)) return `${at}.fields is not an object`;
    for (const [fname, f] of Object.entries(t.fields)) {
      const fat = `${at}.fields.${fname}`;
      if (!isObj(f)) return `${fat} is not an object`;
      if (f.required !== undefined && typeof f.required !== "boolean") return `${fat}.required is not a boolean`;
      if (f.date !== undefined && typeof f.date !== "boolean") return `${fat}.date is not a boolean`;
      if (f.min_length !== undefined && typeof f.min_length !== "number") return `${fat}.min_length is not a number`;
      if (f.shape !== undefined && typeof f.shape !== "string") return `${fat}.shape is not a string`;
      if (f.read_by !== undefined && !isStrArr(f.read_by)) return `${fat}.read_by is not an array of strings`;
      if (f.values !== undefined) {
        if (!isObj(f.values)) return `${fat}.values is not an object`;
        for (const [val, entry] of Object.entries(f.values)) {
          if (!isObj(entry)) return `${fat}.values.${val} is not an object`;
          if (entry.closed_requires !== undefined && !isStrArr(entry.closed_requires)) {
            return `${fat}.values.${val}.closed_requires is not an array of strings`;
          }
        }
      }
    }
  }
  if (!isObj(spec.limits) || typeof spec.limits.line_length !== "number") return "limits.line_length is not a number";
  if (typeof spec.limits.work_words !== "number") return "limits.work_words is not a number";
  if (!Array.isArray(spec.rules)) return "rules is not an array";
  for (let i = 0; i < spec.rules.length; i++) {
    const r: unknown = spec.rules[i];
    if (!isObj(r) || typeof r.id !== "string" || typeof r.name !== "string" || typeof r.text !== "string") {
      return `rules[${i}] is not an object with string id, name and text`;
    }
  }
  for (const section of ["status_derivation", "transitions"] as const) {
    const m = spec[section];
    if (!isObj(m)) return `${section} is not an object`;
    for (const [k, entry] of Object.entries(m)) {
      if (k === "note" || entry === undefined || typeof entry === "string") continue;
      if (!isObj(entry)) return `${section}.${k} is not an object`;
      for (const [ev, s] of Object.entries(entry)) {
        if (section === "status_derivation" && typeof s !== "string") return `status_derivation.${k}.${ev} is not a string`;
        if (section === "transitions" && !isStrArr(s)) return `transitions.${k}.${ev} is not an array of strings`;
      }
    }
  }
  if (!isObj(spec.scope) || typeof spec.scope.field !== "string") return "scope.field is not a string";
  if (spec.context !== undefined) {
    if (!isObj(spec.context) || typeof spec.context.file !== "string" || typeof spec.context.sentinel !== "string") {
      return "context is not an object with string file and sentinel";
    }
  }
  return null;
}

// The shipped copy is read through the same gate as a carried one — a
// shipped copy the checker cannot read as its shape is the same stop, at
// import, with the stated behaviour: silence with an error code, never a
// crash on a later read.
const shippedRaw: unknown = parseShipped();
{
  const bad = unreadableAt(shippedRaw);
  if (bad !== null) {
    console.error(`spec/format.json ${bad}; the checker reads the spec as the shape it declares — restore the value`);
    process.exit(2);
  }
}
export const SHIPPED: Format = shippedRaw as Format;

// The untyped view of the shipped copy, for the spec-judging rules.
export const FORMAT_RAW: unknown = parseShipped();

// A record ships its spec, and a checker is an interpreter of that copy,
// never an authority over it (spec/v0.md): when the checked tree carries a
// spec/format.json, every rule reads that copy. FORMAT is a live binding;
// load() points it at the tree's copy before parsing anything.
export let FORMAT: Format = SHIPPED;

// Adopts a spec after the boundary read, or returns the path that failed
// it. No fallback: a tree carrying a spec is judged by that spec or not at
// all — judging it by the shipped copy instead would be a verdict from an
// authority the tree never carried (R-D-spec-read-as-ruled). The cast below
// is the gate's own statement, made once, after every read it stands for
// has been answered — never a promise the input has not kept.
export function setFormat(spec: unknown): string | null {
  const bad = unreadableAt(spec);
  if (bad !== null) return bad;
  FORMAT = spec as Format;
  return null;
}

export function derivationFor(type: string): Record<string, string> | undefined {
  const t = FORMAT.status_derivation[type];
  return typeof t === "object" ? t : undefined;
}

export function transitionsFor(type: string): Record<string, string[]> | undefined {
  const t = FORMAT.transitions[type];
  return typeof t === "object" ? (t as Record<string, string[]>) : undefined;
}
