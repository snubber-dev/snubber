import { readFileSync } from "node:fs";
import { FORMAT } from "./format.ts";
import { maskCode, extractLinks, fencedLines } from "./md.ts";
import type { Link } from "./md.ts";

// Structure is read from the raw line; the masked line is consulted only to
// know whether that line lies wholly inside code, in which case it is skipped
// for all structural matching (parsing.note). Reading structure from masked
// text would destroy backticked field values.

export type RunEntry = {
  rawKey: string;
  key: string; // the declared spelling where the label matches one case-insensitively
  declared: boolean; // declared by the carrying artifact's type
  value: string;
  line: number;
};

export type EventBlock = {
  kind: string;
  date: string;
  line: number;
  fields: Map<string, string>; // declared fields only — undeclared keys are M-19's, not readers'
  entries: RunEntry[];
  runEmpty: boolean;
};

// A field-shaped line outside every run. Position decides what is a field; the
// rules judge what position leaves over (M-19, M-05's merged red).
export type StrayField = { rawKey: string; key: string; line: number; eventIndex: number | null };

export type DuplicateField = { key: string; line: number; eventIndex: number | null };
export type CaseMismatch = { rawKey: string; key: string; line: number };

export type Ref = { id: string; line: number };

export type Artifact = {
  id: string; // the stem — the identity every rule reads (M-02)
  headingId: string; // what the heading line carries
  type: string; // the stem's letter
  inert: boolean; // stem rejected by the grammar: binds nothing further
  path: string; // repository-root-relative
  dir: string; // root-relative directory, for link resolution
  stem: string;
  headingCount: number;
  headingLines: number[];
  fields: Map<string, string>;
  entries: RunEntry[];
  events: EventBlock[];
  badEventLines: { line: number; text: string }[];
  strayFields: StrayField[];
  duplicateFields: DuplicateField[];
  caseMismatches: CaseMismatch[];
  links: Link[];
  defLines: Set<number>;
  refs: Ref[];
  lines: string[];
  maskedLines: string[];
  fenced: boolean[];
  bodyWords: number;
  masked: string;
};

const STEM_TYPE = /^R-([A-Za-z])-/;

// The grammars are read from the format the current load interprets — never
// captured at module load, because the checked tree's carried copy is the
// authority for that tree.
type Grammars = {
  heading: RegExp;
  field: RegExp;
  event: RegExp;
  eventPrefix: RegExp;
  id: RegExp;
  allDeclared: Map<string, string>;
};
let cacheFor: unknown = null;
let cache: Grammars | null = null;
function grammars(): Grammars {
  if (cacheFor === FORMAT && cache) return cache;
  const allDeclared = new Map<string, string>();
  for (const t of Object.values(FORMAT.types)) {
    for (const name of Object.keys(t.fields ?? {})) allDeclared.set(name.toLowerCase(), name);
  }
  cache = {
    heading: new RegExp(FORMAT.grammar.heading.value),
    field: new RegExp(FORMAT.grammar.field.value),
    event: new RegExp(FORMAT.grammar.event.value),
    eventPrefix: new RegExp(FORMAT.grammar.event_prefix.value),
    id: new RegExp(FORMAT.id.grammar),
    allDeclared,
  };
  cacheFor = FORMAT;
  return cache;
}

// Bare ID references: the masked text tokenises into maximal runs of the
// characters the grammar admits; a token is a reference exactly when the whole
// token matches (parsing.bare_refs). Substrings are never tested.
export function bareRefs(masked: string): Ref[] {
  const ID = grammars().id;
  const refs: Ref[] = [];
  masked.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/[A-Za-z0-9-]+/g)) {
      if (ID.test(m[0])) refs.push({ id: m[0], line: i + 1 });
    }
  });
  return refs;
}

export function parseArtifact(rootRelPath: string, stem: string, dir: string, absPath: string): Artifact {
  const g = grammars();
  // A raw line's content excludes its line ending; CRLF files read as their
  // CommonMark line content, not as lines with a stowaway carriage return.
  const raw = readFileSync(absPath, "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const masked = maskCode(raw);
  const maskedLines = masked.split("\n");
  const fenced = fencedLines(raw);

  const typeLetter = stem.match(STEM_TYPE)?.[1] ?? "";
  const typeDecl = FORMAT.types[typeLetter];
  const ownFields = new Map<string, string>();
  if (typeDecl) for (const name of Object.keys(typeDecl.fields ?? {})) ownFields.set(name.toLowerCase(), name);

  const headingLines: number[] = [];
  let headingId = "";
  const fields = new Map<string, string>();
  const entries: RunEntry[] = [];
  const events: EventBlock[] = [];
  const badEventLines: { line: number; text: string }[] = [];
  const strayFields: StrayField[] = [];
  const duplicateFields: DuplicateField[] = [];
  const caseMismatches: CaseMismatch[] = [];

  // The run state machine. A run begins at the first non-blank structural line
  // after the artifact heading or an event heading, if that line is a field
  // line; otherwise that run is empty. Blank lines inside a run neither close
  // it nor belong to it; the first non-field, non-blank line closes it
  // (parsing.field_position). A line wholly inside code is never matched as a
  // heading, field or event — that is the quoting escape — but to the run
  // structure it is an ordinary non-field, non-blank line: raw-non-blank, it
  // closes the run it follows, the way any body prose would. A fence reads as
  // the body starting.
  let seenHeading = false;
  let awaitingRun = false;
  let inRun = false;
  let sink: { fields: Map<string, string>; entries: RunEntry[]; event: EventBlock | null } | null = null;
  let currentEventIndex: number | null = null;

  // The label is compared as written — case-insensitively and nothing more; a
  // trailing or doubled space is not a spelling any declaration uses.
  const canonical = (rawKey: string): { key: string; declared: boolean } => {
    const own = ownFields.get(rawKey.toLowerCase());
    if (own) return { key: own, declared: true };
    return { key: g.allDeclared.get(rawKey.toLowerCase()) ?? rawKey, declared: false };
  };

  const closeRun = () => {
    awaitingRun = false;
    inRun = false;
    sink = null;
  };

  lines.forEach((line, i) => {
    const ln = i + 1;
    const wholeCode = line.trim() !== "" && (maskedLines[i] ?? "").trim() === "";

    const h = wholeCode ? null : line.match(g.heading);
    if (h && !seenHeading) {
      seenHeading = true;
      // Grammar regexes come from the carried spec; a grammar whose heading
      // pattern lacks the capture group reads as an empty heading ID.
      headingId = h[1] ?? "";
      headingLines.push(ln);
      awaitingRun = true;
      inRun = false;
      sink = { fields, entries, event: null };
      currentEventIndex = null;
      return;
    }
    if (h) {
      headingLines.push(ln);
      closeRun();
      currentEventIndex = null;
      return;
    }

    const blank = line.trim() === "";
    const f = wholeCode ? null : line.match(g.field);

    // Anything before the first heading-grammar line is body — and a declared
    // label there is still outside every run, which is M-19's tripwire.
    if (!seenHeading) {
      // The event grammar has no positional qualifier either (M-08): a line
      // that matches the prefix and misses the grammar is an error wherever
      // it stands. A well-formed event here is body, like everything before
      // the heading (parsing.field_position) — it opens no block.
      if (!wholeCode && g.eventPrefix.test(line) && !line.match(g.event)) {
        badEventLines.push({ line: ln, text: line });
        return;
      }
      if (f && !blank) {
        const rawKey = f[1] ?? "";
        const key = g.allDeclared.get(rawKey.toLowerCase());
        if (key !== undefined) {
          strayFields.push({ rawKey, key, line: ln, eventIndex: null });
        }
      }
      return;
    }

    if (!wholeCode && g.eventPrefix.test(line)) {
      const e = line.match(g.event);
      if (!e) {
        badEventLines.push({ line: ln, text: line });
        // An error, never prose — and never an event: it opens no block. To
        // the run structure it is an ordinary non-field, non-blank line, and
        // it closes whatever run was open or awaited.
        closeRun();
        return;
      }
      const block: EventBlock = { kind: e[1] ?? "", date: e[2] ?? "", line: ln, fields: new Map(), entries: [], runEmpty: true };
      events.push(block);
      currentEventIndex = events.length - 1;
      awaitingRun = true;
      inRun = false;
      sink = { fields: block.fields, entries: block.entries, event: block };
      return;
    }

    if (awaitingRun) {
      if (blank) return;
      awaitingRun = false;
      if (f && sink) {
        inRun = true;
      } else {
        inRun = false;
        sink = null; // that run is empty
      }
    }

    if (inRun && sink) {
      if (blank) return; // inside a run a blank neither closes nor belongs
      if (f) {
        const rawKey = f[1] ?? "";
        const value = (f[2] ?? "").trim();
        const { key, declared } = canonical(rawKey);
        if (declared && key !== rawKey) caseMismatches.push({ rawKey, key, line: ln });
        // Only declared fields reach the readers; an undeclared key inside a
        // run is M-19's violation and no rule's input.
        if (declared) {
          if (sink.fields.has(key)) duplicateFields.push({ key, line: ln, eventIndex: currentEventIndex });
          else sink.fields.set(key, value);
        }
        sink.entries.push({ rawKey, key, declared, value, line: ln });
        if (sink.event) sink.event.runEmpty = false;
        return;
      }
      inRun = false;
      sink = null;
    }

    // Outside a run this is prose, unless it is field-shaped with a declared
    // label — any type's — which is M-19's tripwire, or M-05's merged red when
    // it stands inside an event block whose run is empty.
    if (f && !blank) {
      const rawKey = f[1] ?? "";
      const key = g.allDeclared.get(rawKey.toLowerCase());
      if (key !== undefined) {
        strayFields.push({
          rawKey,
          key,
          line: ln,
          eventIndex: currentEventIndex,
        });
      }
    }
  });

  const { links, defLines } = extractLinks(masked);

  // Body words, as limits.word defines: maximal runs of non-whitespace in the
  // masked text, counted from the first body line that is non-field and
  // non-blank as raw text to the end of the file. Body includes anything
  // before the heading; the opening field run is free; event headings and the
  // fields inside event blocks count; a masked-blank line can start the count
  // and contributes nothing.
  const runLines = new Set(entries.map((e) => e.line));
  const headLine = headingLines[0] ?? -1;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 === headLine) continue;
    if (runLines.has(i + 1)) continue;
    const l = lines[i] ?? "";
    if (l.trim() === "") continue;
    if (g.field.test(l)) continue;
    start = i;
    break;
  }
  let bodyWords = 0;
  if (start >= 0) {
    for (let i = start; i < maskedLines.length; i++) {
      if (runLines.has(i + 1)) continue; // the opening field run is free
      bodyWords += (maskedLines[i] ?? "").split(/\s+/).filter(Boolean).length;
    }
  }

  return {
    id: stem,
    headingId,
    type: typeLetter,
    inert: !g.id.test(stem),
    path: rootRelPath,
    dir,
    stem,
    headingCount: headingLines.length,
    headingLines,
    fields,
    entries,
    events,
    badEventLines,
    strayFields,
    duplicateFields,
    caseMismatches,
    links,
    defLines,
    refs: bareRefs(masked),
    lines,
    maskedLines,
    fenced,
    bodyWords,
    masked,
  };
}
